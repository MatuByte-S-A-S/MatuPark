<script setup lang="ts">
import { computed, ref } from 'vue'
import { useDashboardStore } from '@/stores/dashboard'
import { useParkingStore } from '@/stores/parking'
import { useTicketsStore } from '@/stores/tickets'
import { useSpotActions } from '@/composables/useSpotActions'
import KpiCard from '@/components/ui/KpiCard.vue'
import ParkingSpotGrid from '@/components/parking/ParkingSpotGrid.vue'
import ParkingOverviewPanel from '@/components/parking/ParkingOverviewPanel.vue'
import LiveTicketsPanel from '@/components/parking/LiveTicketsPanel.vue'
import SpotEntryModal from '@/components/parking/SpotEntryModal.vue'
import SpotExitModal from '@/components/parking/SpotExitModal.vue'
import PlateSearchBar from '@/components/parking/PlateSearchBar.vue'
import ZoneTab from '@/components/ui/ZoneTab.vue'
import { slotIdForTicket } from '@/utils/plateSearch'
import { formatCurrency } from '@/utils/billing'
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

const occupancyPct = computed(() => {
  const cap = maxCars.value + maxMotos.value
  if (cap === 0) return 0
  return Math.round(((dashboard.stats.activeCars + dashboard.stats.activeMotos) / cap) * 100)
})

const avgTicket = computed(() =>
  dashboard.stats.todayVehicles
    ? formatCurrency(Math.round(dashboard.stats.todayIncome / dashboard.stats.todayVehicles))
    : '$0'
)

function onSlotSelect(slot: { id: string; ticket: Ticket | null }) {
  handleSlot(slot, activeZone.value)
}

function onTicketSelect(ticket: Ticket) {
  const list = ticket.vehicle_type === 'car' ? carTickets.value : motoTickets.value
  const slotId = slotIdForTicket(ticket, list)
  activeZone.value = ticket.vehicle_type
  openExit(ticket, slotId)
}

function onSearchExit(ticket: Ticket) {
  onTicketSelect(ticket)
}
</script>

<template>
  <div class="dashboard-root">

    <!-- KPI Row -->
    <div class="kpi-grid">
      <KpiCard
        icon="banknote"
        title="Ingresos hoy"
        :value="formatCurrency(dashboard.stats.todayIncome)"
        trend="Hoy"
      />
      <KpiCard
        icon="car"
        title="Vehículos atendidos"
        :value="dashboard.stats.todayVehicles"
        subtitle="finalizados hoy"
      />
      <KpiCard
        icon="chart-bar"
        title="Ocupación"
        :value="`${occupancyPct}%`"
        :subtitle="`${dashboard.stats.availableCars + dashboard.stats.availableMotos} cupos libres`"
      />
      <KpiCard
        icon="ticket"
        title="Ticket promedio"
        :value="avgTicket"
        subtitle="promedio del día"
      />
    </div>

    <!-- Main content -->
    <div class="content-grid">

      <!-- Parking grid panel -->
      <section class="pp-card parking-panel">

        <!-- Panel header -->
        <div class="panel-header">
          <div class="panel-title-block">
            <h2 class="panel-title">{{ parking.lot?.name || 'Mi parqueadero' }}</h2>
            <p class="panel-subtitle">Toca un cupo para ingresar o sacar un vehículo</p>
          </div>

          <div class="panel-controls">
            <PlateSearchBar
              class="search-bar"
              :tickets="tickets.activeTickets"
              @found="onSearchExit"
            />

            <div class="zone-tabs">
              <ZoneTab
                value="car"
                :label="`Carros (${dashboard.stats.activeCars}/${maxCars})`"
                :active="activeZone === 'car'"
                @click="activeZone = 'car'"
              />
              <ZoneTab
                value="moto"
                :label="`Motos (${dashboard.stats.activeMotos}/${maxMotos})`"
                :active="activeZone === 'moto'"
                @click="activeZone = 'moto'"
              />
            </div>
          </div>
        </div>

        <!-- Spot grid -->
        <div class="spot-grid-wrapper">
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

      <!-- Aside panels -->
      <aside class="aside-stack">
        <ParkingOverviewPanel
          :car-occupied="dashboard.stats.activeCars"
          :car-max="maxCars"
          :moto-occupied="dashboard.stats.activeMotos"
          :moto-max="maxMotos"
        />

        <LiveTicketsPanel
          :tickets="tickets.activeTickets"
          :settings="parking.settings"
          :selected-id="exitTicket?.id"
          @select="onTicketSelect"
        />
      </aside>
    </div>

    <!-- Modals -->
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

