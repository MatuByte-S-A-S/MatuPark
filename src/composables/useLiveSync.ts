import { onMounted, onUnmounted, type Ref } from 'vue'
import { subscribeTables } from '@/lib/realtime'

type SyncCallback = () => void | Promise<void>

interface LiveSyncOptions {
  tables?: string[]
  parkingLotId?: Ref<string | null | undefined> | string | null
}

/** MatuDB realtime via db.channel() — sin polling. */
export function createLiveSync(callback: SyncCallback, options: LiveSyncOptions = {}) {
  const tables = options.tables ?? ['tickets', 'payments', 'settings']
  const lotId =
    typeof options.parkingLotId === 'string'
      ? options.parkingLotId
      : options.parkingLotId?.value ?? null

  return subscribeTables(tables, callback, lotId)
}

export function useLiveSync(callback: SyncCallback, options: LiveSyncOptions = {}) {
  let cleanup: (() => void) | undefined

  onMounted(() => {
    cleanup = createLiveSync(callback, options)
  })

  onUnmounted(() => cleanup?.())

  return { refresh: () => void callback() }
}
