import { subscribeTable } from '@/lib/realtime'
import { matudb } from '@/lib/matudb'
import type { Ticket } from '@/types'
import { onMounted, onUnmounted, ref } from 'vue'

export function useRealtimeTicket(code: string) {
  const ticket = ref<Ticket | null>(null)
  const loading = ref(true)
  let cleanup: (() => void) | undefined

  async function load() {
    const { data } = await matudb.from('tickets').select('*').eq('code', code.toUpperCase()).single()
    ticket.value = (data as Ticket) ?? null
    loading.value = false
  }

  onMounted(async () => {
    await load()
    cleanup = subscribeTable('tickets', async (payload) => {
      const row = (payload.data ?? payload.new ?? payload.old) as Ticket | undefined
      if (!row?.code) {
        await load()
        return
      }
      if (row.code.toUpperCase() === code.toUpperCase()) {
        await load()
      }
    })
  })

  onUnmounted(() => cleanup?.())

  return { ticket, loading, reload: load }
}
