<script setup lang="ts">
import { ref, onMounted, computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useParkingStore } from '@/stores/parking'
import { type ReportPeriod } from '@/utils/dateRange'
import { loadReportMetrics, type ReportMetrics } from '@/utils/reports'
import { exportPdf, exportExcel } from '@/utils/exportReports'
import { formatCurrency, formatDuration } from '@/utils/billing'
import { PAYMENT_METHODS, paymentMethodLabel } from '@/utils/paymentMethods'
import AppButton from '@/components/ui/AppButton.vue'
import AppChip from '@/components/ui/AppChip.vue'
import AppInput from '@/components/ui/AppInput.vue'
import KpiCard from '@/components/ui/KpiCard.vue'
import LineChart from '@/components/charts/LineChart.vue'
import DoughnutChart from '@/components/charts/DoughnutChart.vue'
import DualBarChart from '@/components/charts/DualBarChart.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import PageLoader from '@/components/ui/PageLoader.vue'

const auth = useAuthStore()
const parking = useParkingStore()

const period = ref<ReportPeriod>('today')
const customStart = ref('')
const customEnd = ref('')
const loading = ref(false)
const ready = ref(false)

const report = ref<ReportMetrics>({
  periodLabel: '',
  totalIncome: 0,
  totalPayments: 0,
  vehiclesEntered: 0,
  vehiclesExited: 0,
  carsEntered: 0,
  motosEntered: 0,
  carsExited: 0,
  motosExited: 0,
  carIncome: 0,
  motoIncome: 0,
  carSharePct: 0,
  motoSharePct: 0,
  carIncomePct: 0,
  motoIncomePct: 0,
  avgTicket: 0,
  avgDurationMinutes: 0,
  maxDurationMinutes: 0,
  maxDurationLabel: '—',
  dailyAverage: 0,
  dailyTrend: [],
})

const byMethod = ref<{ method: string; amount: number; count: number }[]>([])
const cashSummary = ref({ sessions: 0, expenses: 0, expected: 0 })

const vehicleChart = computed(() => ({
  labels: ['Carros', 'Motos'],
  values: [report.value.carsExited, report.value.motosExited],
}))

const incomeMixChart = computed(() => ({
  labels: ['Carros', 'Motos'],
  values: [report.value.carIncome, report.value.motoIncome],
}))

const methodChart = computed(() => ({
  labels: byMethod.value.map((m) => paymentMethodLabel(m.method)),
  values: byMethod.value.map((m) => m.amount),
}))

const topMethod = computed(() => {
  if (!byMethod.value.length) return '—'
  const top = [...byMethod.value].sort((a, b) => b.amount - a.amount)[0]
  return paymentMethodLabel(top.method)
})

const trafficChart = computed(() => ({
  labels: report.value.dailyTrend.map((d) => d.label),
  series: [
    { label: 'Entradas', data: report.value.dailyTrend.map((d) => d.entries), color: '#060606' },
    { label: 'Salidas', data: report.value.dailyTrend.map((d) => d.exits), color: '#d7ee46' },
  ],
}))

async function load() {
  if (!auth.parkingLotId) return
  loading.value = true
  const result = await loadReportMetrics(
    auth.parkingLotId,
    period.value,
    customStart.value,
    customEnd.value,
    parking.lot?.created_at
  )
  report.value = result.metrics
  byMethod.value = result.byMethod
  cashSummary.value = result.cashSummary
  loading.value = false
}

function setPeriod(p: ReportPeriod) {
  period.value = p
  void load()
}

onMounted(async () => {
  if (!parking.lot) await parking.fetchCurrent()
  await load()
  ready.value = true
})
</script>

