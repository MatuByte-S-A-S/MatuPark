<script setup lang="ts">
withDefaults(
  defineProps<{
    type: 'car' | 'moto'
    variant?: 'filled' | 'ghost' | 'outline'
    iconClass?: string
  }>(),
  { variant: 'filled' }
)
</script>

<template>
  <!-- Carro vista superior -->
  <svg
    v-if="type === 'car'"
    :class="iconClass"
    viewBox="0 0 80 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <ellipse cx="40" cy="108" rx="26" ry="6" :class="variant === 'ghost' ? 'fill-black/5' : 'fill-black/10'" />
    <rect
      x="14"
      y="28"
      width="52"
      height="72"
      rx="14"
      :class="variant === 'filled' ? 'fill-ink' : variant === 'ghost' ? 'fill-ink/15' : 'fill-white stroke-ink/25'"
      :stroke-width="variant === 'outline' ? 2 : 0"
      stroke="currentColor"
    />
    <rect x="22" y="36" width="36" height="22" rx="6" :class="variant === 'filled' ? 'fill-lime/90' : 'fill-ink/10'" />
    <rect x="20" y="66" width="40" height="26" rx="5" :class="variant === 'filled' ? 'fill-white/15' : 'fill-ink/8'" />
    <circle cx="22" cy="96" r="9" :class="variant === 'filled' ? 'fill-ink stroke-white' : 'fill-ink/20 stroke-ink/30'" stroke-width="3" />
    <circle cx="58" cy="96" r="9" :class="variant === 'filled' ? 'fill-ink stroke-white' : 'fill-ink/20 stroke-ink/30'" stroke-width="3" />
    <circle cx="22" cy="96" r="3" fill="white" :class="variant === 'ghost' ? 'opacity-40' : ''" />
    <circle cx="58" cy="96" r="3" fill="white" :class="variant === 'ghost' ? 'opacity-40' : ''" />
  </svg>

  <!-- Moto vista superior -->
  <svg
    v-else
    :class="iconClass"
    viewBox="0 0 56 120"
    fill="none"
    xmlns="http://www.w3.org/2000/svg"
    aria-hidden="true"
  >
    <ellipse cx="28" cy="108" rx="18" ry="5" :class="variant === 'ghost' ? 'fill-black/5' : 'fill-black/10'" />
    <rect x="22" y="18" width="12" height="8" rx="3" :class="variant === 'filled' ? 'fill-ink' : 'fill-ink/20'" />
    <path
      d="M28 26 L18 42 L14 58 L18 74 L28 88 L38 74 L42 58 L38 42 Z"
      :class="variant === 'filled' ? 'fill-ink' : variant === 'ghost' ? 'fill-ink/15' : 'fill-white stroke-ink/25'"
      :stroke-width="variant === 'outline' ? 2 : 0"
      stroke="currentColor"
    />
    <ellipse cx="28" cy="52" rx="8" ry="12" :class="variant === 'filled' ? 'fill-lime/85' : 'fill-ink/10'" />
    <circle cx="16" cy="92" r="10" :class="variant === 'filled' ? 'fill-ink stroke-white' : 'fill-ink/20 stroke-ink/30'" stroke-width="3" />
    <circle cx="40" cy="92" r="10" :class="variant === 'filled' ? 'fill-ink stroke-white' : 'fill-ink/20 stroke-ink/30'" stroke-width="3" />
    <circle cx="16" cy="92" r="3" fill="white" :class="variant === 'ghost' ? 'opacity-40' : ''" />
    <circle cx="40" cy="92" r="3" fill="white" :class="variant === 'ghost' ? 'opacity-40' : ''" />
  </svg>
</template>
