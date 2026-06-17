<script setup lang="ts">
import { computed } from 'vue'
import { getOccupancyLevel } from '@/utils/occupancy'

const props = defineProps<{ available: number; capacity: number }>()

const level = computed(() => getOccupancyLevel(props.available, props.capacity))
</script>

<template>
  <div class="flex flex-wrap items-center gap-2">
    <span class="h-2.5 w-2.5 rounded-full" :class="level.color" />
    <span
      class="text-sm font-semibold"
      :class="level.level === 'full' ? 'text-ink' : 'text-ink/80'"
    >
      {{ level.label }}
    </span>
    <span class="text-sm text-muted">({{ available }} / {{ capacity }})</span>
  </div>
</template>
