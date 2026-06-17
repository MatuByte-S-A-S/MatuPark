<script setup lang="ts">
import { useNotify } from '@/composables/useNotify'

const { visible, type, title, message, close } = useNotify()

const styles = {
  success: 'border-lime bg-white ring-lime/40',
  error: 'border-red-400 bg-white ring-red-200',
  info: 'border-ink/20 bg-white',
}
</script>

<template>
  <Teleport to="body">
    <Transition name="toast-pop">
      <div
        v-if="visible"
        class="fixed bottom-6 left-1/2 z-[110] w-[min(400px,calc(100vw-2rem))] -translate-x-1/2"
      >
        <div
          class="flex items-start gap-4 rounded-2xl border-l-4 p-5 shadow-xl ring-1"
          :class="styles[type]"
        >
          <div
            class="flex h-10 w-10 shrink-0 items-center justify-center rounded-full"
            :class="type === 'success' ? 'bg-lime text-ink' : type === 'error' ? 'bg-red-100 text-red-600' : 'bg-surface'"
          >
            <svg v-if="type === 'success'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2.5">
              <path stroke-linecap="round" stroke-linejoin="round" d="M5 13l4 4L19 7" />
            </svg>
            <svg v-else-if="type === 'error'" class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
              <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <div class="min-w-0 flex-1">
            <p class="font-bold text-ink">{{ title }}</p>
            <p v-if="message" class="mt-0.5 text-sm text-muted">{{ message }}</p>
          </div>
          <button type="button" class="text-muted hover:text-ink" @click="close">✕</button>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.toast-pop-enter-active {
  animation: toast-in 0.35s cubic-bezier(0.34, 1.4, 0.64, 1);
}
.toast-pop-leave-active {
  animation: toast-out 0.25s ease forwards;
}
@keyframes toast-in {
  from {
    opacity: 0;
    transform: translate(-50%, 16px) scale(0.95);
  }
  to {
    opacity: 1;
    transform: translate(-50%, 0) scale(1);
  }
}
@keyframes toast-out {
  to {
    opacity: 0;
    transform: translate(-50%, 8px) scale(0.98);
  }
}
</style>
