import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useDashboardStore } from '@/stores/dashboard'
import type { Ticket, VehicleType } from '@/types'

export function useSpotActions() {
  const auth = useAuthStore()
  const dashboard = useDashboardStore()

  const entryOpen = ref(false)
  const exitOpen = ref(false)
  const entrySlotId = ref('')
  const entryZone = ref<VehicleType>('car')
  const exitTicket = ref<Ticket | null>(null)
  const exitSlotId = ref<string | null>(null)
  const highlightSlotId = ref<string | null>(null)

  function openEntry(slotId: string, zone: VehicleType) {
    entrySlotId.value = slotId
    entryZone.value = zone
    highlightSlotId.value = slotId
    entryOpen.value = true
  }

  function openExit(ticket: Ticket, slotId?: string | null) {
    exitTicket.value = ticket
    exitSlotId.value = slotId ?? null
    highlightSlotId.value = slotId ?? null
    exitOpen.value = true
  }

  function handleSlot(slot: { id: string; ticket: Ticket | null }, zone: VehicleType) {
    highlightSlotId.value = slot.id
    if (slot.ticket) {
      openExit(slot.ticket, slot.id)
    } else {
      openEntry(slot.id, zone)
    }
  }

  function closeEntry() {
    entryOpen.value = false
    highlightSlotId.value = null
  }

  function closeExit() {
    exitOpen.value = false
    exitTicket.value = null
    highlightSlotId.value = null
  }

  function refreshAfterAction() {
    if (auth.parkingLotId) {
      void dashboard.refreshStats(auth.parkingLotId)
    }
    highlightSlotId.value = null
  }

  return {
    entryOpen,
    exitOpen,
    entrySlotId,
    entryZone,
    exitTicket,
    exitSlotId,
    highlightSlotId,
    handleSlot,
    openExit,
    closeEntry,
    closeExit,
    refreshAfterAction,
  }
}
