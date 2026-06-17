/**
 * API de facturación MatuPark → PayMatuByte
 * Ejecutar: node server/billing-api.mjs
 * En dev, Vite hace proxy de /api → este servidor.
 */
import { createServer, request as httpRequest } from 'node:http'
import { request as httpsRequest } from 'node:https'
import { readFileSync, existsSync } from 'node:fs'
import { createCipheriv, createDecipheriv, randomBytes, scryptSync } from 'node:crypto'
import { fileURLToPath } from 'node:url'
import { dirname, join, resolve } from 'node:path'
import { createClient } from '@devjuanes/matuclient'

const __dirname = dirname(fileURLToPath(import.meta.url))
const root = join(__dirname, '..')

function loadEnv() {
  const path = join(root, '.env')
  if (!existsSync(path)) return
  const raw = readFileSync(path, 'utf8').replace(/^\uFEFF/, '')
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim()
    if (!trimmed || trimmed.startsWith('#')) continue
    const eq = trimmed.indexOf('=')
    if (eq === -1) continue
    const key = trimmed.slice(0, eq).trim()
    let val = trimmed.slice(eq + 1).trim()
    if (
      (val.startsWith('"') && val.endsWith('"')) ||
      (val.startsWith("'") && val.endsWith("'"))
    ) {
      val = val.slice(1, -1)
    }
    process.env[key] ??= val
  }
}

loadEnv()

const PORT = Number(process.env.BILLING_API_PORT || 3001)
const PAYMATUBYTE_URL = (process.env.PAYMATUBYTE_URL || 'https://pay.matubyte.com').replace(/\/$/, '')
const PAYMATUBYTE_API_KEY = process.env.PAYMATUBYTE_API_KEY || ''
/** Si PAYMATUBYTE_URL es IP (DNS aún no propagado), nginx necesita Host: pay.matubyte.com */
const PAYMATUBYTE_HOST = process.env.PAYMATUBYTE_HOST || ''

const MATUDB_URL = process.env.VITE_MATUDB_URL
const MATUDB_PROJECT_ID = process.env.VITE_MATUDB_PROJECT_ID
const MATUDB_API_KEY = process.env.VITE_MATUDB_API_KEY
const APP_URL = (process.env.VITE_APP_URL || 'http://localhost:5173').replace(/\/$/, '')

if (!PAYMATUBYTE_API_KEY) {
  console.warn('[billing-api] PAYMATUBYTE_API_KEY no configurada — checkout fallará')
}

const db =
  MATUDB_URL && MATUDB_PROJECT_ID && MATUDB_API_KEY
    ? createClient({ url: MATUDB_URL, projectId: MATUDB_PROJECT_ID, apiKey: MATUDB_API_KEY })
    : null

const PLANS = {
  'plan-mensual': { months: 1, amount: 27000, name: 'MatuPark Mensual' },
  'plan-semestral': { months: 6, amount: 145800, name: 'MatuPark Semestral' },
  'plan-anual': { months: 12, amount: 259200, name: 'MatuPark Anual' },
}

const PAID_STATUSES = new Set(['PAID', 'APPROVED', 'SALE_APPROVED'])

function slugify(text) {
  return String(text)
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
    .slice(0, 60)
}

function getSignupKey() {
  const secret = process.env.SIGNUP_SECRET || MATUDB_API_KEY || 'matupark-dev-signup-key'
  return scryptSync(secret, 'matupark-signup-v1', 32)
}

function encryptPassword(plain) {
  const iv = randomBytes(12)
  const cipher = createCipheriv('aes-256-gcm', getSignupKey(), iv)
  const enc = Buffer.concat([cipher.update(plain, 'utf8'), cipher.final()])
  const tag = cipher.getAuthTag()
  return Buffer.concat([iv, tag, enc]).toString('base64')
}

function decryptPassword(encoded) {
  const buf = Buffer.from(encoded, 'base64')
  const iv = buf.subarray(0, 12)
  const tag = buf.subarray(12, 28)
  const data = buf.subarray(28)
  const decipher = createDecipheriv('aes-256-gcm', getSignupKey(), iv)
  decipher.setAuthTag(tag)
  return Buffer.concat([decipher.update(data), decipher.final()]).toString('utf8')
}

