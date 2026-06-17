<script setup lang="ts">
import { onMounted, ref, watch } from 'vue'
import { useParkingStore } from '@/stores/parking'
import { matudb } from '@/lib/matudb'
import { useAuthStore } from '@/stores/auth'
import { useNotify } from '@/composables/useNotify'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppChip from '@/components/ui/AppChip.vue'
import CurrencyInput from '@/components/ui/CurrencyInput.vue'
import PageLoader from '@/components/ui/PageLoader.vue'
import { CURRENCY_OPTIONS } from '@/utils/currency'
import type { BillingMode } from '@/types'

const parking = useParkingStore()
const auth = useAuthStore()
const notify = useNotify()

const ready = ref(false)
const tab = ref<'general' | 'capacity' | 'rates' | 'regional'>('general')
const saving = ref(false)

const form = ref({
  name: '',
  address: '',
  phone: '',
  nit: '',
  logo_url: '',
  slug: '',
  schedule: '',
  is_open: true,
  max_cars: 0,
  max_motos: 0,
  rate_car_hour: 5000,
  rate_moto_hour: 3000,
  rate_car_day: 0,
  rate_moto_day: 0,
  tolerance_minutes: 10,
  billing_mode: 'full_hour' as BillingMode,
  currency_code: 'COP',
  currency_locale: 'es-CO',
})

function applyToForm() {
  if (parking.lot) {
    form.value.name = parking.lot.name
    form.value.address = parking.lot.address ?? ''
    form.value.phone = parking.lot.phone ?? ''
    form.value.nit = parking.lot.nit ?? ''
    form.value.logo_url = parking.lot.logo_url || ''
    form.value.slug = parking.lot.slug
    form.value.schedule = parking.lot.schedule ?? ''
    form.value.is_open = parking.lot.is_open
  }
  if (parking.settings) {
    const s = parking.settings
    form.value.max_cars = Number(s.max_cars)
    form.value.max_motos = Number(s.max_motos)
    form.value.rate_car_hour = Number(s.rate_car_hour)
    form.value.rate_moto_hour = Number(s.rate_moto_hour)
    form.value.rate_car_day = s.rate_car_day != null ? Number(s.rate_car_day) : 0
    form.value.rate_moto_day = s.rate_moto_day != null ? Number(s.rate_moto_day) : 0
    form.value.tolerance_minutes = Number(s.tolerance_minutes)
    form.value.billing_mode = s.billing_mode
    form.value.currency_code = s.currency_code || 'COP'
    form.value.currency_locale = s.currency_locale || 'es-CO'
  }
}

onMounted(async () => {
  await parking.fetchCurrent()
  applyToForm()
  ready.value = true
})

async function uploadLogo(file: File) {
  const path = `logos/${auth.parkingLotId}-${Date.now()}-${file.name}`
  const { error } = await matudb.storage.upload(path, file)
  if (!error) {
    const { data } = matudb.storage.getPublicUrl(path)
    form.value.logo_url = data.publicUrl
    notify.success('Logo actualizado')
  } else {
    notify.error('Error al subir logo', error.message)
  }
}

async function save() {
  saving.value = true

  const lotRes = await parking.saveLot({
    name: form.value.name.trim(),
    address: form.value.address.trim(),
    phone: form.value.phone.trim(),
    nit: form.value.nit.trim(),
    logo_url: form.value.logo_url || null,
    slug: form.value.slug.trim(),
    schedule: form.value.schedule.trim(),
    is_open: form.value.is_open,
  })

  if (lotRes.error) {
    saving.value = false
    notify.error('No se guardó el parqueadero', lotRes.error.message)
    return
  }

  const settingsRes = await parking.saveSettings({
    max_cars: Number(form.value.max_cars),
    max_motos: Number(form.value.max_motos),
    rate_car_hour: Number(form.value.rate_car_hour),
    rate_moto_hour: Number(form.value.rate_moto_hour),
    rate_car_day: form.value.rate_car_day > 0 ? Number(form.value.rate_car_day) : null,
    rate_moto_day: form.value.rate_moto_day > 0 ? Number(form.value.rate_moto_day) : null,
    tolerance_minutes: Number(form.value.tolerance_minutes),
    billing_mode: form.value.billing_mode,
    currency_code: form.value.currency_code,
    currency_locale: form.value.currency_locale,
  })

  saving.value = false

  if (settingsRes.error) {
    notify.error('Configuración no guardada', settingsRes.error.message)
    applyToForm()
    return
  }

  applyToForm()
  notify.success('Actualizado con éxito')
}

