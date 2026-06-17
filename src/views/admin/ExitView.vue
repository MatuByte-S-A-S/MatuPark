<script setup lang="ts">
import { computed } from 'vue'
import { useTicketsStore } from '@/stores/tickets'
import { useParkingStore } from '@/stores/parking'
import { useSpotActions } from '@/composables/useSpotActions'
import { calculateAmount, formatCurrency, formatDuration } from '@/utils/billing'
import { slotIdForTicket } from '@/utils/plateSearch'
import PlateSearchBar from '@/components/parking/PlateSearchBar.vue'
import SpotExitModal from '@/components/parking/SpotExitModal.vue'
import AppButton from '@/components/ui/AppButton.vue'
import type { Ticket } from '@/types'

const tickets = useTicketsStore()
const parking = useParkingStore()

const { exitOpen, exitTicket, exitSlotId, openExit, closeExit } = useSpotActions()

const filtered = computed(() => tickets.activeTickets)

function amountFor(ticket: Ticket) {
  if (!parking.settings) return 0
  return calculateAmount(parking.settings, ticket.vehicle_type, ticket.entry_at).amount
}

function timeFor(ticket: Ticket) {
  if (!parking.settings) return ''
  const b = calculateAmount(parking.settings, ticket.vehicle_type, ticket.entry_at)
  return formatDuration(b.minutes)
}

function onSearchExit(ticket: Ticket) {
  const list = tickets.activeTickets.filter((t) => t.vehicle_type === ticket.vehicle_type)
  openExit(ticket, slotIdForTicket(ticket, list))
}

function vehicleLabel(type: string) {
  return type === 'car' ? 'Carro' : 'Moto'
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-4">
    <div class="pp-card overflow-x-auto">
      <div class="flex flex-wrap items-start justify-between gap-3 border-b border-surface px-4 py-3">
        <div>
          <h3 class="font-bold text-ink">Todos los activos</h3>
          <span class="text-xs text-muted">{{ filtered.length }} vehículos</span>
        </div>
        <PlateSearchBar
          :tickets="tickets.activeTickets"
          @found="onSearchExit"
        />
      </div>
      <table class="w-full min-w-[640px] text-left text-sm">
        <thead class="bg-surface/80 text-xs font-semibold uppercase text-muted">
          <tr>
            <th class="px-4 py-3">Placa</th>
            <th class="px-4 py-3">Código</th>
            <th class="px-4 py-3">Tipo</th>
            <th class="px-4 py-3">Ingreso</th>
            <th class="px-4 py-3">Tiempo</th>
            <th class="px-4 py-3">Total</th>
            <th class="px-4 py-3 text-right">Acción</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="t in filtered"
            :key="t.id"
            class="border-t border-surface transition hover:bg-lime/5"
          >
            <td class="px-4 py-3 font-bold tracking-wide">{{ t.plate }}</td>
            <td class="px-4 py-3 font-mono text-xs">{{ t.code }}</td>
            <td class="px-4 py-3">{{ vehicleLabel(t.vehicle_type) }}</td>
            <td class="px-4 py-3 text-muted">
              {{ new Date(t.entry_at).toLocaleTimeString('es-CO', { hour: '2-digit', minute: '2-digit' }) }}
            </td>
            <td class="px-4 py-3">{{ timeFor(t) }}</td>
            <td class="px-4 py-3 font-semibold">{{ formatCurrency(amountFor(t)) }}</td>
            <td class="px-4 py-3 text-right">
              <AppButton size="sm" @click="onSearchExit(t)">Salida</AppButton>
            </td>
          </tr>
          <tr v-if="!filtered.length">
            <td colspan="7" class="px-4 py-16 text-center text-muted">
              No hay vehículos activos
            </td>
          </tr>
        </tbody>
      </table>
    </div>

    <SpotExitModal
      :open="exitOpen"
      :ticket="exitTicket"
      :slot-id="exitSlotId"
      @close="closeExit()"
    />
  </div>
</template>
