<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute } from 'vue-router'
import PublicLayout from '@/layouts/PublicLayout.vue'
import { useRealtimeTicket } from '@/composables/useRealtimeTicket'
import { matudb } from '@/lib/matudb'
import type { ParkingLot, Settings } from '@/types'
import { calculateAmount, formatCurrency, formatDuration, getHourlyRate } from '@/utils/billing'

const route = useRoute()
const code = (route.params.code as string).toUpperCase()
const { ticket, loading } = useRealtimeTicket(code)

const lot = ref<ParkingLot | null>(null)
const settings = ref<Settings | null>(null)
const now = ref(Date.now())
let timer: ReturnType<typeof setInterval>

const billing = computed(() => {
  if (!ticket.value || !settings.value || ticket.value.status === 'FINALIZED') return null
  return calculateAmount(settings.value, ticket.value.vehicle_type, ticket.value.entry_at, new Date(now.value))
})

const elapsed = computed(() => {
  if (!ticket.value) return ''
  const mins = Math.floor((now.value - new Date(ticket.value.entry_at).getTime()) / 60000)
  return formatDuration(mins)
})

async function loadLot(parkingLotId: string) {
  const [lotRes, settingsRes] = await Promise.all([
    matudb.from('parking_lots').select('*').eq('id', parkingLotId).single(),
    matudb.from('settings').select('*').eq('parking_lot_id', parkingLotId).single(),
  ])
  lot.value = (lotRes.data as ParkingLot) ?? null
  settings.value = (settingsRes.data as Settings) ?? null
}

watch(ticket, (t) => {
  if (t) loadLot(t.parking_lot_id)
})

onMounted(() => {
  timer = setInterval(() => {
    now.value = Date.now()
  }, 1000)
})

onUnmounted(() => clearInterval(timer))
</script>

<template>
  <PublicLayout>
    <div v-if="loading" class="py-20 text-center text-muted">Cargando ticket...</div>
    <div v-else-if="!ticket" class="pp-card py-16 text-center">
      <h2 class="text-xl font-bold text-ink">Ticket no encontrado</h2>
      <p class="mt-2 text-muted">Código {{ code }}</p>
    </div>
    <div v-else class="pp-card overflow-hidden">
      <div class="bg-ink px-6 py-8 text-center text-white">
        <img v-if="lot?.logo_url" :src="lot.logo_url" alt="" class="mx-auto h-12 object-contain" />
        <h1 class="mt-3 text-lg font-bold">{{ lot?.name }}</h1>
        <p class="mt-2 font-mono text-3xl font-bold tracking-[0.2em] text-lime">{{ ticket.code }}</p>
      </div>

      <dl class="space-y-0 px-6 py-6">
        <div class="flex justify-between border-b border-surface py-3">
          <dt class="text-sm text-muted">Placa</dt>
          <dd class="font-bold text-ink">{{ ticket.plate }}</dd>
        </div>
        <div class="flex justify-between border-b border-surface py-3">
          <dt class="text-sm text-muted">Tipo</dt>
          <dd class="font-semibold">{{ ticket.vehicle_type === 'car' ? 'Carro' : 'Moto' }}</dd>
        </div>
        <div class="flex justify-between border-b border-surface py-3">
          <dt class="text-sm text-muted">Ingreso</dt>
          <dd class="text-sm font-medium">{{ new Date(ticket.entry_at).toLocaleString('es-CO') }}</dd>
        </div>
        <div class="flex justify-between border-b border-surface py-3">
          <dt class="text-sm text-muted">Tiempo</dt>
          <dd class="font-semibold">{{ elapsed }}</dd>
        </div>
        <div
          v-if="settings && ticket.status === 'ACTIVE'"
          class="flex justify-between py-3"
        >
          <dt class="text-sm text-muted">Tarifa / h</dt>
          <dd class="font-semibold">{{ formatCurrency(getHourlyRate(settings, ticket.vehicle_type)) }}</dd>
        </div>
      </dl>

      <div class="border-t border-surface bg-surface/50 px-6 py-8 text-center">
        <span
          class="inline-flex rounded-full px-4 py-1.5 text-sm font-bold"
          :class="ticket.status === 'ACTIVE' ? 'bg-lime text-ink' : 'bg-ink text-white'"
        >
          {{ ticket.status === 'ACTIVE' ? 'Activo' : 'Finalizado' }}
        </span>
        <p v-if="ticket.status === 'ACTIVE' && billing" class="mt-6 text-4xl font-bold text-ink">
          {{ formatCurrency(billing.amount) }}
        </p>
        <p v-else-if="ticket.status === 'FINALIZED'" class="mt-6 text-4xl font-bold text-ink">
          {{ formatCurrency(Number(ticket.amount_paid ?? 0)) }}
        </p>
        <p class="mt-2 text-xs text-muted">Total en tiempo real</p>
      </div>
    </div>
  </PublicLayout>
</template>
