<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useParkingStore } from '@/stores/parking'
import {
  getCurrencyConfig,
  parseCurrencyInput,
  formatCurrencyInput,
} from '@/utils/currency'

const props = withDefaults(
  defineProps<{
    modelValue: number
    label?: string
    placeholder?: string
    required?: boolean
    hint?: string
  }>(),
  { modelValue: 0 }
)

const emit = defineEmits<{ 'update:modelValue': [value: number] }>()

const parking = useParkingStore()
const config = computed(() => getCurrencyConfig(parking.settings))
const display = ref('')
const focused = ref(false)

function syncDisplay(value: number) {
  display.value = value > 0 ? formatCurrencyInput(value, config.value) : ''
}

watch(
  () => props.modelValue,
  (v) => {
    if (!focused.value) syncDisplay(v)
  },
  { immediate: true }
)

watch(config, () => {
  if (!focused.value && props.modelValue > 0) {
    syncDisplay(props.modelValue)
  }
})

function onFocus() {
  focused.value = true
  if (props.modelValue > 0) {
    display.value = formatCurrencyInput(props.modelValue, config.value)
  }
}

function onBlur() {
  focused.value = false
  syncDisplay(props.modelValue)
}

function onInput(e: Event) {
  const raw = (e.target as HTMLInputElement).value
  const num = parseCurrencyInput(raw)
  emit('update:modelValue', num)
  display.value = num > 0 ? formatCurrencyInput(num, config.value) : raw.replace(/[^\d]/g, '')
}
</script>

<template>
  <label class="block space-y-2">
    <span v-if="label" class="text-sm font-semibold text-ink">{{ label }}</span>
    <input
      type="text"
      inputmode="numeric"
      autocomplete="off"
      :value="display"
      :placeholder="placeholder || config.code"
      :required="required"
      class="w-full rounded-2xl border-0 bg-surface px-4 py-3.5 text-sm font-semibold text-ink shadow-inner ring-1 ring-black/[0.06] transition placeholder:font-normal placeholder:text-muted focus:bg-white focus:outline-none focus:ring-2 focus:ring-lime"
      @focus="onFocus"
      @blur="onBlur"
      @input="onInput"
    />
    <span v-if="hint" class="text-xs text-muted">{{ hint }}</span>
  </label>
</template>
