import { matudb } from '@/lib/matudb'
import { getPeriodRange, type ReportPeriod } from '@/utils/dateRange'
import { getElapsedMinutes, formatDuration } from '@/utils/billing'

export interface DailyMetric {
  date: string
  label: string
  entries: number
  exits: number
  income: number
  carsIn: number
  motosIn: number
}

export interface ReportMetrics {
  periodLabel: string
  totalIncome: number
  totalPayments: number
  vehiclesEntered: number
  vehiclesExited: number
  carsEntered: number
  motosEntered: number
  carsExited: number
  motosExited: number
  carIncome: number
  motoIncome: number
  carSharePct: number
  motoSharePct: number
  carIncomePct: number
  motoIncomePct: number
  avgTicket: number
  avgDurationMinutes: number
  maxDurationMinutes: number
  maxDurationLabel: string
  dailyAverage: number
  dailyTrend: DailyMetric[]
}

interface TicketRow {
  id: string
  plate: string
  vehicle_type: string
  entry_at: string
  exit_at: string | null
  status: string
  amount_paid: number | null
}

interface PaymentRow {
  amount: number
  paid_at: string
  ticket_id: string
  method: string
}

function pct(part: number, total: number) {
  if (total <= 0) return 0
  return Math.round((part / total) * 100)
}

function dayKey(d: Date) {
  return d.toISOString().slice(0, 10)
}

function dayLabel(d: Date) {
  return d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric', month: 'short' })
}

