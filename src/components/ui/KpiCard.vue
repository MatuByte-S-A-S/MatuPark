<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'
import type { IconName } from '@/types/icons'

defineProps<{
  title: string
  value: string | number
  subtitle?: string
  icon?: IconName
  trend?: string
  highlight?: boolean
}>()
</script>

<template>
  <div
    class="flex items-center gap-3 rounded-2xl bg-white px-3.5 py-3 ring-1 ring-black/[0.04] transition sm:px-4 sm:py-3.5"
    :class="highlight ? 'ring-lime/60 shadow-[0_0_0_1px_rgba(215,238,70,0.5)]' : 'shadow-sm'"
  >
    <div
      v-if="icon"
      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-lime/20 text-ink"
    >
      <AppIcon :name="icon" :size="18" />
    </div>

    <div class="min-w-0 flex-1">
      <div class="flex items-center justify-between gap-2">
        <p class="truncate text-xs font-medium text-muted">{{ title }}</p>
        <span
          v-if="trend"
          class="shrink-0 rounded-full bg-lime/35 px-2 py-0.5 text-[10px] font-bold text-ink"
        >
          {{ trend }}
        </span>
      </div>
      <p class="truncate text-lg font-bold leading-tight tracking-tight text-ink sm:text-xl">
        {{ value }}
      </p>
      <p v-if="subtitle" class="truncate text-[10px] text-muted">{{ subtitle }}</p>
    </div>
  </div>
</template>
