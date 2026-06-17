import { defineStore } from 'pinia'
import { ref } from 'vue'
import { matudb } from '@/lib/matudb'
import { fetchRow, rowFromWrite, updateRow } from '@/lib/matudbHelpers'
import type { Ticket, VehicleType, PaymentMethod } from '@/types'
import { generateTicketCode } from '@/utils/ticketCode'
import { createLiveSync } from '@/composables/useLiveSync'
import { useAuthStore } from './auth'
import { useCashStore } from './cash'

export const useTicketsStore = defineStore('tickets', () => {
  const activeTickets = ref<Ticket[]>([])
  const loading = ref(false)

  async function fetchActive(parkingLotId: string) {
    const { data } = await matudb
      .from('tickets')
      .select('*')
      .eq('parking_lot_id', parkingLotId)
      .eq('status', 'ACTIVE')
      .order('entry_at', { ascending: false })

    activeTickets.value = (data as Ticket[]) ?? []
    return activeTickets.value
  }

  async function registerEntry(plate: string, vehicleType: VehicleType, observations?: string) {
    const auth = useAuthStore()
    if (!auth.parkingLotId) return { error: 'Sin parqueadero' }

    let code = generateTicketCode()
    let attempts = 0

    while (attempts < 5) {
      const { data: existing } = await matudb.from('tickets').select('id').eq('code', code).single()
      if (!existing) break
      code = generateTicketCode()
      attempts++
    }

    const normalizedPlate = plate.trim().toUpperCase()

    const { data: existingVehicle } = await matudb
      .from('vehicles')
      .select('id')
      .eq('plate', normalizedPlate)
      .eq('parking_lot_id', auth.parkingLotId)
      .single()

    if (!existingVehicle) {
      await matudb.from('vehicles').insert({
        plate: normalizedPlate,
        type: vehicleType,
        parking_lot_id: auth.parkingLotId,
      })
    }

    const { data: insertData, error } = await matudb.from('tickets').insert({
      code,
      plate: normalizedPlate,
      vehicle_type: vehicleType,
      parking_lot_id: auth.parkingLotId,
      entry_at: new Date().toISOString(),
      status: 'ACTIVE',
      observations: observations || null,
    })

    let ticket = rowFromWrite<Ticket>(insertData)
    if (!ticket) {
      const fetched = await fetchRow<Ticket>('tickets', 'code', code)
      ticket = fetched.data
      if (fetched.error && !ticket) {
        return { data: null, error: error ?? fetched.error }
      }
    }

    if (ticket) {
      activeTickets.value = [ticket, ...activeTickets.value.filter((t) => t.id !== ticket!.id)]
      void fetchActive(auth.parkingLotId)
    }
    return { data: ticket, error: error && !ticket ? error : null }
  }

  async function findActive(query: string) {
    const auth = useAuthStore()
    if (!auth.parkingLotId) return null

    const q = query.trim().toUpperCase()
    const byCode = await matudb
      .from('tickets')
      .select('*')
      .eq('parking_lot_id', auth.parkingLotId)
      .eq('status', 'ACTIVE')
      .eq('code', q)
      .single()

    if (byCode.data && !byCode.error) return byCode.data as Ticket

    const byPlate = await matudb
      .from('tickets')
      .select('*')
      .eq('parking_lot_id', auth.parkingLotId)
      .eq('status', 'ACTIVE')
      .eq('plate', q)
      .order('entry_at', { ascending: false })
      .limit(1)

    const rows = byPlate.data as Ticket[] | null
    return rows?.[0] ?? null
  }

  async function finalize(
    ticketId: string,
    amount: number,
    method: PaymentMethod = 'cash',
    notes?: string
  ) {
    const auth = useAuthStore()
    const cash = useCashStore()
    if (!auth.parkingLotId) return { error: 'Sin parqueadero' }

    const previous = activeTickets.value
    activeTickets.value = activeTickets.value.filter((t) => t.id !== ticketId)

    const exitAt = new Date().toISOString()

    const { data: ticket, error: ticketError } = await updateRow<Ticket>(
      'tickets',
      { id: ticketId },
      {
        status: 'FINALIZED',
        exit_at: exitAt,
        amount_paid: amount,
      }
    )

    if (ticketError || !ticket) {
      const fetched = await fetchRow<Ticket>('tickets', 'id', ticketId)
      if (!fetched.data) {
        activeTickets.value = previous
        return { error: ticketError ?? fetched.error }
      }
      void fetchActive(auth.parkingLotId)
      return { data: fetched.data }
    }

    await matudb.from('payments').insert({
      ticket_id: ticketId,
      parking_lot_id: auth.parkingLotId,
      amount,
      method,
      paid_at: exitAt,
      cash_session_id: cash.openSession?.id ?? null,
      created_by: auth.profile?.id ?? null,
      notes: notes || null,
    })

    if (cash.openSession) {
      void cash.loadSessionPayments(cash.openSession.id)
    }

    void fetchActive(auth.parkingLotId)
    return { data: ticket as Ticket }
  }

  async function getByCode(code: string) {
    const { data } = await matudb.from('tickets').select('*').eq('code', code.toUpperCase()).single()
    return (data as Ticket) ?? null
  }

  function subscribeRealtime(parkingLotId: string, onChange: () => void) {
    return createLiveSync(onChange, { parkingLotId, tables: ['tickets'] })
  }

  return {
    activeTickets,
    loading,
    fetchActive,
    registerEntry,
    findActive,
    finalize,
    getByCode,
    subscribeRealtime,
  }
})
