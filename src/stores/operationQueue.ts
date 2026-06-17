import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { useTicketsStore } from '@/stores/tickets'
import { useDashboardStore } from '@/stores/dashboard'
import { useAuthStore } from '@/stores/auth'
import { useNotify } from '@/composables/useNotify'
import { paymentMethodLabel } from '@/utils/paymentMethods'
import { formatCurrency } from '@/utils/billing'
import type { PaymentMethod, Ticket, VehicleType } from '@/types'

export type OperationStatus = 'pending' | 'running' | 'done' | 'error'

export interface QueueOperation {
  id: string
  type: 'entry' | 'exit'
  label: string
  detail: string
  status: OperationStatus
  error?: string
  createdAt: number
}

let seq = 0

export const useOperationQueueStore = defineStore('operationQueue', () => {
  const items = ref<QueueOperation[]>([])
  const expanded = ref(true)
  let pumping = false

  const activeCount = computed(
    () => items.value.filter((i) => i.status === 'pending' || i.status === 'running').length
  )

  const hasItems = computed(() => items.value.length > 0)

  function addItem(type: QueueOperation['type'], label: string, detail: string) {
    const op: QueueOperation = {
      id: `${Date.now()}-${++seq}`,
      type,
      label,
      detail,
      status: 'pending',
      createdAt: Date.now(),
    }
    items.value.unshift(op)
    if (items.value.length > 8) items.value.pop()
    expanded.value = true
    void pump()
    return op.id
  }

  function patch(id: string, patch: Partial<QueueOperation>) {
    const idx = items.value.findIndex((i) => i.id === id)
    if (idx !== -1) items.value[idx] = { ...items.value[idx], ...patch }
  }

  function scheduleRemove(id: string, ms = 4500) {
    window.setTimeout(() => {
      items.value = items.value.filter((i) => i.id !== id)
    }, ms)
  }

  async function refreshBackground() {
    const auth = useAuthStore()
    if (!auth.parkingLotId) return
    const tickets = useTicketsStore()
    const dashboard = useDashboardStore()
    void tickets.fetchActive(auth.parkingLotId)
    void dashboard.refreshStats(auth.parkingLotId)
  }

  async function execute(op: QueueOperation) {
    const tickets = useTicketsStore()
    const notify = useNotify()
    patch(op.id, { status: 'running' })

    try {
      if (op.type === 'entry') {
        const payload = JSON.parse(op.detail) as { plate: string; zone: VehicleType; tempId?: string }
        const res = await tickets.registerEntry(payload.plate, payload.zone)
        if (payload.tempId) {
          tickets.activeTickets = tickets.activeTickets.filter((t) => t.id !== payload.tempId)
        }
        if (res.error) {
          const msg = typeof res.error === 'string' ? res.error : res.error.message
          patch(op.id, { status: 'error', error: msg })
          notify.error('Ingreso fallido', msg)
          return
        }
        patch(op.id, {
          status: 'done',
          label: res.data ? `Ingreso ${res.data.plate}` : op.label,
        })
        if (res.data) {
          notify.success('Ingreso registrado', `${res.data.plate} · ${res.data.code}`)
        }
      } else {
        const payload = JSON.parse(op.detail) as {
          ticketId: string
          amount: number
          method: PaymentMethod
          plate: string
          rollback?: Ticket[]
        }
        const res = await tickets.finalize(payload.ticketId, payload.amount, payload.method)
        if (res.error) {
          if (payload.rollback) {
            tickets.activeTickets = payload.rollback
          }
          const msg = typeof res.error === 'string' ? res.error : res.error.message
          patch(op.id, { status: 'error', error: msg })
          notify.error('Salida fallida', msg)
          return
        }
        patch(op.id, { status: 'done' })
        notify.success(
          'Salida registrada',
          `${payload.plate} · ${formatCurrency(payload.amount)} · ${paymentMethodLabel(payload.method)}`
        )
      }
      void refreshBackground()
      scheduleRemove(op.id)
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Error inesperado'
      patch(op.id, { status: 'error', error: msg })
    }
  }

  async function pump() {
    if (pumping) return
    pumping = true
    try {
      while (true) {
        const next = items.value.find((i) => i.status === 'pending')
        if (!next) break
        await execute(next)
      }
    } finally {
      pumping = false
    }
  }

  function enqueueEntry(plate: string, zone: VehicleType) {
    const auth = useAuthStore()
    const tickets = useTicketsStore()
    const normalizedPlate = plate.trim().toUpperCase()
    const tempId = `pending-${Date.now()}-${++seq}`
    if (auth.parkingLotId) {
      const optimistic: Ticket = {
        id: tempId,
        code: '···',
        plate: normalizedPlate,
        vehicle_type: zone,
        parking_lot_id: auth.parkingLotId,
        entry_at: new Date().toISOString(),
        exit_at: null,
        status: 'ACTIVE',
        observations: null,
        amount_paid: null,
      }
      tickets.activeTickets = [optimistic, ...tickets.activeTickets]
    }
    return addItem(
      'entry',
      `Ingreso ${normalizedPlate}`,
      JSON.stringify({ plate: normalizedPlate, zone, tempId })
    )
  }

  function enqueueExit(ticket: Ticket, amount: number, method: PaymentMethod) {
    const tickets = useTicketsStore()
    const previous = tickets.activeTickets
    tickets.activeTickets = tickets.activeTickets.filter((t) => t.id !== ticket.id)
    const id = addItem(
      'exit',
      `Salida ${ticket.plate}`,
      JSON.stringify({ ticketId: ticket.id, amount, method, plate: ticket.plate, rollback: previous })
    )
    return id
  }

  function toggleExpanded() {
    expanded.value = !expanded.value
  }

  function dismiss(id: string) {
    items.value = items.value.filter((i) => i.id !== id)
  }

  return {
    items,
    expanded,
    activeCount,
    hasItems,
    enqueueEntry,
    enqueueExit,
    toggleExpanded,
    dismiss,
  }
})
