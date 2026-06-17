<script setup lang="ts">
defineProps<{
  label?: string
  modelValue?: string
  required?: boolean
}>()

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <label class="block space-y-2">
    <span v-if="label" class="text-sm font-semibold text-ink">{{ label }}</span>
    <select
      :value="modelValue"
      :required="required"
      class="w-full appearance-none rounded-2xl border-0 bg-surface px-4 py-3.5 text-sm text-ink shadow-inner ring-1 ring-black/[0.06] focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime"
      @change="$emit('update:modelValue', ($event.target as HTMLSelectElement).value)"
    >
      <slot />
    </select>
  </label>
</template>
