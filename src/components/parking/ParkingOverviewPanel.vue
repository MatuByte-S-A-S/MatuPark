<script setup lang="ts">
import { computed } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'

const props = defineProps<{
  carOccupied: number
  carMax: number
  motoOccupied: number
  motoMax: number
}>()

const bars = computed(() => {
  const carPct = props.carMax > 0 ? Math.round((props.carOccupied / props.carMax) * 100) : 0
  const motoPct = props.motoMax > 0 ? Math.round((props.motoOccupied / props.motoMax) * 100) : 0
  return [
    { label: 'Carros', pct: carPct, occupied: props.carOccupied, max: props.carMax, tone: 'bg-ink' },
    { label: 'Motos', pct: motoPct, occupied: props.motoOccupied, max: props.motoMax, tone: 'bg-lime' },
  ]
})

const totalOccupied = computed(() => props.carOccupied + props.motoOccupied)
const totalMax = computed(() => props.carMax + props.motoMax)
const totalPct = computed(() =>
  totalMax.value > 0 ? Math.round((totalOccupied.value / totalMax.value) * 100) : 0
)
</script>

<template>
  <div class="pp-card p-4">
    <div class="flex items-center justify-between gap-2">
      <h3 class="text-sm font-bold text-ink">Aforo en vivo</h3>
      <span class="pp-live-dot text-[10px] font-semibold text-muted">En vivo</span>
    </div>

    <div class="mt-3 space-y-2.5">
      <div v-for="b in bars" :key="b.label">
        <div class="mb-1 flex items-center justify-between gap-2 text-[10px]">
          <span class="font-semibold text-muted">{{ b.label }}</span>
          <span class="font-bold text-ink">{{ b.occupied }}/{{ b.max }} · {{ b.pct }}%</span>
        </div>
        <div class="h-1.5 overflow-hidden rounded-full bg-surface">
          <div
            class="h-full rounded-full transition-all duration-500"
            :class="b.tone"
            :style="{ width: `${Math.max(b.pct > 0 ? 4 : 0, b.pct)}%` }"
          />
        </div>
      </div>
    </div>

    <div class="mt-3 flex items-center gap-2 border-t border-surface pt-3">
      <span class="flex h-7 w-7 shrink-0 items-center justify-center rounded-lg bg-lime/25 text-ink">
        <AppIcon name="parking" :size="14" />
      </span>
      <div class="min-w-0">
        <p class="text-[10px] text-muted">Ocupación total</p>
        <p class="text-xs font-bold text-ink">{{ totalOccupied }}/{{ totalMax }} cupos · {{ totalPct }}%</p>
      </div>
    </div>
  </div>
</template>
