import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { matudb } from '@/lib/matudb'
import { confirmPayment, createCheckout, fetchSubscription } from '@/lib/billingApi'
import { planLabel } from '@/constants/plans'
import type { Subscription } from '@/types'
import type { SubscriptionPlanId } from '@/constants/plans'

export const useSubscriptionStore = defineStore('subscription', () => {
  const current = ref<Subscription | null>(null)
  const history = ref<Subscription[]>([])
  const loading = ref(false)
  const checkoutLoading = ref(false)
  const error = ref<string | null>(null)

  const isActive = computed(() => {
    if (!current.value) return true
    if (current.value.status !== 'active') return false
    if (!current.value.expires_at) return true
    return new Date(current.value.expires_at) > new Date()
  })

  const daysLeft = computed(() => {
    if (!current.value?.expires_at) return null
    const diff = new Date(current.value.expires_at).getTime() - Date.now()
    return Math.max(0, Math.ceil(diff / (1000 * 60 * 60 * 24)))
  })

  const isTrial = computed(() => current.value?.plan_id === 'trial')

  const planName = computed(() =>
    current.value ? planLabel(current.value.plan_id) : 'Sin plan'
  )

  const statusLabel = computed(() => {
    if (!current.value) return 'Activo'
    if (current.value.status === 'pending') return 'Pago pendiente'
    if (!isActive.value) return 'Vencido'
    if (isTrial.value) return `Prueba · ${daysLeft.value ?? 0} días`
    return `Activo · ${planName.value}`
  })

  const expiresLabel = computed(() => {
    if (!current.value?.expires_at) return null
    return new Date(current.value.expires_at).toLocaleDateString('es-CO', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    })
  })

  async function load(parkingLotId: string) {
    loading.value = true
    error.value = null
    try {
      const { subscription, history: rows } = await fetchSubscription(parkingLotId)
      current.value = subscription
      history.value = rows
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'No se pudo cargar la suscripción'
      await loadFromDb(parkingLotId)
    } finally {
      loading.value = false
    }
  }

  async function loadFromDb(parkingLotId: string) {
    const { data } = await matudb
      .from('subscriptions')
      .select('*')
      .eq('parking_lot_id', parkingLotId)
      .order('created_at', { ascending: false })
      .limit(5)

    const rows = (data as Subscription[]) ?? []
    history.value = rows
    current.value =
      rows.find((r) => r.status === 'active') ??
      rows.find((r) => r.status === 'pending') ??
      null
  }

  async function startCheckout(parkingLotId: string, planId: SubscriptionPlanId, lotName?: string) {
    checkoutLoading.value = true
    error.value = null
    try {
      const { checkoutUrl } = await createCheckout(parkingLotId, planId, lotName)
      window.location.href = checkoutUrl
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'No se pudo iniciar el pago'
      checkoutLoading.value = false
      throw e
    }
  }

  async function confirm(reference: string, parkingLotId: string) {
    loading.value = true
    error.value = null
    try {
      const result = await confirmPayment(reference)
      if (result.subscription) {
        current.value = result.subscription
      }
      await load(parkingLotId)
      return result
    } catch (e) {
      error.value = e instanceof Error ? e.message : 'No se pudo confirmar el pago'
      throw e
    } finally {
      loading.value = false
    }
  }

  async function createTrial(parkingLotId: string) {
    const startsAt = new Date()
    const expiresAt = new Date()
    expiresAt.setDate(expiresAt.getDate() + 7)

    const { error: err } = await matudb.from('subscriptions').insert({
      parking_lot_id: parkingLotId,
      plan_id: 'trial',
      status: 'active',
      amount: 0,
      currency: 'COP',
      starts_at: startsAt.toISOString(),
      expires_at: expiresAt.toISOString(),
    })

    if (err && !err.message?.includes('duplicate')) {
      console.warn('Trial subscription:', err.message)
    }
  }

  return {
    current,
    history,
    loading,
    checkoutLoading,
    error,
    isActive,
    daysLeft,
    isTrial,
    planName,
    statusLabel,
    expiresLabel,
    load,
    loadFromDb,
    startCheckout,
    confirm,
    createTrial,
  }
})
