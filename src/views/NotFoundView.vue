<template>
  <div class="flex min-h-screen flex-col items-center justify-center gap-6 bg-surface p-8 text-center">
    <span class="flex h-20 w-20 items-center justify-center rounded-3xl bg-ink text-3xl font-bold text-lime">?</span>
    <h1 class="text-2xl font-bold text-ink">Página no encontrada</h1>
    <RouterLink to="/" class="rounded-2xl bg-ink px-6 py-3 text-sm font-semibold text-white">Volver</RouterLink>
  </div>
</template>

<script setup lang="ts">
import { RouterLink } from 'vue-router'
</script>