async function uniqueParkingSlug(baseName) {
  let slug = slugify(baseName) || 'parqueadero'
  let attempt = 0
  while (attempt < 10) {
    const candidate = attempt === 0 ? slug : `${slug}-${attempt}`
    const { data } = await db.from('parking_lots').select('id').eq('slug', candidate).limit(1)
    if (!data?.length) return candidate
    attempt++
  }
  return `${slug}-${Date.now().toString(36)}`
}

async function emailTaken(email) {
  const { data } = await db.from('users').select('id').eq('email', email).limit(1)
  if (data?.length) return true
  const { data: pending } = await db
    .from('pending_signups')
    .select('id')
    .eq('email', email)
    .eq('status', 'completed')
    .limit(1)
  return !!pending?.length
}

async function createAccountFromSignup(pending, payment) {
  const email = pending.email.trim().toLowerCase()
  const password = decryptPassword(pending.password_enc)
  const plan = PLANS[pending.plan_id]
  if (!plan) throw new Error('Plan desconocido')

  if (await emailTaken(email)) {
    throw new Error('Este correo ya está registrado')
  }

  const { data: signUpData, error: signUpErr } = await db.auth.signUp({
    email,
    password,
    options: { data: { name: pending.full_name } },
  })

  if (signUpErr || !signUpData.user?.id) {
    throw new Error(signUpErr?.message || 'No se pudo crear la cuenta de acceso')
  }

  const userId = signUpData.user.id
  const slug = await uniqueParkingSlug(email.split('@')[0] || 'parqueadero')

  const { error: lotErr } = await db.from('parking_lots').insert({
    slug,
    name: 'Mi parqueadero',
    address: '',
    phone: '',
    nit: '',
    is_open: true,
    schedule: 'Lun - Dom: 24 horas',
  })

  if (lotErr) throw new Error(lotErr.message || 'No se pudo crear el parqueadero')

  const { data: lotRows } = await db.from('parking_lots').select('id').eq('slug', slug).limit(1)
  const parkingLotId = lotRows?.[0]?.id
  if (!parkingLotId) throw new Error('No se pudo obtener el parqueadero creado')

  const { error: settingsErr } = await db.from('settings').insert({
    parking_lot_id: parkingLotId,
    max_cars: 0,
    max_motos: 0,
    rate_car_hour: 5000,
    rate_moto_hour: 3000,
    tolerance_minutes: 10,
    billing_mode: 'full_hour',
  })
  if (settingsErr) throw new Error(settingsErr.message || 'No se pudo crear la configuración')

  const { error: profileErr } = await db.from('users').insert({
    id: userId,
    email,
    full_name: pending.full_name,
    role: 'admin',
    parking_lot_id: parkingLotId,
  })
  if (profileErr) throw new Error(profileErr.message || 'No se pudo guardar el perfil')

  const now = new Date()
  const expiresAt = addMonths(now, plan.months)
  const paidAt = now.toISOString()

  await db.from('subscriptions').insert({
    parking_lot_id: parkingLotId,
    plan_id: pending.plan_id,
    status: 'active',
    payment_reference: pending.payment_reference,
    amount: plan.amount,
    currency: 'COP',
    link_id: payment.id ?? pending.link_id,
    transaction_id: payment.transaction_id ?? null,
    starts_at: paidAt,
    expires_at: expiresAt.toISOString(),
    paid_at: paidAt,
  })

  await db
    .from('pending_signups')
    .eq('id', pending.id)
    .update({
      status: 'completed',
      parking_lot_id: parkingLotId,
      user_id: userId,
      completed_at: paidAt,
    })

  if (!signUpData.session) {
    await db.auth.signInWithPassword({ email, password })
  }

  return { email, parkingLotId, userId }
}

function json(res, status, body) {
  res.writeHead(status, {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type',
  })
  res.end(JSON.stringify(body))
}

async function readBody(req) {
  const chunks = []
  for await (const chunk of req) chunks.push(chunk)
  if (!chunks.length) return {}
  try {
    return JSON.parse(Buffer.concat(chunks).toString('utf8'))
  } catch {
    return null
  }
}

