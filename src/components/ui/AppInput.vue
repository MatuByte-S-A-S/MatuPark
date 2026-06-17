<script setup lang="ts">
defineProps<{
  label?: string
  modelValue?: string | number
  type?: string
  placeholder?: string
  required?: boolean
  hint?: string
}>()

defineEmits<{ 'update:modelValue': [value: string] }>()
</script>

<template>
  <label class="block space-y-2">
    <span v-if="label" class="text-sm font-semibold text-ink">{{ label }}</span>
    <input
      :type="type || 'text'"
      :value="modelValue"
      :placeholder="placeholder"
      :required="required"
      class="w-full rounded-2xl border-0 bg-surface px-4 py-3.5 text-sm text-ink shadow-inner ring-1 ring-black/[0.06] transition placeholder:text-muted focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime"
      @input="$emit('update:modelValue', ($event.target as HTMLInputElement).value)"
    />
    <span v-if="hint" class="text-xs text-muted">{{ hint }}</span>
  </label>
</template>
