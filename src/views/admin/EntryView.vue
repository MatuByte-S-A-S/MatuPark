<script setup lang="ts">
import { ref, computed, watch } from 'vue'
import { useTicketsStore } from '@/stores/tickets'
import { useParkingStore } from '@/stores/parking'
import { useQr } from '@/composables/useQr'
import { useNotify } from '@/composables/useNotify'
import AppButton from '@/components/ui/AppButton.vue'
import VehicleTypePicker from '@/components/ui/VehicleTypePicker.vue'
import PrintableTicket from '@/components/tickets/PrintableTicket.vue'
import type { Ticket, VehicleType } from '@/types'

const tickets = useTicketsStore()
const parking = useParkingStore()
const notify = useNotify()

const plate = ref('')
const vehicleType = ref<VehicleType>('car')
const created = ref<Ticket | null>(null)

const ticketCode = computed(() => created.value?.code ?? '')
const { dataUrl: qrDataUrl } = useQr(ticketCode)

watch(plate, (v) => {
  const upper = v.toUpperCase().replace(/[^A-Z0-9]/g, '')
  if (upper !== v) plate.value = upper
})

async function submit() {
  if (!plate.value.trim()) {
    notify.error('Placa requerida')
    return
  }
  const { data, error: err } = await tickets.registerEntry(plate.value, vehicleType.value)
  if (err) {
    notify.error('No se registró', err.message)
    return
  }
  created.value = data ?? null
  notify.success('Ingreso registrado', `Código ${created.value?.code}`)
}

function printTicket() {
  window.print()
}

function newEntry() {
  created.value = null
  plate.value = ''
  vehicleType.value = 'car'
}
</script>

<template>
  <div class="mx-auto max-w-2xl">
    <form v-if="!created" class="pp-card p-6" @submit.prevent="submit">
      <label class="mb-2 block text-sm font-semibold text-ink">Placa</label>
      <input
        v-model="plate"
        type="text"
        required
        placeholder="ABC123"
        autocomplete="off"
        class="mb-6 w-full rounded-2xl border-0 bg-surface px-5 py-4 text-center text-3xl font-bold uppercase tracking-[0.2em] text-ink ring-1 ring-black/10 focus:outline-none focus:ring-2 focus:ring-lime"
        @keyup.enter="submit"
      />

      <p class="mb-3 text-sm font-semibold text-ink">Tipo de vehículo</p>
      <VehicleTypePicker v-model="vehicleType" class="mb-6" />

      <AppButton type="submit" class="w-full" size="lg" :loading="tickets.loading" show-arrow>
        Registrar ingreso
      </AppButton>
    </form>

    <div v-else class="space-y-4">
      <div class="pp-card p-4">
        <PrintableTicket :lot="parking.lot" :ticket="created" :qr-data-url="qrDataUrl" />
      </div>
      <div class="flex gap-3 no-print">
        <AppButton class="flex-1" show-arrow @click="printTicket">Imprimir</AppButton>
        <AppButton variant="secondary" class="flex-1" @click="newEntry">Otro ingreso</AppButton>
      </div>
    </div>
  </div>
</template>
