import type { BillingMode, Settings, VehicleType } from '@/types'
import { useParkingStore } from '@/stores/parking'
import { getCurrencyConfig, formatCurrencyValue } from '@/utils/currency'

export function getHourlyRate(settings: Settings, type: VehicleType): number {
  return type === 'car' ? Number(settings.rate_car_hour) : Number(settings.rate_moto_hour)
}

export function getElapsedMinutes(entryAt: string, exitAt: Date = new Date()): number {
  const start = new Date(entryAt).getTime()
  const end = exitAt.getTime()
  return Math.max(0, Math.floor((end - start) / 60000))
}

export function formatDuration(minutes: number): string {
  const h = Math.floor(minutes / 60)
  const m = minutes % 60
  if (h === 0) return `${m} min`
  return `${h}h ${m}m`
}

export function calculateAmount(
  settings: Settings,
  vehicleType: VehicleType,
  entryAt: string,
  exitAt: Date = new Date()
): { minutes: number; hours: number; amount: number; withinTolerance: boolean } {
  const minutes = getElapsedMinutes(entryAt, exitAt)
  const tolerance = settings.tolerance_minutes ?? 0

  if (minutes <= tolerance) {
    return { minutes, hours: 0, amount: 0, withinTolerance: true }
  }

  const billableMinutes = minutes - tolerance
  const hourlyRate = getHourlyRate(settings, vehicleType)

  let hours: number
  if (settings.billing_mode === 'full_hour') {
    hours = Math.ceil(billableMinutes / 60)
  } else {
    hours = Math.round((billableMinutes / 60) * 100) / 100
  }

  const amount = Math.round(hours * hourlyRate)
  return { minutes, hours, amount, withinTolerance: false }
}

export function formatCurrency(value: number): string {
  try {
    const parking = useParkingStore()
    return formatCurrencyValue(value, getCurrencyConfig(parking.settings))
  } catch {
    return formatCurrencyValue(value)
  }
}

export function billingModeLabel(mode: BillingMode): string {
  return mode === 'full_hour' ? 'Por hora completa' : 'Proporcional'
}
