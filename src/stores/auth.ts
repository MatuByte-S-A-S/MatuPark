import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { matudb } from '@/lib/matudb'
import { fetchRow, rowFromWrite } from '@/lib/matudbHelpers'
import type { UserProfile, UserRole } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  const profile = ref<UserProfile | null>(null)
  const loading = ref(false)
  const ready = ref(false)
  const error = ref<string | null>(null)

  let initPromise: Promise<void> | null = null

  const isAuthenticated = computed(() => !!profile.value)
  const isAdmin = computed(() => profile.value?.role === 'admin')
  const isOperator = computed(() => profile.value?.role === 'operator')
  const parkingLotId = computed(() => profile.value?.parking_lot_id ?? null)

  async function loadProfile(userId: string) {
    const { data, error: err } = await matudb
      .from('users')
      .select('*')
      .eq('id', userId)
      .single()

    if (err || !data) {
      profile.value = null
      return
    }
    profile.value = data as UserProfile
  }

  async function init() {
    if (initPromise) return initPromise

    initPromise = (async () => {
      const { data: { session } } = await matudb.auth.getSession()
      if (session?.user?.id) {
        await loadProfile(session.user.id)
      }

      matudb.auth.onAuthStateChange(async (event, session) => {
        if (event === 'SIGNED_IN' && session?.user?.id) {
          await loadProfile(session.user.id)
        }
        if (event === 'SIGNED_OUT') {
          profile.value = null
        }
      })

      ready.value = true
    })()

    return initPromise
  }

  async function login(email: string, password: string) {
    loading.value = true
    error.value = null
    const { data, error: err } = await matudb.auth.signInWithPassword({ email, password })
    loading.value = false
    if (err) {
      error.value = err.message || 'Error al iniciar sesión'
      return false
    }
    if (data.user?.id) {
      await loadProfile(data.user.id)
      if (!profile.value) {
        error.value = 'Tu cuenta existe pero no tiene perfil. Contacta al administrador.'
        return false
      }
    }
    return true
  }

  async function register(payload: {
    email: string
    password: string
    fullName: string
    parkingName: string
    address?: string
    phone?: string
  }) {
    loading.value = true
    error.value = null

    const email = payload.email.trim().toLowerCase()

    const fullName = payload.fullName.trim()

    const { data: signUpData, error: signUpErr } = await matudb.auth.signUp({
      email,
      password: payload.password,
      options: {
        data: { name: fullName },
      },
    })

    if (signUpErr || !signUpData.user?.id) {
      loading.value = false
      error.value = signUpErr?.message || 'No se pudo crear la cuenta'
      return false
    }

    const userId = signUpData.user.id

    const { uniqueParkingSlug } = await import('@/utils/slugify')
    const slug = await uniqueParkingSlug(payload.parkingName)

    const { data: insertLot, error: lotErr } = await matudb.from('parking_lots').insert({
      slug,
      name: payload.parkingName.trim(),
      address: payload.address?.trim() || '',
      phone: payload.phone?.trim() || '',
      nit: '',
      is_open: true,
      schedule: 'Lun - Dom: 24 horas',
    })

    let parkingLotId = rowFromWrite<{ id: string }>(insertLot)?.id ?? null

    if (!parkingLotId) {
      const { data: lot, error: fetchErr } = await fetchRow<{ id: string }>('parking_lots', 'slug', slug)
      if (!lot) {
        loading.value = false
        error.value = lotErr?.message || fetchErr?.message || 'No se pudo crear el parqueadero'
        return false
      }
      parkingLotId = lot.id
    }

    const { error: settingsErr } = await matudb.from('settings').insert({
      parking_lot_id: parkingLotId,
      max_cars: 0,
      max_motos: 0,
      rate_car_hour: 5000,
      rate_moto_hour: 3000,
      tolerance_minutes: 10,
      billing_mode: 'full_hour',
    })

    if (settingsErr) {
      loading.value = false
      error.value = settingsErr.message || 'No se pudo crear la configuración'
      return false
    }

    const { error: profileErr } = await matudb.from('users').insert({
      id: userId,
      email,
      full_name: fullName,
      role: 'admin',
      parking_lot_id: parkingLotId,
    })

    if (profileErr) {
      loading.value = false
      error.value = profileErr.message || 'No se pudo guardar el perfil'
      return false
    }

    if (!signUpData.session) {
      const { error: signInErr } = await matudb.auth.signInWithPassword({ email, password: payload.password })
      if (signInErr) {
        loading.value = false
        error.value =
          'Cuenta creada. Revisa tu correo para confirmar y luego inicia sesión.'
        return false
      }
    }

    await loadProfile(userId)
    loading.value = false

    if (!profile.value) {
      error.value = 'Cuenta creada pero no se pudo cargar el perfil.'
      return false
    }

    return true
  }

  async function logout() {
  await matudb.auth.signOut()
  profile.value = null
  const { removeAllRealtimeChannels } = await import('@/lib/realtime')
  removeAllRealtimeChannels()
}

  function canAccess(roles: UserRole[]): boolean {
    if (!profile.value) return false
    return roles.includes(profile.value.role)
  }

  return {
    profile,
    loading,
    ready,
    error,
    isAuthenticated,
    isAdmin,
    isOperator,
    parkingLotId,
    login,
    register,
    logout,
    init,
    loadProfile,
    canAccess,
  }
})
