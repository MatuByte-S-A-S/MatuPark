import { ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useParkingStore } from '@/stores/parking'
import { useDashboardStore } from '@/stores/dashboard'
import { useTicketsStore } from '@/stores/tickets'
import { useCashStore } from '@/stores/cash'
import { createLiveSync } from '@/composables/useLiveSync'

const ready = ref(false)
let initPromise: Promise<void> | null = null
let liveUnsub: (() => void) | undefined

function syncLiveData(parkingLotId: string) {
  const dashboard = useDashboardStore()
  const tickets = useTicketsStore()
  const cash = useCashStore()
  void dashboard.refreshStats(parkingLotId)
  void tickets.fetchActive(parkingLotId)
  void cash.fetchOpenSession(parkingLotId)
}

function startLiveSync(parkingLotId: string) {
  liveUnsub?.()
  liveUnsub = createLiveSync(() => syncLiveData(parkingLotId), {
    parkingLotId,
    tables: ['tickets', 'payments', 'settings', 'cash_sessions', 'cash_movements'],
  })
}

export function useAdminBootstrap() {
  const auth = useAuthStore()
  const parking = useParkingStore()
  const dashboard = useDashboardStore()
  const tickets = useTicketsStore()
  const cash = useCashStore()

  async function ensureReady(force = false) {
    const id = auth.parkingLotId
    if (!id) return

    if (ready.value && !force) return
    if (initPromise && !force) return initPromise

    initPromise = (async () => {
      await Promise.all([
        parking.fetchByLotId(id),
        dashboard.refreshStats(id),
        tickets.fetchActive(id),
        cash.fetchOpenSession(id),
      ])
      ready.value = true
      startLiveSync(id)
    })()

    try {
      await initPromise
    } finally {
      initPromise = null
    }
  }

  function teardown() {
    liveUnsub?.()
    liveUnsub = undefined
  }

  function reset() {
    ready.value = false
    teardown()
  }

  return { ready, ensureReady, teardown, reset }
}
