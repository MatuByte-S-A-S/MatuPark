<script setup lang="ts">
import { onMounted, onUnmounted, computed, ref } from 'vue'
import { useRoute } from 'vue-router'
import PublicLayout from '@/layouts/PublicLayout.vue'
import { useParkingStore } from '@/stores/parking'
import { useDashboardStore } from '@/stores/dashboard'
import { usePageSeo } from '@/composables/usePageSeo'
import { getOccupancyLevel } from '@/utils/occupancy'
import { APP_NAME } from '@/constants/branding'
import { formatCurrency, getHourlyRate } from '@/utils/billing'

const route = useRoute()
const parking = useParkingStore()
const dashboard = useDashboardStore()
const ready = ref(false)

const slug = route.params.slug as string
const appUrl = import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')

const totalFree = computed(
  () => dashboard.stats.availableCars + dashboard.stats.availableMotos
)

const totalCap = computed(
  () => (parking.settings?.max_cars ?? 0) + (parking.settings?.max_motos ?? 0)
)

const occupancyPct = computed(() => {
  if (totalCap.value <= 0) return 0
  const used = totalCap.value - totalFree.value
  return Math.min(100, Math.round((used / totalCap.value) * 100))
})

const carLevel = computed(() =>
  getOccupancyLevel(dashboard.stats.availableCars, parking.settings?.max_cars ?? 0)
)
const motoLevel = computed(() =>
  getOccupancyLevel(dashboard.stats.availableMotos, parking.settings?.max_motos ?? 0)
)

const carPct = computed(() => {
  const max = parking.settings?.max_cars ?? 0
  if (max <= 0) return 0
  return Math.round(((max - dashboard.stats.availableCars) / max) * 100)
})

const motoPct = computed(() => {
  const max = parking.settings?.max_motos ?? 0
  if (max <= 0) return 0
  return Math.round(((max - dashboard.stats.availableMotos) / max) * 100)
})

const seoMeta = computed(() => {
  if (!parking.lot) return null
  const name = parking.lot.name
  const addr = parking.lot.address || 'Consulta disponibilidad en tiempo real'
  const rates = parking.settings
    ? ` Tarifas: carro ${formatCurrency(getHourlyRate(parking.settings, 'car'))}/h · moto ${formatCurrency(getHourlyRate(parking.settings, 'moto'))}/h.`
    : ''
  return {
    title: `${name} — Aforo en vivo | ${APP_NAME}`,
    description: `${name}. ${addr}. ${totalFree.value} cupos libres ahora.${rates}`,
    url: `${appUrl}/parking/${slug}`,
    image: parking.lot.logo_url || undefined,
    type: 'website',
  }
})

usePageSeo(seoMeta)

let unsub: (() => void) | undefined

onMounted(async () => {
  const lot = await parking.fetchBySlug(slug)
  if (lot) {
    await dashboard.refresh(lot.id)
    unsub = dashboard.subscribe(lot.id)
  }
  ready.value = true
})
onUnmounted(() => unsub?.())
</script>

