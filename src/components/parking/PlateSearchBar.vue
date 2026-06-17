<script setup lang="ts">
import { ref, watch } from 'vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { searchActiveTickets } from '@/utils/plateSearch'
import type { Ticket } from '@/types'

const props = defineProps<{
  tickets: Ticket[]
}>()

const emit = defineEmits<{ found: [ticket: Ticket] }>()

const query = ref('')
const notFound = ref(false)
const ambiguous = ref(false)
const notFoundLabel = ref('')

watch(query, (v) => {
  const upper = v.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (upper !== v) query.value = upper
  if (upper) {
    notFound.value = false
    ambiguous.value = false
  }
})

function runSearch() {
  const q = query.value.trim()
  if (!q) return

  const results = searchActiveTickets(props.tickets, q)
  notFoundLabel.value = q

  if (!results.length) {
    notFound.value = true
    ambiguous.value = false
    return
  }

  const exact = results.filter((t) => t.plate === q || t.code === q)
  const ticket = exact.length === 1 ? exact[0] : results.length === 1 ? results[0] : null

  if (!ticket) {
    notFound.value = false
    ambiguous.value = true
    return
  }

  notFound.value = false
  ambiguous.value = false
  query.value = ''
  emit('found', ticket)
}

function onKeydown(e: KeyboardEvent) {
  if (e.key === 'Enter') runSearch()
}
</script>

<template>
  <div class="w-full sm:max-w-md">
    <div class="flex items-center gap-2">
      <div class="relative min-w-0 flex-1">
        <AppIcon
          name="search"
          :size="15"
          icon-class="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-muted"
        />
        <input
          v-model="query"
          type="text"
          placeholder="Placa o ticket…"
          autocomplete="off"
          class="w-full rounded-xl border-0 bg-surface py-2 pl-9 pr-3 text-sm font-semibold uppercase tracking-wide text-ink ring-1 ring-black/[0.06] placeholder:normal-case placeholder:font-normal placeholder:tracking-normal placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-lime"
          @keydown="onKeydown"
        />
      </div>
      <AppButton size="sm" variant="secondary" class="shrink-0 px-3" @click="runSearch">
        Buscar
      </AppButton>
    </div>
    <p v-if="notFound" class="mt-1.5 text-xs text-red-600">
      No hay vehículo activo con <span class="font-semibold">{{ notFoundLabel }}</span>
    </p>
    <p v-else-if="ambiguous" class="mt-1.5 text-xs text-amber-700">
      Varias coincidencias — escribe la placa o ticket completo
    </p>
  </div>
</template>
