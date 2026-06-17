<script setup lang="ts">
defineProps<{ name: string; class?: string }>()
</script>

<template>
  <svg
    class="h-5 w-5 shrink-0"
    :class="$props.class"
    fill="none"
    viewBox="0 0 24 24"
    stroke="currentColor"
    stroke-width="1.75"
    aria-hidden="true"
  >
    <path v-if="name === 'home'" stroke-linecap="round" stroke-linejoin="round" d="M3 10.5L12 3l9 7.5M5 10v10h5v-6h4v6h5V10" />
    <path v-else-if="name === 'plus'" stroke-linecap="round" d="M12 5v14M5 12h14" />
    <path v-else-if="name === 'exit'" stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a2 2 0 01-2 2H6a2 2 0 01-2-2V7a2 2 0 012-2h4a2 2 0 012 2v1" />
    <path v-else-if="name === 'parking'" stroke-linecap="round" stroke-linejoin="round" d="M4 6h16M4 10h16M4 14h10M4 18h6" />
    <path v-else-if="name === 'cash'" stroke-linecap="round" stroke-linejoin="round" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
    <path v-else-if="name === 'chart'" stroke-linecap="round" stroke-linejoin="round" d="M4 19h16M6 16l4-5 4 3 4-8" />
    <g v-else-if="name === 'settings'">
      <path stroke-linecap="round" stroke-linejoin="round" d="M12 15a3 3 0 100-6 3 3 0 000 6z" />
      <path stroke-linecap="round" stroke-linejoin="round" d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 01-2.83 2.83l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
    </g>
    <path v-else-if="name === 'users'" stroke-linecap="round" stroke-linejoin="round" d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2M9 11a4 4 0 100-8 4 4 0 000 8m12 10v-2a4 4 0 00-3-3.87M16 3.13a4 4 0 010 7.75" />
    <path v-else-if="name === 'star'" stroke-linecap="round" stroke-linejoin="round" d="M12 2l2.4 7.4H22l-6 4.6 2.3 7-6.3-4.6L6 21l2.3-7-6-4.6h7.6L12 2z" />
    <path v-else-if="name === 'menu'" stroke-linecap="round" d="M4 7h16M4 12h16M4 17h16" />
    <path v-else-if="name === 'logout'" stroke-linecap="round" stroke-linejoin="round" d="M17 16l4-4m0 0l-4-4m4 4H9m4 4v1a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2v1" />
  </svg>
</template>
