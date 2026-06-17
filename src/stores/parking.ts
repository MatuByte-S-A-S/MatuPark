import { defineStore } from 'pinia'
import { ref } from 'vue'
import { matudb } from '@/lib/matudb'
import { updateRow, rowFromWrite } from '@/lib/matudbHelpers'
import type { ParkingLot, Settings } from '@/types'
import { useAuthStore } from './auth'

function toNum(v: unknown, fallback = 0): number {
  const n = Number(v)
  return Number.isFinite(n) ? n : fallback
}

export const useParkingStore = defineStore('parking', () => {
  const lot = ref<ParkingLot | null>(null)
  const settings = ref<Settings | null>(null)
  const loading = ref(false)

  async function fetchByLotId(parkingLotId: string) {
    loading.value = true
    const [lotRes, settingsRes] = await Promise.all([
      matudb.from('parking_lots').select('*').eq('id', parkingLotId).single(),
      matudb.from('settings').select('*').eq('parking_lot_id', parkingLotId).single(),
    ])
    lot.value = (lotRes.data as ParkingLot) ?? null
    settings.value = (settingsRes.data as Settings) ?? null
    loading.value = false
    return { lot: lot.value, settings: settings.value }
  }

  async function fetchCurrent() {
    const auth = useAuthStore()
    if (!auth.parkingLotId) return
    return fetchByLotId(auth.parkingLotId)
  }

  async function fetchBySlug(slug: string) {
    loading.value = true
    const { data: lotData } = await matudb
      .from('parking_lots')
      .select('*')
      .eq('slug', slug)
      .single()

    if (!lotData) {
      lot.value = null
      settings.value = null
      loading.value = false
      return null
    }

    lot.value = lotData as ParkingLot
    const { data: settingsData } = await matudb
      .from('settings')
      .select('*')
      .eq('parking_lot_id', lot.value.id)
      .single()
    settings.value = (settingsData as Settings) ?? null
    loading.value = false
    return lot.value
  }

  async function saveLot(payload: Partial<ParkingLot> & { id?: string }) {
    const auth = useAuthStore()
    if (!auth.parkingLotId) return { error: { message: 'Sin parqueadero asignado' } }

    const { id: _id, ...updates } = payload
    const { error } = await updateRow<ParkingLot>(
      'parking_lots',
      { id: auth.parkingLotId },
      updates as Record<string, unknown>
    )

    if (error?.code === '409') {
      return { error: { message: 'El slug ya está en uso. Elige otro.' } }
    }

    await fetchByLotId(auth.parkingLotId)
    if (error) return { data: null, error }

    return { data: lot.value, error: null }
  }

  async function saveSettings(payload: {
    max_cars: number
    max_motos: number
    rate_car_hour: number
    rate_moto_hour: number
    rate_car_day: number | null
    rate_moto_day: number | null
    tolerance_minutes: number
    billing_mode: string
    currency_code?: string
    currency_locale?: string
  }) {
    const auth = useAuthStore()
    const lotId = auth.parkingLotId
    if (!lotId) return { error: { message: 'Sin parqueadero' } }

    if (!settings.value?.id) {
      const { data: inserted, error: insErr } = await matudb.from('settings').insert({
        parking_lot_id: lotId,
        ...payload,
        updated_at: new Date().toISOString(),
      })
      if (insErr) return { error: insErr }
      const row = rowFromWrite<Settings>(inserted)
      if (row) settings.value = row
      await fetchByLotId(lotId)
      return { data: settings.value, error: null }
    }

    const updates: Record<string, unknown> = {
      max_cars: toNum(payload.max_cars),
      max_motos: toNum(payload.max_motos),
      rate_car_hour: toNum(payload.rate_car_hour),
      rate_moto_hour: toNum(payload.rate_moto_hour),
      rate_car_day: payload.rate_car_day,
      rate_moto_day: payload.rate_moto_day,
      tolerance_minutes: toNum(payload.tolerance_minutes),
      billing_mode: payload.billing_mode,
      currency_code: payload.currency_code ?? 'COP',
      currency_locale: payload.currency_locale ?? 'es-CO',
      updated_at: new Date().toISOString(),
    }

    let { error } = await updateRow<Settings>('settings', { id: settings.value.id }, updates)

    if (error) {
      const retry = await updateRow<Settings>('settings', { parking_lot_id: lotId }, updates)
      error = retry.error
    }

    await fetchByLotId(lotId)

    if (error) {
      return { data: null, error }
    }

    const s = settings.value
    if (!s) {
      return { data: null, error: { message: 'No se pudo leer la configuración guardada' } }
    }

    const ok =
      toNum(s.max_cars) === updates.max_cars &&
      toNum(s.max_motos) === updates.max_motos &&
      toNum(s.rate_car_hour) === updates.rate_car_hour &&
      toNum(s.rate_moto_hour) === updates.rate_moto_hour

    if (!ok) {
      return {
        data: s,
        error: {
          message:
            'MatuDB no aplicó los cambios. Verifica permisos UPDATE en la tabla settings.',
        },
      }
    }

    return { data: s, error: null }
  }

  return {
    lot,
    settings,
    loading,
    fetchCurrent,
    fetchByLotId,
    fetchBySlug,
    saveLot,
    saveSettings,
  }
})
