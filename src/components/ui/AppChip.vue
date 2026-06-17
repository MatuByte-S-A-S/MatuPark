<script setup lang="ts">
defineProps<{ active?: boolean }>()
</script>

<template>
  <button
    type="button"
    class="pp-chip"
    :class="active ? 'pp-chip-active' : 'pp-chip-inactive'"
  >
    <slot />
  </button>
</template>
