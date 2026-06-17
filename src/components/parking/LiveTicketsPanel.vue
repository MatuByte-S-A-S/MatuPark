<script setup lang="ts">
import type { Ticket } from '@/types'
import { formatCurrency, calculateAmount } from '@/utils/billing'
import type { Settings } from '@/types'
import VehicleTopIcon from '@/components/parking/VehicleTopIcon.vue'

defineProps<{
  tickets: Ticket[]
  settings: Settings | null
  selectedId?: string | null
}>()

defineEmits<{ select: [ticket: Ticket] }>()

function amount(ticket: Ticket, settings: Settings | null) {
  if (!settings) return '$0'
  return formatCurrency(calculateAmount(settings, ticket.vehicle_type, ticket.entry_at).amount)
}

function elapsed(entryAt: string) {
  const mins = Math.floor((Date.now() - new Date(entryAt).getTime()) / 60000)
  const h = Math.floor(mins / 60)
  const m = mins % 60
  return h > 0 ? `${h}h ${m}m` : `${m} min`
}
</script>

<template>
  <div class="pp-card overflow-hidden">
    <div class="border-b border-surface px-5 py-4">
      <h3 class="font-bold text-ink">En parqueadero</h3>
      <p class="mt-0.5 text-xs text-muted">Toca para cobrar salida</p>
    </div>

    <div v-if="!tickets.length" class="px-5 py-10 text-center text-sm text-muted">
      Sin vehículos activos
    </div>

    <ul v-else class="max-h-[420px] divide-y divide-surface overflow-y-auto">
      <li v-for="t in tickets.slice(0, 10)" :key="t.id">
        <button
          type="button"
          class="flex w-full items-center gap-3 px-5 py-4 text-left transition hover:bg-surface/50"
          :class="selectedId === t.id ? 'bg-lime/10 ring-1 ring-inset ring-lime/40' : ''"
          @click="$emit('select', t)"
        >
          <div class="flex h-12 w-10 shrink-0 items-center justify-center rounded-xl bg-surface">
            <VehicleTopIcon :type="t.vehicle_type" variant="filled" class="h-10 w-8" />
          </div>
          <div class="min-w-0 flex-1">
            <div class="flex items-center gap-2">
              <span class="font-bold text-ink">{{ t.plate }}</span>
              <span class="rounded-full bg-lime/50 px-2 py-0.5 text-[10px] font-bold text-ink">
                {{ t.vehicle_type === 'car' ? 'Carro' : 'Moto' }}
              </span>
            </div>
            <p class="text-xs text-muted">{{ t.code }} · {{ elapsed(t.entry_at) }}</p>
          </div>
          <p class="shrink-0 text-sm font-bold text-ink">{{ amount(t, settings) }}</p>
        </button>
      </li>
    </ul>
  </div>
</template>
