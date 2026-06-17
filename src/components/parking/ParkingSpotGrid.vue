<script setup lang="ts">
import { computed } from 'vue'
import type { Ticket } from '@/types'
import VehicleTopIcon from '@/components/parking/VehicleTopIcon.vue'

const props = defineProps<{
  zone: 'car' | 'moto'
  maxSlots: number
  tickets: Ticket[]
  selectedId?: string | null
}>()

const emit = defineEmits<{ select: [slot: { id: string; ticket: Ticket | null }] }>()

const prefix = computed(() => (props.zone === 'car' ? 'C' : 'M'))

const slots = computed(() => {
  const list: { id: string; label: string; ticket: Ticket | null }[] = []
  for (let i = 1; i <= props.maxSlots; i++) {
    const id = `${prefix.value}${String(i).padStart(2, '0')}`
    list.push({
      id,
      label: id,
      ticket: props.tickets[i - 1] ?? null,
    })
  }
  return list
})

function pick(slot: { id: string; ticket: Ticket | null }) {
  emit('select', slot)
}
</script>

<template>
  <div v-if="maxSlots <= 0" class="rounded-2xl bg-surface px-6 py-12 text-center text-sm text-muted">
    Configura la capacidad en Ajustes → Capacidad
  </div>

  <div v-else>
    <p class="mb-4 text-center text-xs font-medium text-muted sm:text-sm">
      <span class="text-ink">Cupo libre</span> → ingresar vehículo ·
      <span class="text-ink">ocupado</span> → cobrar salida
    </p>

    <div
      class="grid gap-2 sm:gap-3"
      :class="maxSlots > 40 ? 'grid-cols-3 sm:grid-cols-5 md:grid-cols-7 lg:grid-cols-9' : 'grid-cols-3 sm:grid-cols-4 md:grid-cols-5 lg:grid-cols-6 xl:grid-cols-8'"
    >
      <button
        v-for="slot in slots"
        :key="slot.id"
        type="button"
        class="group relative flex aspect-[4/5] flex-col items-center justify-between rounded-2xl border-2 px-1 py-2 transition-all duration-200 active:scale-95"
        :class="[
          slot.ticket
            ? selectedId === slot.id
              ? 'border-lime bg-gradient-to-b from-white to-lime/20 shadow-[0_0_0_4px_rgba(215,238,70,0.35)]'
              : 'border-transparent bg-white shadow-sm ring-1 ring-black/[0.06] hover:border-lime/70 hover:shadow-md'
            : selectedId === slot.id
              ? 'border-ink bg-white shadow-md'
              : 'border-dashed border-black/12 bg-[#f4f5f4] hover:border-lime hover:bg-lime/10',
        ]"
        @click="pick(slot)"
      >
        <span
          class="text-[9px] font-bold sm:text-[10px]"
          :class="slot.ticket ? 'text-muted' : 'text-muted/80'"
        >
          {{ slot.label }}
        </span>

        <!-- Ocupado: vehículo real -->
        <div v-if="slot.ticket" class="flex flex-1 flex-col items-center justify-center">
          <VehicleTopIcon
            :type="zone"
            variant="filled"
            class="h-14 w-10 transition duration-200 group-hover:scale-110 sm:h-16 sm:w-12"
          />
          <span class="mt-1 max-w-full truncate px-0.5 text-[9px] font-bold tracking-wide text-ink sm:text-[10px]">
            {{ slot.ticket.plate }}
          </span>
        </div>

        <!-- Libre: silueta + plus -->
        <div v-else class="flex flex-1 flex-col items-center justify-center gap-1">
          <VehicleTopIcon
            :type="zone"
            variant="ghost"
            class="h-12 w-9 opacity-70 transition group-hover:opacity-100 sm:h-14 sm:w-10"
          />
          <span
            class="flex h-6 w-6 items-center justify-center rounded-full bg-lime text-sm font-bold text-ink shadow-sm transition group-hover:scale-110"
          >
            +
          </span>
        </div>
      </button>
    </div>
  </div>
</template>
