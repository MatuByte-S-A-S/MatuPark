import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { matudb } from '@/lib/matudb'
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
    logout,
    init,
    loadProfile,
    canAccess,
  }
})
