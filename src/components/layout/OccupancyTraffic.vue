<script setup lang="ts">
import { computed } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useParkingStore } from '@/stores/parking'

const dashboard = useDashboardStore()
const parking = useParkingStore()

function level(available: number, max: number) {
  if (max <= 0) return { color: 'bg-muted', label: '—' }
  const ratio = available / max
  if (ratio > 0.4) return { color: 'bg-lime shadow-[0_0_12px_#d7ee46]', label: 'OK' }
  if (ratio > 0.15) return { color: 'bg-amber-400 shadow-[0_0_10px_#fbbf24]', label: 'Medio' }
  if (available > 0) return { color: 'bg-orange-500 shadow-[0_0_10px_#f97316]', label: 'Bajo' }
  return { color: 'bg-red-500 shadow-[0_0_10px_#ef4444] animate-pulse', label: 'Lleno' }
}

const cars = computed(() =>
  level(dashboard.stats.availableCars, parking.settings?.max_cars ?? 0)
)
const motos = computed(() =>
  level(dashboard.stats.availableMotos, parking.settings?.max_motos ?? 0)
)
</script>

<template>
  <div class="hidden items-center gap-3 rounded-2xl bg-white px-4 py-2 shadow-sm ring-1 ring-black/5 md:flex">
    <div class="flex items-center gap-2">
      <span class="text-xs font-semibold text-muted">Carros</span>
      <span class="h-3 w-3 rounded-full" :class="cars.color" :title="cars.label" />
      <span class="text-sm font-bold tabular-nums text-ink">{{ dashboard.stats.availableCars }}</span>
    </div>
    <div class="h-6 w-px bg-surface" />
    <div class="flex items-center gap-2">
      <span class="text-xs font-semibold text-muted">Motos</span>
      <span class="h-3 w-3 rounded-full" :class="motos.color" :title="motos.label" />
      <span class="text-sm font-bold tabular-nums text-ink">{{ dashboard.stats.availableMotos }}</span>
    </div>
  </div>
</template>