<template>
  <PublicLayout :live="ready && !!parking.lot">
    <div v-if="!ready || parking.loading" class="animate-pulse space-y-6">
      <div class="h-64 rounded-[2rem] bg-white sm:h-80" />
      <div class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <div v-for="i in 3" :key="i" class="h-40 rounded-[2rem] bg-white" />
      </div>
    </div>

    <div v-else-if="!parking.lot" class="pp-card py-24 text-center">
      <h2 class="text-2xl font-bold text-ink">Parqueadero no encontrado</h2>
      <p class="mt-2 text-muted">Verifica el enlace /parking/{{ slug }}</p>
    </div>

    <div v-else class="space-y-8">
      <!-- Hero -->
      <section class="relative overflow-hidden rounded-[2rem] bg-ink text-white shadow-2xl">
        <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-lime/20 blur-3xl" />
        <div class="absolute -bottom-16 -left-16 h-48 w-48 rounded-full bg-lime/10 blur-2xl" />

        <div class="relative grid gap-8 p-6 sm:p-10 lg:grid-cols-2 lg:items-center lg:p-12">
          <div>
            <div class="flex flex-wrap items-center gap-2">
              <span class="pp-badge-lime">{{ totalFree }} cupos libres</span>
              <span
                class="inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-bold"
                :class="parking.lot.is_open ? 'bg-white/10 text-lime' : 'bg-red-500/20 text-red-200'"
              >
                <span class="h-2 w-2 rounded-full" :class="parking.lot.is_open ? 'bg-lime animate-pulse' : 'bg-red-400'" />
                {{ parking.lot.is_open ? 'Abierto ahora' : 'Cerrado' }}
              </span>
            </div>

            <h1 class="mt-4 text-3xl font-bold tracking-tight sm:text-4xl lg:text-5xl">
              {{ parking.lot.name }}
            </h1>
            <p class="mt-4 max-w-lg text-base text-white/75 sm:text-lg">
              {{ parking.lot.address || 'Parqueadero seguro con aforo actualizado en tiempo real.' }}
            </p>

            <div class="mt-6 flex flex-wrap gap-3">
              <a
                v-if="parking.lot.phone"
                :href="`tel:${parking.lot.phone}`"
                class="inline-flex items-center gap-2 rounded-2xl bg-lime px-5 py-3 text-sm font-bold text-ink transition hover:bg-lime-dark"
              >
                Llamar {{ parking.lot.phone }}
              </a>
              <span class="inline-flex items-center rounded-2xl bg-white/10 px-5 py-3 text-sm font-semibold">
                Ocupación {{ occupancyPct }}%
              </span>
            </div>
          </div>

          <div v-if="parking.settings" class="grid grid-cols-2 gap-3 sm:gap-4">
            <div class="rounded-2xl bg-white/10 p-5 backdrop-blur sm:p-6">
              <p class="text-xs uppercase tracking-wide text-white/60">Carro / hora</p>
              <p class="mt-2 text-2xl font-bold text-lime sm:text-3xl">
                {{ formatCurrency(getHourlyRate(parking.settings, 'car')) }}
              </p>
            </div>
            <div class="rounded-2xl bg-white/10 p-5 backdrop-blur sm:p-6">
              <p class="text-xs uppercase tracking-wide text-white/60">Moto / hora</p>
              <p class="mt-2 text-2xl font-bold text-lime sm:text-3xl">
                {{ formatCurrency(getHourlyRate(parking.settings, 'moto')) }}
              </p>
            </div>
            <div class="col-span-2 rounded-2xl bg-lime p-5 text-ink sm:p-6">
              <p class="text-xs font-bold uppercase">Disponibilidad total</p>
              <p class="mt-1 text-3xl font-bold sm:text-4xl">{{ totalFree }} <span class="text-lg font-semibold">/ {{ totalCap }}</span></p>
              <div class="mt-3 h-2 overflow-hidden rounded-full bg-ink/10">
                <div class="h-full rounded-full bg-ink transition-all duration-700" :style="{ width: `${100 - occupancyPct}%` }" />
              </div>
            </div>
          </div>
        </div>
      </section>

      <!-- Stats -->
      <section class="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        <article class="pp-card p-6">
          <p class="text-xs font-bold uppercase tracking-wide text-muted">Ocupación global</p>
          <p class="mt-2 text-5xl font-bold text-ink">{{ occupancyPct }}%</p>
          <div class="mt-4 h-2.5 overflow-hidden rounded-full bg-surface">
            <div class="h-full rounded-full bg-ink transition-all duration-700" :style="{ width: `${occupancyPct}%` }" />
          </div>
        </article>

        <article class="pp-card p-6">
          <div class="flex items-center justify-between">
            <p class="font-bold text-ink">Carros</p>
            <span class="h-3 w-3 rounded-full" :class="carLevel.color" />
          </div>
          <p class="mt-3 text-4xl font-bold">{{ dashboard.stats.availableCars }}</p>
          <p class="text-sm text-muted">libres de {{ parking.settings?.max_cars ?? 0 }}</p>
          <div class="mt-4 h-2 overflow-hidden rounded-full bg-surface">
            <div class="h-full rounded-full bg-ink" :style="{ width: `${carPct}%` }" />
          </div>
          <p class="mt-2 text-xs font-semibold text-muted">{{ carLevel.label }}</p>
        </article>

        <article class="pp-card p-6 sm:col-span-2 lg:col-span-1">
          <div class="flex items-center justify-between">
            <p class="font-bold text-ink">Motos</p>
            <span class="h-3 w-3 rounded-full" :class="motoLevel.color" />
          </div>
          <p class="mt-3 text-4xl font-bold">{{ dashboard.stats.availableMotos }}</p>
          <p class="text-sm text-muted">libres de {{ parking.settings?.max_motos ?? 0 }}</p>
          <div class="mt-4 h-2 overflow-hidden rounded-full bg-surface">
            <div class="h-full rounded-full bg-lime" :style="{ width: `${motoPct}%` }" />
          </div>
          <p class="mt-2 text-xs font-semibold text-muted">{{ motoLevel.label }}</p>
        </article>
      </section>

      <div
        v-if="totalCap > 0 && totalFree === 0"
        class="rounded-[2rem] bg-ink px-6 py-8 text-center text-white"
      >
        <p class="text-xl font-bold sm:text-2xl">Sin cupos disponibles</p>
        <p class="mt-2 text-white/70">Los datos se actualizan automáticamente cada pocos segundos</p>
      </div>

      <section class="grid gap-4 md:grid-cols-2">
        <div class="pp-card p-6">
          <h2 class="text-sm font-bold uppercase tracking-wide text-muted">Horario</h2>
          <p class="mt-3 text-lg font-semibold text-ink">{{ parking.lot.schedule || 'Consultar en recepción' }}</p>
        </div>
        <div class="pp-card p-6">
          <h2 class="text-sm font-bold uppercase tracking-wide text-muted">Tu ticket digital</h2>
          <p class="mt-2 text-sm text-muted">Consulta el total a pagar escaneando el QR de tu ticket.</p>
          <code class="mt-4 block rounded-xl bg-surface px-4 py-3 text-sm font-mono">{{ appUrl }}/ticket/CODIGO</code>
        </div>
      </section>
    </div>
  </PublicLayout>
</template>
