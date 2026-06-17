export type ReportPeriod = 'today' | 'week' | 'month' | 'all' | 'custom'

export function getPeriodRange(
  period: ReportPeriod,
  customStart?: string,
  customEnd?: string,
  fallbackStart?: Date
): { start: Date; end: Date } {
  const end = new Date()
  end.setHours(23, 59, 59, 999)
  const start = new Date()

  switch (period) {
    case 'today':
      start.setHours(0, 0, 0, 0)
      break
    case 'week':
      start.setDate(start.getDate() - 6)
      start.setHours(0, 0, 0, 0)
      break
    case 'month':
      start.setDate(1)
      start.setHours(0, 0, 0, 0)
      break
    case 'all':
      if (fallbackStart) {
        start.setTime(fallbackStart.getTime())
        start.setHours(0, 0, 0, 0)
      } else {
        start.setFullYear(start.getFullYear() - 1)
        start.setHours(0, 0, 0, 0)
      }
      break
    case 'custom':
      if (customStart) {
        const s = new Date(customStart)
        s.setHours(0, 0, 0, 0)
        const e = customEnd ? new Date(customEnd) : end
        e.setHours(23, 59, 59, 999)
        return { start: s, end: e }
      }
      start.setHours(0, 0, 0, 0)
      break
  }
  return { start, end }
}

export function toISODate(d: Date): string {
  return d.toISOString()
}