function paymatuRequest(path, { method = 'GET', body } = {}) {
  return new Promise((resolve, reject) => {
    const base = new URL(PAYMATUBYTE_URL)
    const isHttps = base.protocol === 'https:'
    const lib = isHttps ? httpsRequest : httpRequest
    const payload = body != null ? (typeof body === 'string' ? body : JSON.stringify(body)) : null

    const headers = {
      Authorization: `Bearer ${PAYMATUBYTE_API_KEY}`,
      Accept: 'application/json',
    }
    if (payload) {
      headers['Content-Type'] = 'application/json'
      headers['Content-Length'] = String(Buffer.byteLength(payload))
    }
    if (PAYMATUBYTE_HOST) {
      headers.Host = PAYMATUBYTE_HOST
    }

    const req = lib(
      {
        hostname: base.hostname,
        port: base.port || (isHttps ? 443 : 80),
        path,
        method,
        headers,
      },
      (res) => {
        const chunks = []
        res.on('data', (c) => chunks.push(c))
        res.on('end', () => {
          const text = Buffer.concat(chunks).toString('utf8')
          let data = {}
          try {
            data = text ? JSON.parse(text) : {}
          } catch {
            data = { message: text.slice(0, 200) }
          }
          if ((res.statusCode ?? 500) >= 400) {
            const msg = data.message || data.error || res.statusMessage || 'Error PayMatuByte'
            const hint =
              res.statusCode === 401
                ? ' Verifica PAYMATUBYTE_API_KEY y que pay.matubyte.com apunte al VPS (13.140.160.248).'
                : ''
            reject(new Error(`${msg}${hint}`))
            return
          }
          resolve(data)
        })
      }
    )
    req.on('error', reject)
    if (payload) req.write(payload)
    req.end()
  })
}