watch(
  () => form.value.currency_code,
  (code) => {
    form.value.currency_locale = CURRENCY_OPTIONS.find((c) => c.code === code)?.locale || 'es-CO'
  }
)
</script>

<template>
  <PageLoader v-if="!ready" label="Cargando configuración…" />

  <div v-else class="mx-auto max-w-4xl">
    <div class="pp-card overflow-hidden">
      <div class="flex flex-wrap gap-2 border-b border-surface bg-surface/30 p-4">
        <AppChip :active="tab === 'general'" @click="tab = 'general'">General</AppChip>
        <AppChip :active="tab === 'capacity'" @click="tab = 'capacity'">Capacidad</AppChip>
        <AppChip :active="tab === 'rates'" @click="tab = 'rates'">Tarifas</AppChip>
        <AppChip :active="tab === 'regional'" @click="tab = 'regional'">Moneda</AppChip>
      </div>

      <form class="p-6" @submit.prevent="save">
        <div v-show="tab === 'general'" class="grid gap-4 md:grid-cols-2">
          <AppInput v-model="form.name" label="Nombre" required class="md:col-span-2" />
          <AppInput v-model="form.address" label="Dirección" />
          <AppInput v-model="form.phone" label="Teléfono" />
          <AppInput v-model="form.nit" label="NIT" />
          <AppInput v-model="form.slug" label="Slug landing" hint="/parking/{slug}" class="md:col-span-2" />
          <AppInput v-model="form.schedule" label="Horario" class="md:col-span-2" />
          <label class="flex items-center gap-2 text-sm font-semibold md:col-span-2">
            <input v-model="form.is_open" type="checkbox" class="h-4 w-4 accent-ink" />
            Abierto al público
          </label>
          <div class="md:col-span-2">
            <label class="text-sm font-semibold text-ink">Logo</label>
            <input type="file" accept="image/*" class="mt-2 block text-sm" @change="uploadLogo(($event.target as HTMLInputElement).files![0])" />
            <img v-if="form.logo_url" :src="form.logo_url" alt="" class="mt-2 h-14 object-contain" />
          </div>
        </div>

        <div v-show="tab === 'capacity'" class="grid max-w-2xl gap-4 md:grid-cols-2">
          <AppInput v-model="form.max_cars" label="Cupos carros (capacidad total)" type="number" min="0" />
          <AppInput v-model="form.max_motos" label="Cupos motos (capacidad total)" type="number" min="0" />
          <p class="text-sm text-muted md:col-span-2">
            Los cupos libres se calculan restando los vehículos activos en el parqueadero.
          </p>
        </div>

        <div v-show="tab === 'rates'" class="grid gap-4 md:grid-cols-2">
          <CurrencyInput v-model="form.rate_car_hour" label="Tarifa / hora carro" />
          <CurrencyInput v-model="form.rate_moto_hour" label="Tarifa / hora moto" />
          <CurrencyInput v-model="form.rate_car_day" label="Tarifa / día carro (opcional)" />
          <CurrencyInput v-model="form.rate_moto_day" label="Tarifa / día moto (opcional)" />
          <AppInput v-model="form.tolerance_minutes" label="Tolerancia (minutos)" type="number" min="0" />
          <AppSelect v-model="form.billing_mode" label="Método de cobro">
            <option value="full_hour">Por hora completa</option>
            <option value="proportional">Proporcional</option>
          </AppSelect>
        </div>

        <div v-show="tab === 'regional'" class="grid max-w-xl gap-4">
          <AppSelect v-model="form.currency_code" label="Moneda del parqueadero">
            <option v-for="c in CURRENCY_OPTIONS" :key="c.code" :value="c.code">{{ c.label }}</option>
          </AppSelect>
          <p class="text-sm text-muted">
            Los montos se formatean en tiempo real en caja, tarifas y reportes según esta moneda.
            Ejemplo: al escribir <strong>5000</strong> verás el formato local automáticamente.
          </p>
        </div>

        <div class="mt-8 flex justify-end border-t border-surface pt-6">
          <AppButton type="submit" :loading="saving" show-arrow>Guardar cambios</AppButton>
        </div>
      </form>
    </div>
  </div>
</template>
