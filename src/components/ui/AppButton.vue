<script setup lang="ts">
withDefaults(
  defineProps<{
    variant?: 'primary' | 'secondary' | 'ghost' | 'danger' | 'lime'
    size?: 'sm' | 'md' | 'lg'
    loading?: boolean
    type?: 'button' | 'submit'
    disabled?: boolean
    showArrow?: boolean
  }>(),
  { variant: 'primary', size: 'md', type: 'button', showArrow: false }
)

const variantClass: Record<string, string> = {
  primary: 'bg-ink text-white hover:bg-ink/90 shadow-lg shadow-ink/15',
  secondary: 'bg-white text-ink ring-1 ring-black/10 hover:bg-surface',
  ghost: 'text-ink/70 hover:bg-white/80',
  danger: 'bg-red-600 text-white hover:bg-red-700',
  lime: 'bg-lime text-ink hover:bg-lime-dark font-semibold',
}

const sizeClass: Record<string, string> = {
  sm: 'px-4 py-2 text-sm rounded-2xl',
  md: 'px-5 py-3 text-sm rounded-2xl',
  lg: 'px-6 py-4 text-base rounded-3xl',
}
</script>

<template>
  <button
    :type="type"
    :disabled="disabled || loading"
    class="inline-flex items-center justify-center gap-2 font-semibold transition disabled:cursor-not-allowed disabled:opacity-50"
    :class="[variantClass[variant], sizeClass[size], showArrow && variant === 'primary' ? 'justify-between w-full pl-6 pr-2' : '']"
  >
    <span v-if="loading" class="h-4 w-4 animate-spin rounded-full border-2 border-white/30 border-t-white" />
    <slot />
    <span
      v-if="showArrow && variant === 'primary' && !loading"
      class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-lime text-ink"
    >
      <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
        <path stroke-linecap="round" stroke-linejoin="round" d="M9 5l7 7-7 7" />
      </svg>
    </span>
  </button>
</template>
