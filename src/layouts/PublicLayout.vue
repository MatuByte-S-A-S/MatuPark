<script setup lang="ts">
import AppLogo from '@/components/ui/AppLogo.vue'
import { APP_COMPANY, APP_NAME } from '@/constants/branding'

withDefaults(defineProps<{ live?: boolean }>(), { live: false })
</script>

<template>
  <div class="min-h-screen bg-[#eef0f2]">
    <header class="sticky top-0 z-30 border-b border-black/[0.04] bg-white/90 backdrop-blur-xl">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between px-4 sm:px-6 lg:px-8">
        <AppLogo />
        <span
          v-if="live"
          class="pp-live-dot inline-flex items-center rounded-full bg-lime/40 px-3 py-1 text-xs font-bold text-ink"
        >
          En vivo
        </span>
      </div>
    </header>
    <main class="mx-auto w-full max-w-6xl px-4 pb-10 pt-6 sm:px-6 lg:px-8 lg:pb-16">
      <slot />
    </main>
    <footer class="border-t border-black/[0.04] bg-white py-8 text-center">
      <p class="text-sm text-muted">
        Powered by <strong class="text-ink">{{ APP_NAME }}</strong> of <strong class="text-ink">{{ APP_COMPANY }}</strong>
      </p>
      <p class="mt-1 text-xs text-muted/80">Software de administración de parqueaderos</p>
    </footer>
  </div>
</template>
