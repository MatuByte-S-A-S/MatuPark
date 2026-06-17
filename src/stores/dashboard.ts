import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { matudb } from '@/lib/matudb'
import type { DashboardStats } from '@/types'
import { createLiveSync } from '@/composables/useLiveSync'
import { useParkingStore } from './parking'

export const useDashboardStore = defineStore('dashboard', () => {
  const stats = ref<DashboardStats>({
    activeCars: 0,
    activeMotos: 0,
    availableCars: 0,
    availableMotos: 0,
    todayIncome: 0,
    todayVehicles: 0,
  })

  const incomeByDay = ref<{ date: string; amount: number }[]>([])
  const occupancyTrend = ref<{ hour: string; cars: number; motos: number }[]>([])
  const loading = ref(false)

  const parking = useParkingStore()

  async function refreshStats(parkingLotId: string) {
    loading.value = true
    if (!parking.settings || parking.lot?.id !== parkingLotId) {
      await parking.fetchByLotId(parkingLotId)
    }
    const settings = parking.settings

    const { data: active } = await matudb
      .from('tickets')
      .select('vehicle_type')
      .eq('parking_lot_id', parkingLotId)
      .eq('status', 'ACTIVE')

    const activeCars = active?.filter((t: { vehicle_type: string }) => t.vehicle_type === 'car').length ?? 0
    const activeMotos = active?.filter((t: { vehicle_type: string }) => t.vehicle_type === 'moto').length ?? 0

    const maxCars = settings?.max_cars ?? 0
    const maxMotos = settings?.max_motos ?? 0

    const startOfDay = new Date()
    startOfDay.setHours(0, 0, 0, 0)

    const { data: payments } = await matudb
      .from('payments')
      .select('amount, paid_at')
      .eq('parking_lot_id', parkingLotId)
      .gte('paid_at', startOfDay.toISOString())

    const todayIncome = payments?.reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0) ?? 0

    const { data: finalizedToday } = await matudb
      .from('tickets')
      .select('id')
      .eq('parking_lot_id', parkingLotId)
      .eq('status', 'FINALIZED')
      .gte('exit_at', startOfDay.toISOString())

    stats.value = {
      activeCars,
      activeMotos,
      availableCars: Math.max(0, maxCars - activeCars),
      availableMotos: Math.max(0, maxMotos - activeMotos),
      todayIncome,
      todayVehicles: finalizedToday?.length ?? 0,
    }

    occupancyTrend.value = [
      { hour: 'Ocupados', cars: stats.value.activeCars, motos: stats.value.activeMotos },
      { hour: 'Libres', cars: stats.value.availableCars, motos: stats.value.availableMotos },
    ]

    loading.value = false
  }

  async function refresh(parkingLotId: string) {
    await refreshStats(parkingLotId)
    await loadCharts(parkingLotId)
  }

  async function loadCharts(parkingLotId: string) {
    const days = 7
    const income: { date: string; amount: number }[] = []

    for (let i = days - 1; i >= 0; i--) {
      const d = new Date()
      d.setDate(d.getDate() - i)
      d.setHours(0, 0, 0, 0)
      const end = new Date(d)
      end.setHours(23, 59, 59, 999)

      const { data } = await matudb
        .from('payments')
        .select('amount')
        .eq('parking_lot_id', parkingLotId)
        .gte('paid_at', d.toISOString())
        .lte('paid_at', end.toISOString())

      const amount = data?.reduce((s: number, p: { amount: number }) => s + Number(p.amount), 0) ?? 0
      income.push({
        date: d.toLocaleDateString('es-CO', { weekday: 'short', day: 'numeric' }),
        amount,
      })
    }
    incomeByDay.value = income
  }

  function subscribe(parkingLotId: string) {
    return createLiveSync(() => refreshStats(parkingLotId), {
      parkingLotId,
      tables: ['tickets', 'payments', 'settings', 'cash_sessions', 'cash_movements'],
    })
  }

  const totalCapacity = computed(() => {
    const s = parking.settings
    return (s?.max_cars ?? 0) + (s?.max_motos ?? 0)
  })

  return { stats, incomeByDay, occupancyTrend, loading, refreshStats, refresh, loadCharts, subscribe, totalCapacity }
})
