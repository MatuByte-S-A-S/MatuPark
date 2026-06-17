<script setup lang="ts">
defineProps<{ label?: string }>()
</script>

<template>
  <div class="flex min-h-[40vh] flex-col items-center justify-center gap-4 py-12">
    <div class="relative flex h-16 w-16 items-center justify-center">
      <span class="absolute inset-0 rounded-2xl bg-lime/15 ring-1 ring-lime/30" />
      <span
        class="relative h-9 w-9 animate-spin rounded-full border-[3px] border-ink/10 border-t-ink"
        aria-hidden="true"
      />
    </div>
    <div class="text-center">
      <p v-if="label" class="text-sm font-bold text-ink">{{ label }}</p>
      <p class="mt-1 text-xs text-muted">Un momento…</p>
    </div>
  </div>
</template>