<style scoped>
/* ── Root ── */
.dashboard-root {
  display: flex;
  flex-direction: column;
  gap: 1.25rem;
  padding: 0.75rem;
}

@media (min-width: 640px) {
  .dashboard-root {
    gap: 1.5rem;
    padding: 1rem;
  }
}

@media (min-width: 1024px) {
  .dashboard-root {
    gap: 1.75rem;
    padding: 1.25rem;
  }
}

/* ── KPI grid ── */
.kpi-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 0.75rem;
}

@media (min-width: 768px) {
  .kpi-grid {
    gap: 1rem;
  }
}

@media (min-width: 1280px) {
  .kpi-grid {
    grid-template-columns: repeat(4, 1fr);
  }
}

/* ── Content grid ── */
.content-grid {
  display: grid;
  grid-template-columns: 1fr;
  gap: 1rem;
}

@media (min-width: 1280px) {
  .content-grid {
    grid-template-columns: 1fr 22rem;
    gap: 1.25rem;
    align-items: start;
  }
}

@media (min-width: 1536px) {
  .content-grid {
    grid-template-columns: 1fr 24rem;
  }
}

/* ── Parking panel ── */
.parking-panel {
  padding: 1rem;
  min-width: 0; /* prevent overflow in grid */
}

@media (min-width: 640px) {
  .parking-panel {
    padding: 1.25rem 1.5rem;
  }
}

/* ── Panel header ── */
.panel-header {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

@media (min-width: 1024px) {
  .panel-header {
    flex-direction: row;
    align-items: flex-start;
    justify-content: space-between;
    gap: 1.5rem;
  }
}

.panel-title-block {
  flex-shrink: 0;
}

.panel-title {
  font-size: 1.125rem;
  font-weight: 700;
  color: var(--color-ink, #111827);
  line-height: 1.3;
}

@media (min-width: 640px) {
  .panel-title {
    font-size: 1.375rem;
  }
}

.panel-subtitle {
  margin-top: 0.25rem;
  font-size: 0.8125rem;
  color: var(--color-muted, #6b7280);
}

/* ── Panel controls ── */
.panel-controls {
  display: flex;
  flex-direction: column;
  gap: 0.75rem;
  width: 100%;
}

@media (min-width: 640px) {
  .panel-controls {
    flex-direction: row;
    align-items: center;
    flex-wrap: wrap;
    gap: 0.75rem;
  }
}

@media (min-width: 1024px) {
  .panel-controls {
    width: auto;
    flex-shrink: 0;
    justify-content: flex-end;
  }
}

.search-bar {
  width: 100%;
  min-width: 0;
}

@media (min-width: 640px) {
  .search-bar {
    width: auto;
    flex: 1 1 180px;
    max-width: 240px;
  }
}

/* ── Zone tabs ── */
.zone-tabs {
  display: flex;
  gap: 0.375rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
  scrollbar-width: none;
  flex-shrink: 0;
}

.zone-tabs::-webkit-scrollbar {
  display: none;
}

/* ── Spot grid wrapper ── */
.spot-grid-wrapper {
  margin-top: 1.25rem;
  overflow-x: auto;
  -webkit-overflow-scrolling: touch;
}

@media (min-width: 640px) {
  .spot-grid-wrapper {
    margin-top: 1.5rem;
    overflow-x: visible;
  }
}

/* ── Aside ── */
.aside-stack {
  display: flex;
  flex-direction: column;
  gap: 1rem;
}

/* On mobile, side panels are below the main grid — no sticky */
@media (min-width: 1280px) {
  .aside-stack {
    position: sticky;
    top: 1.25rem;
    max-height: calc(100vh - 2.5rem);
    overflow-y: auto;
    scrollbar-width: thin;
    padding-right: 2px; /* room for scrollbar */
  }
}
</style>