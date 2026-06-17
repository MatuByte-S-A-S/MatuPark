import type { CashLedgerEntry, CashMovement, CashSession, SessionPaymentDetail } from '@/types'
import { paymentMethodLabel } from '@/utils/paymentMethods'

function vehicleLabel(type: string) {
  return type === 'car' ? 'Carro' : 'Moto'
}

export function buildCashLedger(
  session: CashSession | null,
  payments: SessionPaymentDetail[],
  movements: CashMovement[]
): CashLedgerEntry[] {
  const entries: CashLedgerEntry[] = []

  if (session) {
    entries.push({
      id: `open-${session.id}`,
      kind: 'opening',
      at: session.opened_at,
      concept: 'Apertura de caja',
      detail: 'Base inicial del turno',
      method: '—',
      amount: Number(session.opening_amount),
      sign: 'neutral',
    })
  }

  for (const p of payments) {
    entries.push({
      id: `pay-${p.id}`,
      kind: 'payment',
      at: p.paid_at,
      concept: 'Salida · Cobro',
      detail: `${vehicleLabel(p.vehicle_type)} ${p.plate} · Ticket ${p.ticket_code}`,
      method: paymentMethodLabel(p.method),
      amount: Number(p.amount),
      sign: 'in',
      vehicle_type: p.vehicle_type,
    })
  }

  for (const m of movements) {
    const isExpense = m.type === 'expense'
    entries.push({
      id: `mov-${m.id}`,
      kind: m.type === 'expense' ? 'expense' : m.type === 'income' ? 'income' : 'adjustment',
      at: m.created_at,
      concept: isExpense ? 'Gasto' : m.type === 'income' ? 'Ingreso extra' : 'Ajuste',
      detail: [m.category, m.description].filter(Boolean).join(' · ') || 'Movimiento manual',
      method: m.payment_method ? paymentMethodLabel(m.payment_method) : '—',
      amount: Number(m.amount),
      sign: isExpense ? 'out' : 'in',
    })
  }

  return entries.sort((a, b) => new Date(b.at).getTime() - new Date(a.at).getTime())
}

export function paymentStats(payments: SessionPaymentDetail[]) {
  const cars = payments.filter((p) => p.vehicle_type === 'car').length
  const motos = payments.filter((p) => p.vehicle_type === 'moto').length
  return { total: payments.length, cars, motos }
}

export function incomeByMethod(payments: SessionPaymentDetail[]) {
  const map = new Map<string, { count: number; amount: number }>()
  for (const p of payments) {
    const key = p.method || 'other'
    const cur = map.get(key) ?? { count: 0, amount: 0 }
    cur.count += 1
    cur.amount += Number(p.amount)
    map.set(key, cur)
  }
  return [...map.entries()].map(([method, v]) => ({ method, ...v }))
}
