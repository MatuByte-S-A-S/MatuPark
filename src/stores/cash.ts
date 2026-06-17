import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { matudb } from '@/lib/matudb'
import { fetchRow, rowFromWrite, updateRow } from '@/lib/matudbHelpers'
import { buildCashLedger, paymentStats, incomeByMethod } from '@/utils/cashLedger'
import { toAmount } from '@/utils/currency'
import type { CashLedgerEntry, CashMovement, CashSession, PaymentMethod, SessionPaymentDetail } from '@/types'
import { useAuthStore } from './auth'

function normalizeSession(row: CashSession): CashSession {
  return {
    ...row,
    opening_amount: toAmount(row.opening_amount),
    closing_amount: row.closing_amount != null ? toAmount(row.closing_amount) : null,
    expected_amount: row.expected_amount != null ? toAmount(row.expected_amount) : null,
  }
}

export const useCashStore = defineStore('cash', () => {
  const openSession = ref<CashSession | null>(null)
  const movements = ref<CashMovement[]>([])
  const sessionPayments = ref<SessionPaymentDetail[]>([])
  const loading = ref(false)

  const sessionIncome = computed(() =>
    sessionPayments.value.reduce((s, p) => s + Number(p.amount), 0)
  )

  const sessionExpenses = computed(() =>
    movements.value
      .filter((m) => m.type === 'expense')
      .reduce((s, m) => s + Number(m.amount), 0)
  )

  const sessionExtraIncome = computed(() =>
    movements.value
      .filter((m) => m.type === 'income')
      .reduce((s, m) => s + Number(m.amount), 0)
  )

  const paymentBreakdown = computed(() => paymentStats(sessionPayments.value))

  const cobrosByMethod = computed(() => incomeByMethod(sessionPayments.value))

  const openingBase = computed(() => toAmount(openSession.value?.opening_amount))

  const cashIncome = computed(() =>
    sessionPayments.value
      .filter((p) => p.method === 'cash')
      .reduce((s, p) => s + toAmount(p.amount), 0)
  )

  const nonCashIncome = computed(() => Math.max(0, sessionIncome.value - cashIncome.value))

  const ledger = computed((): CashLedgerEntry[] =>
    buildCashLedger(openSession.value, sessionPayments.value, movements.value)
  )

  const expectedCash = computed(() => {
    if (!openSession.value) return 0
    const cashMovements = movements.value
      .filter((m) => m.payment_method === 'cash' || (!m.payment_method && m.type !== 'expense'))
      .reduce((s, m) => {
        if (m.type === 'expense') return s - toAmount(m.amount)
        if (m.type === 'income') return s + toAmount(m.amount)
        return s + toAmount(m.amount)
      }, 0)
    return openingBase.value + cashIncome.value + cashMovements
  })

  async function fetchOpenSession(parkingLotId: string) {
    loading.value = true
    const { data, error } = await matudb
      .from('cash_sessions')
      .select('*')
      .eq('parking_lot_id', parkingLotId)
      .eq('status', 'OPEN')
      .order('opened_at', { ascending: false })
      .limit(1)

    if (error?.message?.toLowerCase().includes('does not exist')) {
      loading.value = false
      return
    }

    const rows = (data as CashSession[]) ?? []
    openSession.value = rows[0] ? normalizeSession(rows[0]) : null

    if (openSession.value) {
      await Promise.all([
        loadMovements(openSession.value.id),
        loadSessionPayments(openSession.value.id),
      ])
    } else {
      movements.value = []
      sessionPayments.value = []
    }
    loading.value = false
  }

  async function loadMovements(sessionId: string) {
    const { data } = await matudb
      .from('cash_movements')
      .select('*')
      .eq('cash_session_id', sessionId)
      .order('created_at', { ascending: false })
    movements.value = (data as CashMovement[]) ?? []
  }

  async function loadSessionPayments(sessionId: string) {
    const { data } = await matudb
      .from('payments')
      .select('id, amount, method, paid_at, ticket_id')
      .eq('cash_session_id', sessionId)
      .order('paid_at', { ascending: false })

    const rows = (data as { id: string; amount: number; method: string; paid_at: string; ticket_id: string }[]) ?? []
    if (!rows.length) {
      sessionPayments.value = []
      return
    }

    const ticketIds = [...new Set(rows.map((r) => r.ticket_id))]
    const { data: tickets } = await matudb
      .from('tickets')
      .select('id, plate, vehicle_type, code')
      .in('id', ticketIds)

    const ticketMap = new Map(
      ((tickets as { id: string; plate: string; vehicle_type: string; code: string }[]) ?? []).map((t) => [
        t.id,
        t,
      ])
    )

    sessionPayments.value = rows.map((p) => {
      const t = ticketMap.get(p.ticket_id)
      return {
        id: p.id,
        amount: Number(p.amount),
        method: p.method,
        paid_at: p.paid_at,
        ticket_id: p.ticket_id,
        plate: t?.plate ?? '—',
        ticket_code: t?.code ?? '—',
        vehicle_type: (t?.vehicle_type as SessionPaymentDetail['vehicle_type']) ?? 'car',
      }
    })
  }

  async function openCash(openingAmount: number, notes?: string) {
    const auth = useAuthStore()
    if (!auth.parkingLotId || !auth.profile) return { error: 'Sin parqueadero' }

    if (openSession.value) return { error: 'Ya hay una caja abierta' }

    const { data: insertData, error } = await matudb.from('cash_sessions').insert({
      parking_lot_id: auth.parkingLotId,
      opened_by: auth.profile.id,
      opening_amount: openingAmount,
      status: 'OPEN',
      notes: notes || null,
    })

    let session = rowFromWrite<CashSession>(insertData)
    if (!session) {
      const fetched = await fetchRow<CashSession>('cash_sessions', 'parking_lot_id', auth.parkingLotId)
      session = fetched.data?.status === 'OPEN' ? fetched.data : null
    }

    if (!session) {
      const msg = error?.message?.toLowerCase().includes('does not exist')
        ? 'Faltan tablas de caja. Ejecuta database/migrations/FIX_caja.sql en MatuDB.'
        : error?.message || 'No se pudo abrir la caja'
      return { error: msg }
    }

    openSession.value = normalizeSession(session)
    movements.value = []
    sessionPayments.value = []
    return { data: session }
  }

  async function closeCash(closingAmount: number, notes?: string) {
    const auth = useAuthStore()
    if (!openSession.value) return { error: 'No hay caja abierta' }

    const expected = expectedCash.value
    const { data, error } = await updateRow<CashSession>(
      'cash_sessions',
      { id: openSession.value.id },
      {
        status: 'CLOSED',
        closed_by: auth.profile?.id ?? null,
        closing_amount: closingAmount,
        expected_amount: expected,
        closed_at: new Date().toISOString(),
        notes: notes || openSession.value.notes,
      }
    )

    if (error || !data) return { error: error?.message || 'No se pudo cerrar la caja' }

    openSession.value = null
    movements.value = []
    sessionPayments.value = []
    return { data }
  }

  async function addMovement(payload: {
    type: 'income' | 'expense' | 'adjustment'
    amount: number
    category?: string
    description?: string
    paymentMethod?: PaymentMethod
  }) {
    const auth = useAuthStore()
    if (!auth.parkingLotId || !openSession.value) return { error: 'Abre la caja primero' }

    const { data: insertData, error } = await matudb.from('cash_movements').insert({
      parking_lot_id: auth.parkingLotId,
      cash_session_id: openSession.value.id,
      type: payload.type,
      category: payload.category || null,
      description: payload.description || null,
      amount: payload.amount,
      payment_method: payload.paymentMethod || 'cash',
      created_by: auth.profile?.id ?? null,
    })

    if (error) return { error: error.message }

    const movement = rowFromWrite<CashMovement>(insertData)
    if (movement) movements.value.unshift(movement)
    else await loadMovements(openSession.value.id)

    return { data: movement }
  }

  return {
    openSession,
    movements,
    sessionPayments,
    ledger,
    paymentBreakdown,
    cobrosByMethod,
    openingBase,
    cashIncome,
    nonCashIncome,
    loading,
    sessionIncome,
    sessionExpenses,
    sessionExtraIncome,
    expectedCash,
    fetchOpenSession,
    openCash,
    closeCash,
    addMovement,
    loadSessionPayments,
  }
})