export async function loadReportMetrics(
  parkingLotId: string,
  period: ReportPeriod,
  customStart?: string,
  customEnd?: string,
  lotCreatedAt?: string
): Promise<{ metrics: ReportMetrics; byMethod: { method: string; amount: number; count: number }[]; cashSummary: { sessions: number; expenses: number; expected: number } }> {
  const fallbackStart = lotCreatedAt ? new Date(lotCreatedAt) : undefined
  const { start, end } = getPeriodRange(period, customStart, customEnd, fallbackStart)

  const [{ data: entryRows }, { data: exitRows }, { data: payments }] = await Promise.all([
    matudb
      .from('tickets')
      .select('id, plate, vehicle_type, entry_at, exit_at, status, amount_paid')
      .eq('parking_lot_id', parkingLotId)
      .gte('entry_at', start.toISOString())
      .lte('entry_at', end.toISOString()),
    matudb
      .from('tickets')
      .select('id, plate, vehicle_type, entry_at, exit_at, status, amount_paid')
      .eq('parking_lot_id', parkingLotId)
      .eq('status', 'FINALIZED')
      .gte('exit_at', start.toISOString())
      .lte('exit_at', end.toISOString()),
    matudb
      .from('payments')
      .select('amount, paid_at, ticket_id, method')
      .eq('parking_lot_id', parkingLotId)
      .gte('paid_at', start.toISOString())
      .lte('paid_at', end.toISOString()),
  ])

  const entries = (entryRows as TicketRow[]) ?? []
  const exits = (exitRows as TicketRow[]) ?? []
  const paymentRows = (payments as PaymentRow[]) ?? []

  const ticketTypeMap = new Map<string, string>()
  for (const t of [...entries, ...exits]) {
    ticketTypeMap.set(t.id, t.vehicle_type)
  }

  const carsEntered = entries.filter((t) => t.vehicle_type === 'car').length
  const motosEntered = entries.filter((t) => t.vehicle_type === 'moto').length
  const carsExited = exits.filter((t) => t.vehicle_type === 'car').length
  const motosExited = exits.filter((t) => t.vehicle_type === 'moto').length

  let carIncome = 0
  let motoIncome = 0
  for (const p of paymentRows) {
    const type = ticketTypeMap.get(p.ticket_id)
    const amount = Number(p.amount)
    if (type === 'car') carIncome += amount
    else if (type === 'moto') motoIncome += amount
  }

  const totalIncome = paymentRows.reduce((s, p) => s + Number(p.amount), 0)
  const vehiclesExited = exits.length
  const avgTicket = vehiclesExited > 0 ? Math.round(totalIncome / vehiclesExited) : 0

  let totalDuration = 0
  let maxDurationMinutes = 0
  let maxDurationLabel = '—'
  for (const t of exits) {
    if (!t.exit_at) continue
    const mins = getElapsedMinutes(t.entry_at, new Date(t.exit_at))
    totalDuration += mins
    if (mins > maxDurationMinutes) {
      maxDurationMinutes = mins
      maxDurationLabel = `${t.plate} · ${formatDuration(mins)}`
    }
  }
  const avgDurationMinutes = vehiclesExited > 0 ? Math.round(totalDuration / vehiclesExited) : 0

  const totalDays = Math.max(1, Math.ceil((end.getTime() - start.getTime()) / 86400000))
  const dailyAverage = Math.round(totalIncome / totalDays)

  const chartDays = Math.min(totalDays, period === 'today' ? 1 : period === 'week' ? 7 : 31)
  const dailyTrend: DailyMetric[] = []

  for (let i = chartDays - 1; i >= 0; i--) {
    const d = new Date(end)
    d.setDate(d.getDate() - i)
    d.setHours(0, 0, 0, 0)
    const dayEnd = new Date(d)
    dayEnd.setHours(23, 59, 59, 999)
    const key = dayKey(d)

    const dayEntries = entries.filter((t) => dayKey(new Date(t.entry_at)) === key)
    const dayExits = exits.filter((t) => t.exit_at && dayKey(new Date(t.exit_at)) === key)
    const dayIncome = paymentRows
      .filter((p) => dayKey(new Date(p.paid_at)) === key)
      .reduce((s, p) => s + Number(p.amount), 0)

    dailyTrend.push({
      date: key,
      label: dayLabel(d),
      entries: dayEntries.length,
      exits: dayExits.length,
      income: dayIncome,
      carsIn: dayEntries.filter((t) => t.vehicle_type === 'car').length,
      motosIn: dayEntries.filter((t) => t.vehicle_type === 'moto').length,
    })
  }

  const methodMap = new Map<string, { amount: number; count: number }>()
  for (const p of paymentRows) {
    const m = p.method || 'other'
    const cur = methodMap.get(m) ?? { amount: 0, count: 0 }
    cur.amount += Number(p.amount)
    cur.count += 1
    methodMap.set(m, cur)
  }

  const { data: sessions } = await matudb
    .from('cash_sessions')
    .select('id, expected_amount, opened_at')
    .eq('parking_lot_id', parkingLotId)
    .gte('opened_at', start.toISOString())
    .lte('opened_at', end.toISOString())

  const sessionIds = (sessions ?? []).map((s: { id: string }) => s.id)
  let expenses = 0
  if (sessionIds.length) {
    const { data: movements } = await matudb
      .from('cash_movements')
      .select('amount, type')
      .in('cash_session_id', sessionIds)
    expenses =
      movements
        ?.filter((m: { type: string }) => m.type === 'expense')
        .reduce((s: number, m: { amount: number }) => s + Number(m.amount), 0) ?? 0
  }

  const metrics: ReportMetrics = {
    periodLabel: `${start.toLocaleDateString('es-CO')} — ${end.toLocaleDateString('es-CO')}`,
    totalIncome,
    totalPayments: paymentRows.length,
    vehiclesEntered: entries.length,
    vehiclesExited,
    carsEntered,
    motosEntered,
    carsExited,
    motosExited,
    carIncome,
    motoIncome,
    carSharePct: pct(carsExited, vehiclesExited),
    motoSharePct: pct(motosExited, vehiclesExited),
    carIncomePct: pct(carIncome, totalIncome),
    motoIncomePct: pct(motoIncome, totalIncome),
    avgTicket,
    avgDurationMinutes,
    maxDurationMinutes,
    maxDurationLabel,
    dailyAverage,
    dailyTrend,
  }

  return {
    metrics,
    byMethod: [...methodMap.entries()].map(([method, v]) => ({ method, ...v })),
    cashSummary: {
      sessions: sessions?.length ?? 0,
      expenses,
      expected: (sessions ?? []).reduce(
        (s: number, x: { expected_amount: number | null }) => s + Number(x.expected_amount ?? 0),
        0
      ),
    },
  }
}
