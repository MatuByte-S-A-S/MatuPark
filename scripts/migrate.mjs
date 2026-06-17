/**
 * Ejecuta migraciones SQL pendientes en MatuDB.
 * Uso: npm run migrate
 */
import { readFileSync, existsSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'
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

const url = process.env.VITE_MATUDB_URL
const projectId = process.env.VITE_MATUDB_PROJECT_ID
const apiKey = process.env.VITE_MATUDB_API_KEY

if (!url || !projectId || !apiKey) {
  console.error('Faltan variables en .env: VITE_MATUDB_URL, VITE_MATUDB_PROJECT_ID, VITE_MATUDB_API_KEY')
  process.exit(1)
}

const db = createClient({ url, projectId, apiKey })

const migrations = [
  'database/migrations/002_cash.sql',
  'database/migrations/003_currency.sql',
]

async function runSql(label, sql) {
  const statements = sql
    .split(';')
    .map((s) => s.replace(/^\s*--[^\n]*\n?/gm, '').trim())
    .filter(Boolean)

  for (const statement of statements) {
    const { error } = await db.rpc(statement)
    if (error) {
      console.error(`✗ ${label}`)
      console.error(`  ${error.message}`)
      console.error(`  SQL: ${statement.slice(0, 160)}…`)
      throw error
    }
  }
  console.log(`✓ ${label}`)
}

async function main() {
  console.log('Migrando MatuDB (caja + moneda)…\n')

  for (const file of migrations) {
    const sql = readFileSync(join(root, file), 'utf8')
    await runSql(file, sql)
  }

  const { data, error } = await db.rpc(
    "SELECT table_name FROM information_schema.tables WHERE table_schema = 'public' AND table_name IN ('cash_sessions', 'cash_movements') ORDER BY table_name"
  )
  if (error) throw error
  console.log('\nTablas OK:', (data ?? []).map((r) => r.table_name).join(', '))
  console.log('\nRecuerda habilitar realtime en: cash_sessions, cash_movements')
}

main().catch((err) => {
  console.error('\nMigración fallida:', err.message || err)
  process.exit(1)
})
