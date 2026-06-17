<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useOperationQueueStore } from '@/stores/operationQueue'
import { useNotify } from '@/composables/useNotify'
import AppModal from '@/components/ui/AppModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import VehicleTopIcon from '@/components/parking/VehicleTopIcon.vue'
import type { VehicleType } from '@/types'

const props = defineProps<{
  open: boolean
  slotId: string
  zone: VehicleType
}>()

const emit = defineEmits<{ close: [] }>()

const queue = useOperationQueueStore()
const notify = useNotify()

const plate = ref('')

watch(
  () => props.open,
  (v) => {
    if (v) plate.value = ''
  }
)

watch(plate, (v) => {
  const upper = v.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (upper !== v) plate.value = upper
})

const zoneLabel = computed(() => (props.zone === 'car' ? 'Carro' : 'Moto'))

function submit() {
  if (!plate.value.trim()) {
    notify.error('Ingresa la placa')
    return
  }
  queue.enqueueEntry(plate.value, props.zone)
  emit('close')
}
</script>

<template>
  <AppModal :open="open" :title="`Ingreso · cupo ${slotId}`" @close="$emit('close')">
    <div class="space-y-5">
      <div class="flex items-center gap-4 rounded-2xl bg-surface p-4">
        <VehicleTopIcon :type="zone" class="h-16 w-12 shrink-0" />
        <div>
          <p class="text-sm font-bold text-ink">{{ zoneLabel }}</p>
          <p class="text-xs text-muted">Cupo {{ slotId }} · se procesa en segundo plano</p>
        </div>
      </div>

      <div>
        <label class="mb-2 block text-sm font-semibold text-ink">Placa del vehículo</label>
        <input
          v-model="plate"
          type="text"
          autofocus
          placeholder="ABC123"
          autocomplete="off"
          class="w-full rounded-2xl border-0 bg-surface px-5 py-4 text-center text-2xl font-bold uppercase tracking-[0.15em] text-ink ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-lime"
          @keyup.enter="submit"
        />
      </div>

      <AppButton class="w-full" size="lg" show-arrow @click="submit">
        Registrar {{ zoneLabel.toLowerCase() }}
      </AppButton>
    </div>
  </AppModal>
</template>
