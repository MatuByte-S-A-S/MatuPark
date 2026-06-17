import type { Ticket } from '@/types'

export function searchActiveTickets(tickets: Ticket[], query: string): Ticket[] {
  const q = query.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (!q) return []

  const exact = tickets.filter((t) => t.plate === q || t.code === q)
  if (exact.length) return exact

  return tickets.filter((t) => t.plate.includes(q) || t.code.includes(q))
}

export function slotIdForTicket(ticket: Ticket, tickets: Ticket[]): string | null {
  const list = tickets.filter((t) => t.vehicle_type === ticket.vehicle_type)
  const idx = list.findIndex((t) => t.id === ticket.id)
  if (idx < 0) return null
  const prefix = ticket.vehicle_type === 'car' ? 'C' : 'M'
  return `${prefix}${String(idx + 1).padStart(2, '0')}`
}
