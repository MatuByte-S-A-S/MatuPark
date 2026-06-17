import type { OccupancyLevel } from '@/types'

export function getOccupancyLevel(available: number, capacity: number): OccupancyLevel {
  if (capacity <= 0 || available <= 0) {
    return { level: 'full', label: 'SIN CUPOS DISPONIBLES', color: 'bg-ink' }
  }
  const ratio = available / capacity
  if (ratio > 0.4) {
    return { level: 'high', label: 'Disponibilidad alta', color: 'bg-lime' }
  }
  if (ratio > 0.15) {
    return { level: 'medium', label: 'Disponibilidad media', color: 'bg-amber-400' }
  }
  return { level: 'low', label: 'Parqueadero casi lleno', color: 'bg-orange-500' }
}