async function paymatuFetch(path, options = {}) {
  if (PAYMATUBYTE_HOST) {
    return paymatuRequest(path, { method: options.method || 'GET', body: options.body })
  }

  const headers = {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${PAYMATUBYTE_API_KEY}`,
    ...(options.headers || {}),
  }

  const res = await fetch(`${PAYMATUBYTE_URL}${path}`, {
    ...options,
    headers,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const msg =
      data.message ||
      data.error ||
      res.statusText ||
      'Error al contactar PayMatuByte'
    const hint =
      res.status === 401
        ? ' Verifica PAYMATUBYTE_API_KEY en .env y que pay.matubyte.com apunte al VPS nuevo (13.140.160.248).'
        : ''
    throw new Error(`${msg}${hint}`)
  }
  return data
}

function addMonths(date, months) {
  const d = new Date(date)
  d.setMonth(d.getMonth() + months)
  return d
}

async function getActiveSubscription(parkingLotId) {
  if (!db) return null
  const { data } = await db
    .from('subscriptions')
    .select('*')
    .eq('parking_lot_id', parkingLotId)
    .in('status', ['active', 'pending'])
    .order('created_at', { ascending: false })
    .limit(1)
  const rows = data ?? []
  return rows[0] ?? null
}

async function activatePaidSubscription(row, paymentStatus) {
  if (!db || !row) return null
  const plan = PLANS[row.plan_id]
  if (!plan) throw new Error('Plan desconocido')

  const now = new Date()
  const current = await db
    .from('subscriptions')
    .select('*')
    .eq('parking_lot_id', row.parking_lot_id)
    .eq('status', 'active')
    .order('expires_at', { ascending: false })
    .limit(1)

  const activeRow = current.data?.[0]
  let startsAt = now
  if (activeRow?.expires_at && new Date(activeRow.expires_at) > now) {
    startsAt = new Date(activeRow.expires_at)
  }

  const expiresAt = addMonths(startsAt, plan.months)
  const paidAt = now.toISOString()

  if (activeRow && activeRow.id !== row.id) {
    await db
      .from('subscriptions')
      .eq('id', activeRow.id)
      .update({ status: 'expired', updated_at: paidAt })
  }

  await db
    .from('subscriptions')
    .eq('id', row.id)
    .update({
      status: 'active',
      paid_at: paidAt,
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
      updated_at: paidAt,
      transaction_id: paymentStatus.transaction_id ?? row.transaction_id,
      link_id: paymentStatus.id ?? row.link_id,
    })

  const { data: updatedRows } = await db
    .from('subscriptions')
    .select('*')
    .eq('id', row.id)
    .limit(1)

  return updatedRows?.[0] ?? null
}

export async function handleBillingRequest(req, res) {
  if (req.method === 'OPTIONS') {
    json(res, 204, {})
    return
  }

  const url = new URL(req.url || '/', `http://${req.headers.host}`)

  if (!url.pathname.startsWith('/api/billing')) {
    json(res, 404, { error: 'Not found' })
    return
  }

  try {
    if (req.method === 'GET' && url.pathname === '/api/billing/health') {
      json(res, 200, {
        ok: true,
        paymatubyte: PAYMATUBYTE_URL,
        matudb: !!db,
      })
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/billing/plans') {
      json(res, 200, {
        plans: Object.entries(PLANS).map(([id, p]) => ({
          id,
          ...p,
          currency: 'COP',
        })),
        monthlyPrice: 27000,
      })
      return
    }

    if (req.method === 'GET' && url.pathname === '/api/billing/subscription') {
      const parkingLotId = url.searchParams.get('parkingLotId')
      if (!parkingLotId || !db) {
        json(res, 400, { error: 'parkingLotId requerido' })
        return
      }

      const { data } = await db
        .from('subscriptions')
        .select('*')
        .eq('parking_lot_id', parkingLotId)
        .order('created_at', { ascending: false })
        .limit(5)

      const rows = data ?? []
      const active =
        rows.find((r) => r.status === 'active' && r.expires_at && new Date(r.expires_at) > new Date()) ??
        rows.find((r) => r.status === 'active')

      json(res, 200, { subscription: active ?? null, history: rows })
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/billing/checkout') {
      const body = await readBody(req)
      if (!body) {
        json(res, 400, { error: 'JSON inválido' })
        return
      }

      const { parkingLotId, planId, lotName } = body
      const plan = PLANS[planId]
      if (!parkingLotId || !plan) {
        json(res, 400, { error: 'parkingLotId y planId válidos son requeridos' })
        return
      }
      if (!db || !PAYMATUBYTE_API_KEY) {
        json(res, 503, { error: 'Servicio de pagos no configurado' })
        return
      }

      const reference = `MP-${String(parkingLotId).slice(0, 8)}-${Date.now()}`
      const description = `${plan.name}${lotName ? ` — ${lotName}` : ''}`
      const returnUrl = `${APP_URL}/premium/pago-resultado`

      const { error: insertErr } = await db.from('subscriptions').insert({
        parking_lot_id: parkingLotId,
        plan_id: planId,
        status: 'pending',
        payment_reference: reference,
        amount: plan.amount,
        currency: 'COP',
      })

      if (insertErr) {
        json(res, 500, { error: insertErr.message })
        return
      }

      const payRes = await paymatuFetch('/v1/payment', {
        method: 'POST',
        body: JSON.stringify({
          productId: planId,
          reference,
          license: parkingLotId,
          description,
          returnUrl,
        }),
      })

      const checkout = payRes.data
      const { data: pendingRows } = await db
        .from('subscriptions')
        .select('id')
        .eq('payment_reference', reference)
        .limit(1)

      const pending = pendingRows?.[0]
      if (pending?.id && checkout?.link_id) {
        await db
          .from('subscriptions')
          .eq('id', pending.id)
          .update({ link_id: checkout.link_id, updated_at: new Date().toISOString() })
      }

      json(res, 200, {
        checkoutUrl: checkout.url,
        reference: checkout.reference ?? reference,
        amount: checkout.amount ?? plan.amount,
        currency: checkout.currency ?? 'COP',
      })
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/billing/signup-checkout') {
      const body = await readBody(req)
      if (!body) {
        json(res, 400, { error: 'JSON inválido' })
        return
      }

      const { fullName, email, password, planId } = body
      const plan = PLANS[planId]
      const normalizedEmail = String(email || '')
        .trim()
        .toLowerCase()

      if (!fullName?.trim() || !normalizedEmail || !password || password.length < 6 || !plan) {
        json(res, 400, { error: 'Nombre, correo, contraseña (mín. 6) y plan válidos son requeridos' })
        return
      }
      if (!db || !PAYMATUBYTE_API_KEY) {
        json(res, 503, { error: 'Servicio de pagos no configurado' })
        return
      }
      if (await emailTaken(normalizedEmail)) {
        json(res, 409, { error: 'Este correo ya está registrado' })
        return
      }

      const reference = `SIGNUP-${Date.now()}-${randomBytes(4).toString('hex')}`
      const returnUrl = `${APP_URL}/register/pago-resultado`

      const { error: insertErr } = await db.from('pending_signups').insert({
        email: normalizedEmail,
        full_name: fullName.trim(),
        password_enc: encryptPassword(password),
        plan_id: planId,
        payment_reference: reference,
        status: 'pending',
      })

      if (insertErr) {
        json(res, 500, { error: insertErr.message })
        return
      }

      const payRes = await paymatuFetch('/v1/payment', {
        method: 'POST',
        body: JSON.stringify({
          productId: planId,
          reference,
          license: normalizedEmail,
          description: `${plan.name} — ${fullName.trim()}`,
          returnUrl,
        }),
      })

      const checkout = payRes.data
      if (checkout?.link_id) {
        await db
          .from('pending_signups')
          .eq('payment_reference', reference)
          .update({ link_id: checkout.link_id })
      }

      json(res, 200, {
        checkoutUrl: checkout.url,
        reference: checkout.reference ?? reference,
        amount: checkout.amount ?? plan.amount,
        currency: checkout.currency ?? 'COP',
      })
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/billing/signup-confirm') {
      const body = await readBody(req)
      if (!body?.reference) {
        json(res, 400, { error: 'reference requerida' })
        return
      }
      if (!db || !PAYMATUBYTE_API_KEY) {
        json(res, 503, { error: 'Servicio de pagos no configurado' })
        return
      }

      const { reference } = body
      const { data: rows } = await db
        .from('pending_signups')
        .select('*')
        .eq('payment_reference', reference)
        .limit(1)

      const pending = rows?.[0]
      if (!pending) {
        json(res, 404, { error: 'Registro no encontrado' })
        return
      }

      if (pending.status === 'completed') {
        json(res, 200, {
          paid: true,
          accountCreated: true,
          email: pending.email,
          alreadyCompleted: true,
        })
        return
      }

      const payStatus = await paymatuFetch(`/v1/payments/${encodeURIComponent(reference)}`)
      const payment = payStatus.data ?? payStatus
      const status = String(payment.status ?? '').toUpperCase()
      const paid = PAID_STATUSES.has(status)

      if (!paid) {
        json(res, 200, { paid: false, status, accountCreated: false })
        return
      }

      await db.from('pending_signups').eq('id', pending.id).update({ status: 'paid' })

      const account = await createAccountFromSignup(pending, payment)
      json(res, 200, {
        paid: true,
        status,
        accountCreated: true,
        email: account.email,
      })
      return
    }

    if (req.method === 'POST' && url.pathname === '/api/billing/confirm') {
      const body = await readBody(req)
      if (!body?.reference) {
        json(res, 400, { error: 'reference requerida' })
        return
      }
      if (!db || !PAYMATUBYTE_API_KEY) {
        json(res, 503, { error: 'Servicio de pagos no configurado' })
        return
      }

      const { reference } = body
      const payStatus = await paymatuFetch(`/v1/payments/${encodeURIComponent(reference)}`)
      const payment = payStatus.data ?? payStatus
      const status = String(payment.status ?? '').toUpperCase()
      const paid = PAID_STATUSES.has(status)

      const { data: rows } = await db
        .from('subscriptions')
        .select('*')
        .eq('payment_reference', reference)
        .limit(1)

      const row = rows?.[0]
      if (!row) {
        json(res, 404, { error: 'Suscripción no encontrada para esta referencia' })
        return
      }

      if (paid && row.status !== 'active') {
        const activated = await activatePaidSubscription(row, payment)
        json(res, 200, {
          paid: true,
          status,
          subscription: activated,
        })
        return
      }

      json(res, 200, {
        paid,
        status,
        subscription: row,
      })
      return
    }

    json(res, 404, { error: 'Not found' })
  } catch (e) {
    const msg = e instanceof Error ? e.message : 'Error inesperado'
    console.error('[billing-api]', msg)
    const status = msg.includes('API key') || msg.includes('PayMatuByte') ? 502 : 500
    json(res, status, { error: msg })
  }
}

export function startBillingServer() {
  const server = createServer((req, res) => {
    void handleBillingRequest(req, res)
  })
  server.listen(PORT, () => {
    console.log(`[billing-api] http://localhost:${PORT}`)
    console.log(`[billing-api] PayMatuByte → ${PAYMATUBYTE_URL}`)
  })
  return server
}

const isMain =
  process.argv[1] &&
  resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))

if (isMain) {
  startBillingServer()
}

console.log(
  `[billing-api] PayMatuByte → ${PAYMATUBYTE_URL}${PAYMATUBYTE_HOST ? ` (Host: ${PAYMATUBYTE_HOST})` : ''}`
)
