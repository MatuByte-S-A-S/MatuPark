<script setup lang="ts">
import { computed } from 'vue'
import { useOperationQueueStore, type QueueOperation } from '@/stores/operationQueue'

const queue = useOperationQueueStore()

const visible = computed(() => queue.hasItems)

function statusIcon(op: QueueOperation) {
  if (op.status === 'running' || op.status === 'pending') return 'spinner'
  if (op.status === 'done') return 'done'
  return 'error'
}
</script>

<template>
  <Teleport to="body">
    <Transition name="queue-slide">
      <div
        v-if="visible"
        class="fixed bottom-5 right-4 z-[105] w-[min(320px,calc(100vw-2rem))] sm:bottom-6 sm:right-6"
      >
        <div class="overflow-hidden rounded-2xl bg-white shadow-2xl ring-1 ring-black/[0.08]">
          <button
            type="button"
            class="flex w-full items-center justify-between gap-2 border-b border-black/[0.06] px-4 py-3 text-left transition hover:bg-surface/50"
            @click="queue.toggleExpanded()"
          >
            <div class="min-w-0">
              <p class="text-sm font-bold text-ink">
                {{ queue.activeCount ? `Procesando (${queue.activeCount})` : 'Operaciones' }}
              </p>
              <p class="text-[10px] text-muted">Ingresos y salidas en segundo plano</p>
            </div>
            <span
              class="flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-surface text-muted transition"
              :class="queue.expanded ? 'rotate-180' : ''"
            >
              ▲
            </span>
          </button>

          <ul v-show="queue.expanded" class="max-h-56 overflow-y-auto">
            <li
              v-for="op in queue.items"
              :key="op.id"
              class="flex items-start gap-3 border-b border-black/[0.04] px-4 py-3 last:border-0"
            >
              <span class="mt-0.5 flex h-5 w-5 shrink-0 items-center justify-center">
                <span
                  v-if="statusIcon(op) === 'spinner'"
                  class="h-4 w-4 animate-spin rounded-full border-2 border-ink/15 border-t-ink"
                />
                <span
                  v-else-if="statusIcon(op) === 'done'"
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-lime text-[10px] font-bold text-ink"
                >
                  ✓
                </span>
                <span
                  v-else-if="statusIcon(op) === 'error'"
                  class="flex h-5 w-5 items-center justify-center rounded-full bg-red-100 text-[10px] font-bold text-red-600"
                >
                  !
                </span>
              </span>

              <div class="min-w-0 flex-1">
                <p class="truncate text-sm font-semibold text-ink">{{ op.label }}</p>
                <p v-if="op.status === 'running'" class="text-[11px] text-muted">Guardando…</p>
                <p v-else-if="op.status === 'pending'" class="text-[11px] text-muted">En cola…</p>
                <p v-else-if="op.status === 'done'" class="text-[11px] text-green-700">Completado</p>
                <p v-else-if="op.error" class="text-[11px] text-red-600">{{ op.error }}</p>
              </div>

              <button
                v-if="op.status === 'done' || op.status === 'error'"
                type="button"
                class="shrink-0 text-xs text-muted hover:text-ink"
                @click="queue.dismiss(op.id)"
              >
                ✕
              </button>
            </li>
          </ul>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.queue-slide-enter-active {
  animation: queue-in 0.3s cubic-bezier(0.34, 1.2, 0.64, 1);
}
.queue-slide-leave-active {
  animation: queue-out 0.2s ease forwards;
}
@keyframes queue-in {
  from {
    opacity: 0;
    transform: translateY(12px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
@keyframes queue-out {
  to {
    opacity: 0;
    transform: translateY(8px);
  }
}
</style>
