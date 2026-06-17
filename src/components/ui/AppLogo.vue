<script setup lang="ts">
import { APP_LOGO, APP_NAME } from '@/constants/branding'

withDefaults(
  defineProps<{
    showName?: boolean
    size?: 'sm' | 'md' | 'lg'
    nameClass?: string
    alwaysShowName?: boolean
  }>(),
  {
    showName: true,
    size: 'md',
    nameClass: 'font-bold text-ink',
    alwaysShowName: false,
  }
)

const sizeClass = {
  sm: 'h-8',
  md: 'h-10',
  lg: 'h-12',
} as const
</script>

<template>
  <div class="flex shrink-0 items-center gap-2.5">
    <img :src="APP_LOGO" :alt="APP_NAME" :class="[sizeClass[size], 'w-auto object-contain']" />
    <span
      v-if="showName"
      :class="[nameClass, alwaysShowName ? '' : 'hidden sm:inline']"
    >
      {{ APP_NAME }}
    </span>
  </div>
</template>