<template>
  <PageLoader v-if="!ready" label="Cargando reportes…" />

  <div v-else class="mx-auto max-w-6xl space-y-5">
    <div class="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
      <div>
        <h2 class="pp-page-title">Reportes y métricas</h2>
        <p class="mt-1 text-sm text-muted">{{ report.periodLabel }}</p>
      </div>
      <div class="flex flex-wrap gap-2">
        <AppButton variant="secondary" size="sm" @click="exportPdf(report, parking.lot?.name || '')">PDF</AppButton>
        <AppButton variant="secondary" size="sm" @click="exportExcel(report, parking.lot?.name || '')">Excel</AppButton>
      </div>
    </div>

    <div class="flex gap-2 overflow-x-auto pb-1">
      <AppChip :active="period === 'today'" @click="setPeriod('today')">Hoy</AppChip>
      <AppChip :active="period === 'week'" @click="setPeriod('week')">Semana</AppChip>
      <AppChip :active="period === 'month'" @click="setPeriod('month')">Mes</AppChip>
      <AppChip :active="period === 'all'" @click="setPeriod('all')">Todo</AppChip>
      <AppChip :active="period === 'custom'" @click="period = 'custom'">Rango</AppChip>
    </div>

    <div v-if="period === 'custom'" class="pp-card grid gap-4 p-5 sm:grid-cols-3">
      <AppInput v-model="customStart" type="date" label="Desde" />
      <AppInput v-model="customEnd" type="date" label="Hasta" />
      <AppButton class="self-end" :loading="loading" @click="load">Aplicar</AppButton>
    </div>

    <!-- Ingresos y flujo -->
    <div class="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
      <KpiCard icon="banknote" title="Ingresos" :value="formatCurrency(report.totalIncome)" highlight />
      <KpiCard icon="ticket" title="Ticket promedio" :value="formatCurrency(report.avgTicket)" />
      <KpiCard icon="car" title="Entradas" :value="report.vehiclesEntered" :subtitle="`${report.carsEntered} carros · ${report.motosEntered} motos`" />
      <KpiCard icon="bike" title="Salidas" :value="report.vehiclesExited" :subtitle="`${report.carsExited} carros · ${report.motosExited} motos`" />
    </div>

    <!-- Tiempos y pagos -->
    <div class="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
      <KpiCard title="Estancia promedio" :value="formatDuration(report.avgDurationMinutes)" subtitle="por vehículo" />
      <KpiCard title="Estancia máxima" :value="report.maxDurationMinutes ? formatDuration(report.maxDurationMinutes) : '—'" :subtitle="report.maxDurationLabel" />
      <KpiCard title="Pagos registrados" :value="report.totalPayments" :subtitle="topMethod" />
      <KpiCard title="Promedio / día" :value="formatCurrency(report.dailyAverage)" trend="Ingresos" />
    </div>

    <!-- Gráficos principales -->
    <div class="grid gap-5 lg:grid-cols-2">
      <section class="pp-card p-5">
        <h3 class="pp-section-title">Entradas y salidas por día</h3>
        <DualBarChart
          v-if="trafficChart.labels.length"
          class="mt-4"
          :labels="trafficChart.labels"
          :series="trafficChart.series"
        />
        <p v-else class="py-12 text-center text-sm text-muted">Sin movimiento en el periodo</p>
      </section>

      <section class="pp-card p-5">
        <h3 class="pp-section-title">Ingresos por día</h3>
        <LineChart
          v-if="report.dailyTrend.length"
          class="mt-4"
          :labels="report.dailyTrend.map((d) => d.label)"
          :data="report.dailyTrend.map((d) => d.income)"
          label="Ingresos"
        />
        <p v-else class="py-12 text-center text-sm text-muted">Sin ingresos en el periodo</p>
      </section>
    </div>

    <!-- Mix vehículos e ingresos -->
    <div class="grid gap-5 lg:grid-cols-3">
      <section class="pp-card p-5">
        <h3 class="pp-section-title">Salidas por tipo</h3>
        <DoughnutChart
          v-if="vehicleChart.values.some((v) => v > 0)"
          class="mt-4"
          :labels="vehicleChart.labels"
          :values="vehicleChart.values"
          :colors="['#060606', '#d7ee46']"
        />
        <ul class="mt-4 space-y-2 text-sm">
          <li class="flex justify-between rounded-xl bg-surface px-3 py-2">
            <span>Carros</span>
            <span class="font-bold">{{ report.carsExited }} · {{ report.carSharePct }}%</span>
          </li>
          <li class="flex justify-between rounded-xl bg-surface px-3 py-2">
            <span>Motos</span>
            <span class="font-bold">{{ report.motosExited }} · {{ report.motoSharePct }}%</span>
          </li>
        </ul>
      </section>

      <section class="pp-card p-5">
        <h3 class="pp-section-title">Ingresos por tipo</h3>
        <DoughnutChart
          v-if="incomeMixChart.values.some((v) => v > 0)"
          class="mt-4"
          :labels="incomeMixChart.labels"
          :values="incomeMixChart.values"
          :colors="['#060606', '#d7ee46']"
        />
        <ul class="mt-4 space-y-2 text-sm">
          <li class="flex justify-between rounded-xl bg-surface px-3 py-2">
            <span>Carros</span>
            <span class="font-bold">{{ formatCurrency(report.carIncome) }} · {{ report.carIncomePct }}%</span>
          </li>
          <li class="flex justify-between rounded-xl bg-surface px-3 py-2">
            <span>Motos</span>
            <span class="font-bold">{{ formatCurrency(report.motoIncome) }} · {{ report.motoIncomePct }}%</span>
          </li>
        </ul>
      </section>

      <section class="pp-card p-5">
        <h3 class="pp-section-title">Por método de pago</h3>
        <DoughnutChart
          v-if="methodChart.values.some((v) => v > 0)"
          class="mt-4"
          :labels="methodChart.labels"
          :values="methodChart.values"
          :colors="['#060606', '#d7ee46', '#8a8a8a', '#c5db3a', '#eff0ef', '#4a4a4a']"
        />
        <ul v-if="byMethod.length" class="mt-4 space-y-2">
          <li
            v-for="m in byMethod"
            :key="m.method"
            class="flex items-center justify-between rounded-xl bg-surface px-3 py-2 text-sm"
          >
            <span>{{ paymentMethodLabel(m.method) }} · {{ m.count }}</span>
            <span class="font-bold">{{ formatCurrency(m.amount) }}</span>
          </li>
        </ul>
        <p v-else class="py-8 text-center text-sm text-muted">Sin pagos</p>
      </section>
    </div>

    <!-- Tabla diaria -->
    <section class="pp-card overflow-hidden">
      <div class="border-b border-surface px-5 py-4">
        <h3 class="font-bold text-ink">Detalle por día</h3>
        <p class="text-xs text-muted">Entradas, salidas e ingresos</p>
      </div>
      <div class="overflow-x-auto">
        <table class="w-full min-w-[520px] text-left text-sm">
          <thead class="bg-surface/80 text-xs font-semibold uppercase text-muted">
            <tr>
              <th class="px-4 py-3">Día</th>
              <th class="px-4 py-3">Entradas</th>
              <th class="px-4 py-3">Salidas</th>
              <th class="px-4 py-3">Carros</th>
              <th class="px-4 py-3">Motos</th>
              <th class="px-4 py-3 text-right">Ingresos</th>
            </tr>
          </thead>
          <tbody>
            <tr
              v-for="row in report.dailyTrend"
              :key="row.date"
              class="border-t border-surface"
            >
              <td class="px-4 py-3 font-medium capitalize">{{ row.label }}</td>
              <td class="px-4 py-3">{{ row.entries }}</td>
              <td class="px-4 py-3">{{ row.exits }}</td>
              <td class="px-4 py-3">{{ row.carsIn }}</td>
              <td class="px-4 py-3">{{ row.motosIn }}</td>
              <td class="px-4 py-3 text-right font-semibold">{{ formatCurrency(row.income) }}</td>
            </tr>
            <tr v-if="!report.dailyTrend.length">
              <td colspan="6" class="px-4 py-12 text-center text-muted">Sin datos</td>
            </tr>
          </tbody>
        </table>
      </div>
    </section>

    <!-- Caja + métodos grid -->
    <div class="grid gap-2.5 sm:grid-cols-2 lg:grid-cols-4">
      <KpiCard title="Turnos de caja" :value="cashSummary.sessions" />
      <KpiCard title="Gastos caja" :value="formatCurrency(cashSummary.expenses)" />
      <KpiCard title="Entradas carros" :value="report.carsEntered" :subtitle="`${report.carSharePct}% de salidas`" />
      <KpiCard title="Entradas motos" :value="report.motosEntered" :subtitle="`${report.motoSharePct}% de salidas`" />
    </div>

    <section class="pp-card overflow-hidden">
      <div class="border-b border-surface bg-gradient-to-r from-ink to-ink/90 px-5 py-4 text-white">
        <h3 class="font-bold">Desglose por método de pago</h3>
      </div>
      <div class="grid gap-px bg-surface sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="pm in PAYMENT_METHODS" :key="pm.value" class="bg-white p-4">
          <div class="flex h-9 w-9 items-center justify-center rounded-xl bg-lime/20 text-ink">
            <AppIcon :name="pm.icon" :size="18" />
          </div>
          <p class="mt-2 text-sm font-bold text-ink">{{ pm.label }}</p>
          <p class="mt-1 text-base font-semibold">
            {{ formatCurrency(byMethod.find((m) => m.method === pm.value)?.amount ?? 0) }}
          </p>
          <p class="text-[10px] text-muted">
            {{ byMethod.find((m) => m.method === pm.value)?.count ?? 0 }} pagos
          </p>
        </div>
      </div>
    </section>
  </div>
</template>
