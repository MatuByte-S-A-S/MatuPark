<script setup lang="ts">
import type { ParkingLot, Ticket } from '@/types'

defineProps<{
  lot: ParkingLot | null
  ticket: Ticket
  qrDataUrl: string
}>()

function formatDateTime(iso: string) {
  const d = new Date(iso)
  return {
    date: d.toLocaleDateString('es-CO'),
    time: d.toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }),
  }
}

function vehicleLabel(type: string) {
  return type === 'car' ? 'Carro' : 'Moto'
}
</script>

<template>
  <div class="print-ticket mx-auto max-w-xs rounded-2xl bg-white p-4 text-center text-ink ring-1 ring-black/10">
    <p class="text-lg font-bold uppercase">{{ lot?.name || 'Parqueadero' }}</p>
    <p v-if="lot?.address" class="text-xs text-muted">{{ lot.address }}</p>
    <div class="my-3 h-px bg-surface" />
    <p class="text-xs font-semibold text-muted">TICKET DE INGRESO</p>
    <p class="mt-2 text-2xl font-bold tracking-widest">{{ ticket.plate }}</p>
    <p class="text-sm font-medium">{{ vehicleLabel(ticket.vehicle_type) }}</p>
    <p class="mt-2 text-xs">
      {{ formatDateTime(ticket.entry_at).date }} — {{ formatDateTime(ticket.entry_at).time }}
    </p>
    <p class="mt-3 font-mono text-xl font-bold">{{ ticket.code }}</p>
    <img v-if="qrDataUrl" :src="qrDataUrl" alt="QR" class="mx-auto mt-3 h-28 w-28 rounded-xl" />
    <p class="mt-2 text-[10px] text-muted">Conserve este ticket</p>
  </div>
</template>
