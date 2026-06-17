<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useParkingStore } from '@/stores/parking'
import { useTicketsStore } from '@/stores/tickets'
import { useSpotActions } from '@/composables/useSpotActions'
import ParkingSpotGrid from '@/components/parking/ParkingSpotGrid.vue'
import SpotEntryModal from '@/components/parking/SpotEntryModal.vue'
import SpotExitModal from '@/components/parking/SpotExitModal.vue'
import PlateSearchBar from '@/components/parking/PlateSearchBar.vue'
import ZoneTab from '@/components/ui/ZoneTab.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import { slotIdForTicket } from '@/utils/plateSearch'
import type { Ticket } from '@/types'

const dashboard = useDashboardStore()
const parking = useParkingStore()
const tickets = useTicketsStore()
const {
  entryOpen,
  exitOpen,
  entrySlotId,
  entryZone,
  exitTicket,
  exitSlotId,
  highlightSlotId,
  handleSlot,
  openExit,
  closeEntry,
  closeExit,
} = useSpotActions()

const activeZone = ref<'car' | 'moto'>('car')

const maxCars = computed(() => parking.settings?.max_cars ?? 0)
const maxMotos = computed(() => parking.settings?.max_motos ?? 0)

const carTickets = computed(() => tickets.activeTickets.filter((t) => t.vehicle_type === 'car'))
const motoTickets = computed(() => tickets.activeTickets.filter((t) => t.vehicle_type === 'moto'))

const totalCapacity = computed(() => maxCars.value + maxMotos.value)
const totalOccupied = computed(() => dashboard.stats.activeCars + dashboard.stats.activeMotos)
const occupancyPct = computed(() => {
  if (totalCapacity.value === 0) return 0
  return Math.round((totalOccupied.value / totalCapacity.value) * 100)
})

const busiestZone = computed(() => {
  const carPct = maxCars.value > 0 ? dashboard.stats.activeCars / maxCars.value : 0
  const motoPct = maxMotos.value > 0 ? dashboard.stats.activeMotos / maxMotos.value : 0
  if (carPct >= motoPct && maxCars.value > 0) return 'Carros'
  if (maxMotos.value > 0) return 'Motos'
  return '—'
})

const isFull = computed(
  () =>
    dashboard.stats.availableCars + dashboard.stats.availableMotos === 0 &&
    maxCars.value + maxMotos.value > 0
)

function onSlotSelect(slot: { id: string; ticket: Ticket | null }) {
  handleSlot(slot, activeZone.value)
}

function onSearchExit(ticket: Ticket) {
  const list = ticket.vehicle_type === 'car' ? carTickets.value : motoTickets.value
  activeZone.value = ticket.vehicle_type
  openExit(ticket, slotIdForTicket(ticket, list))
}
</script>

<template>
  <div class="flex flex-col gap-4">

    <!-- KPIs compactos -->
    <div class="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
      <KpiCard
        icon="car"
        title="Carros libres"
        :value="`${dashboard.stats.availableCars}/${maxCars}`"
        :subtitle="`${dashboard.stats.activeCars} ocupados`"
      />
      <KpiCard
        icon="bike"
        title="Motos libres"
        :value="`${dashboard.stats.availableMotos}/${maxMotos}`"
        :subtitle="`${dashboard.stats.activeMotos} ocupadas`"
      />
      <KpiCard
        icon="chart-bar"
        title="Ocupación"
        :value="`${occupancyPct}%`"
        :subtitle="`${totalOccupied}/${totalCapacity} cupos`"
        :highlight="occupancyPct >= 90"
      />
      <KpiCard
        icon="parking"
        title="Zona más usada"
        :value="busiestZone"
        trend="En vivo"
      />
    </div>

    <!-- ── Alerta lleno ── -->
    <Transition
      enter-active-class="transition-all duration-300 ease-out"
      enter-from-class="opacity-0 -translate-y-1"
      enter-to-class="opacity-100 translate-y-0"
      leave-active-class="transition-all duration-200 ease-in"
      leave-from-class="opacity-100"
      leave-to-class="opacity-0"
    >
      <div
        v-if="isFull"
        class="flex items-center justify-center gap-2 rounded-2xl bg-ink px-5 py-3 text-sm font-bold uppercase tracking-widest text-lime"
      >
        <span class="h-2 w-2 animate-pulse rounded-full bg-lime" />
        Sin cupos disponibles
      </div>
    </Transition>

    <!-- ── Mapa de aforo ── -->
    <section class="pp-card overflow-hidden p-0">

      <!-- Header -->
      <div class="flex flex-col gap-3 border-b border-black/[0.06] px-4 py-3.5 sm:flex-row sm:items-center sm:justify-between sm:px-5">
        <div class="min-w-0">
          <h2 class="text-base font-bold text-ink">Mapa de aforo</h2>
          <p class="text-xs text-muted">Toca libre → ingreso · ocupado → salida</p>
        </div>

        <div class="flex shrink-0 flex-wrap items-center gap-2">
          <PlateSearchBar
            :tickets="tickets.activeTickets"
            @found="onSearchExit"
          />
          <div class="flex gap-1.5">
            <ZoneTab
              value="car"
              :label="`Carros · ${dashboard.stats.activeCars}/${maxCars}`"
              :active="activeZone === 'car'"
              @click="activeZone = 'car'"
            />
            <ZoneTab
              value="moto"
              :label="`Motos · ${dashboard.stats.activeMotos}/${maxMotos}`"
              :active="activeZone === 'moto'"
              @click="activeZone = 'moto'"
            />
          </div>
        </div>
      </div>

      <!-- Grid -->
      <div class="overflow-x-auto p-4 sm:p-5">
        <ParkingSpotGrid
          v-if="activeZone === 'car'"
          zone="car"
          :max-slots="maxCars"
          :tickets="carTickets"
          :selected-id="highlightSlotId"
          @select="onSlotSelect"
        />
        <ParkingSpotGrid
          v-else
          zone="moto"
          :max-slots="maxMotos"
          :tickets="motoTickets"
          :selected-id="highlightSlotId"
          @select="onSlotSelect"
        />
      </div>
    </section>

    <SpotEntryModal
      :open="entryOpen"
      :slot-id="entrySlotId"
      :zone="entryZone"
      @close="closeEntry()"
    />
    <SpotExitModal
      :open="exitOpen"
      :ticket="exitTicket"
      :slot-id="exitSlotId"
      @close="closeExit()"
    />
  </div>
</template>