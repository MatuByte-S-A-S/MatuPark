<script setup lang="ts">
import { computed } from 'vue'
import { iconMap, type IconName } from '@/types/icons'

const props = withDefaults(
  defineProps<{
    name: IconName
    size?: number
    strokeWidth?: number
    iconClass?: string
  }>(),
  { size: 18, strokeWidth: 2 }
)

const IconComponent = computed(() => iconMap[props.name])
</script>

<template>
  <component
    :is="IconComponent"
    :size="size"
    :stroke-width="strokeWidth"
    :class="iconClass"
    aria-hidden="true"
  />
</template>
