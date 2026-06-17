<script setup lang="ts">
defineProps<{
  open: boolean
  title?: string
  wide?: boolean
}>()

defineEmits<{ close: [] }>()
</script>

<template>
  <Teleport to="body">
    <Transition name="modal-fade">
      <div
        v-if="open"
        class="fixed inset-0 z-[100] flex items-center justify-center p-4"
        @click.self="$emit('close')"
      >
        <div class="absolute inset-0 bg-ink/50 backdrop-blur-sm" />
        <div
          class="relative z-10 flex max-h-[min(90vh,800px)] w-full flex-col overflow-hidden rounded-3xl bg-white shadow-2xl"
          :class="wide ? 'max-w-4xl' : 'max-w-lg'"
          role="dialog"
        >
          <div v-if="title" class="flex shrink-0 items-center justify-between border-b border-surface px-6 py-4">
            <h3 class="text-lg font-bold text-ink">{{ title }}</h3>
            <button
              type="button"
              class="flex h-9 w-9 items-center justify-center rounded-full text-muted transition hover:bg-surface hover:text-ink"
              @click="$emit('close')"
            >
              <svg class="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
                <path stroke-linecap="round" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          <div class="min-h-0 flex-1 overflow-y-auto overscroll-contain p-6">
            <slot />
          </div>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.modal-fade-enter-active,
.modal-fade-leave-active {
  transition: opacity 0.2s ease;
}
.modal-fade-enter-active .relative,
.modal-fade-leave-active .relative {
  transition: transform 0.25s cubic-bezier(0.34, 1.4, 0.64, 1), opacity 0.2s ease;
}
.modal-fade-enter-from,
.modal-fade-leave-to {
  opacity: 0;
}
.modal-fade-enter-from .relative {
  transform: scale(0.94) translateY(8px);
  opacity: 0;
}
</style>
