import { matudb } from '@/lib/matudb'

type RealtimePayload = {
  action?: string
  data?: Record<string, unknown>
  new?: Record<string, unknown>
  old?: Record<string, unknown>
  table?: string
}

type RealtimeCallback = (payload: RealtimePayload) => void

interface TableSubscription {
  channel: ReturnType<typeof matudb.channel>
  listeners: Set<RealtimeCallback>
  subscribed: boolean
}

const tables = new Map<string, TableSubscription>()

function lotIdFromPayload(payload: RealtimePayload) {
  const row = (payload.data ?? payload.new ?? payload.old) as Record<string, unknown> | undefined
  return row?.parking_lot_id as string | undefined
}

function normalizeTable(name: string) {
  return name.replace(/^public:/, '')
}

function getTableSub(table: string): TableSubscription {
  const key = normalizeTable(table)
  let sub = tables.get(key)
  if (!sub) {
    const channel = matudb.channel(`public:${key}`)
    sub = { channel, listeners: new Set(), subscribed: false }
    tables.set(key, sub)
  }
  return sub
}

function ensureSubscribed(sub: TableSubscription, table: string) {
  if (sub.subscribed) return
  sub.subscribed = true

  sub.channel
    .on('postgres_changes', { event: '*', schema: 'public', table }, (payload: RealtimePayload) => {
      for (const listener of sub.listeners) listener(payload)
    })
    .subscribe()
}

/** Subscribe to MatuDB realtime for a table. Returns unsubscribe fn. */
export function subscribeTable(
  table: string,
  callback: RealtimeCallback,
  parkingLotId?: string | null
) {
  const key = normalizeTable(table)
  const sub = getTableSub(key)

  const listener: RealtimeCallback = (payload) => {
    if (parkingLotId) {
      const rowLot = lotIdFromPayload(payload)
      if (rowLot && rowLot !== parkingLotId) return
    }
    callback(payload)
  }

  sub.listeners.add(listener)
  ensureSubscribed(sub, key)

  return () => {
    sub.listeners.delete(listener)
    if (sub.listeners.size === 0) {
      matudb.removeChannel(sub.channel)
      tables.delete(key)
    }
  }
}

/** Subscribe to multiple tables with one callback. Returns cleanup fn. */
export function subscribeTables(
  tableNames: string[],
  callback: () => void | Promise<void>,
  parkingLotId?: string | null
) {
  const unsubs = tableNames.map((table) =>
    subscribeTable(table, () => {
      void callback()
    }, parkingLotId)
  )
  return () => unsubs.forEach((fn) => fn())
}

export function removeAllRealtimeChannels() {
  matudb.removeAllChannels()
  tables.clear()
}
