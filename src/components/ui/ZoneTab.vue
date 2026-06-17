<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'

defineProps<{
  value: string
  label: string
  active?: boolean
}>()

defineEmits<{ click: [] }>()
</script>

<template>
  <button
    type="button"
    class="inline-flex items-center gap-1.5 rounded-full px-4 py-2.5 text-sm font-bold transition"
    :class="active ? 'pp-zone-tab-active' : 'pp-zone-tab-inactive'"
    @click="$emit('click')"
  >
    <AppIcon :name="value === 'car' ? 'car' : 'bike'" :size="16" />
    {{ label }}
  </button>
</template>
