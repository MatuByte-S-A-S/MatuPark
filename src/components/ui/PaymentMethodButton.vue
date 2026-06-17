<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'
import type { IconName } from '@/types/icons'

defineProps<{
  icon: IconName
  label: string
  active?: boolean
}>()

defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-2 rounded-xl border-2 px-3 py-3 text-left text-sm font-semibold transition"
    :class="active ? 'border-ink bg-ink text-white' : 'border-transparent bg-surface text-ink hover:bg-white'"
    @click="$emit('click')"
  >
    <AppIcon :name="icon" :size="18" :icon-class="active ? 'text-lime' : 'text-ink/70'" />
    <span>{{ label }}</span>
  </button>
</template>
