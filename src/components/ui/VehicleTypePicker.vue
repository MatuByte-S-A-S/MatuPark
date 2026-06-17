<script setup lang="ts">
import type { VehicleType } from '@/types'

const model = defineModel<VehicleType>({ default: 'car' })
</script>

<template>
  <div class="grid grid-cols-2 gap-3">
    <button
      type="button"
      class="flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition"
      :class="model === 'car' ? 'border-ink bg-ink text-white' : 'border-surface bg-white text-ink hover:border-lime'"
      @click="model = 'car'"
    >
      <svg class="h-10 w-10" viewBox="0 0 64 32" fill="currentColor">
        <rect x="4" y="12" width="56" height="14" rx="4" opacity="0.9" />
        <circle cx="14" cy="26" r="5" />
        <circle cx="50" cy="26" r="5" />
        <path d="M12 12 L20 6 H44 L52 12 Z" />
      </svg>
      <span class="text-sm font-bold">Carro</span>
    </button>
    <button
      type="button"
      class="flex flex-col items-center gap-2 rounded-2xl border-2 p-5 transition"
      :class="model === 'moto' ? 'border-ink bg-ink text-white' : 'border-surface bg-white text-ink hover:border-lime'"
      @click="model = 'moto'"
    >
      <svg class="h-10 w-10" viewBox="0 0 48 32" fill="currentColor">
        <circle cx="10" cy="24" r="6" />
        <circle cx="38" cy="24" r="6" />
        <path d="M10 24 L22 8 L32 12 L38 24 Z" />
        <path d="M22 8 L28 4 L34 8" stroke="currentColor" stroke-width="2" fill="none" />
      </svg>
      <span class="text-sm font-bold">Moto</span>
    </button>
  </div>
</template>
