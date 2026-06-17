<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSubscriptionStore } from '@/stores/subscription'
import AppIcon from '@/components/ui/AppIcon.vue'

const auth = useAuthStore()
const subscription = useSubscriptionStore()

onMounted(() => {
  if (auth.parkingLotId && auth.isAdmin) {
    void subscription.load(auth.parkingLotId)
  }
})

const tone = computed(() => {
  if (!subscription.current) return 'neutral'
  if (!subscription.isActive) return 'danger'
  if (subscription.daysLeft !== null && subscription.daysLeft <= 7) return 'warn'
  return 'ok'
})

const ringClass = computed(() => {
  if (tone.value === 'danger') return 'bg-red-50 ring-red-200 hover:ring-red-300'
  if (tone.value === 'warn') return 'bg-amber-50 ring-amber-200 hover:ring-amber-300'
  if (tone.value === 'ok') return 'bg-lime/20 ring-lime/40 hover:ring-lime/60'
  return 'bg-white ring-black/[0.06] hover:ring-black/10'
})

const iconClass = computed(() => {
  if (tone.value === 'danger') return 'bg-red-600 text-white'
  if (tone.value === 'warn') return 'bg-amber-500 text-white'
  if (tone.value === 'ok') return 'bg-ink text-lime'
  return 'bg-[#eef0f2] text-muted'
})

const label = computed(() => {
  if (subscription.loading && !subscription.current) return 'Cargando plan…'
  if (!subscription.current) return 'Plan MatuPark'
  return subscription.planName
})

const sublabel = computed(() => {
  if (!subscription.current) return 'Ver suscripción'
  if (!subscription.isActive) {
    return subscription.expiresLabel ? `Venció el ${subscription.expiresLabel}` : 'Plan vencido'
  }
  if (subscription.isTrial && subscription.daysLeft !== null) {
    return `Prueba · ${subscription.daysLeft} días restantes`
  }
  if (subscription.expiresLabel && subscription.daysLeft !== null) {
    return `Vence el ${subscription.expiresLabel} · ${subscription.daysLeft} días`
  }
  if (subscription.expiresLabel) return `Vence el ${subscription.expiresLabel}`
  return subscription.statusLabel
})
</script>

<template>
  <RouterLink
    to="/premium"
    class="group flex items-center gap-2 rounded-full py-1.5 pl-2 pr-3 ring-1 transition"
    :class="ringClass"
    :title="`${label} — ${sublabel}`"
  >
    <span
      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition"
      :class="iconClass"
    >
      <AppIcon name="star" :size="18" />
    </span>
    <span class="hidden min-w-0 lg:block">
      <span class="block truncate text-xs font-bold leading-tight text-ink">{{ label }}</span>
      <span class="block truncate text-[10px] text-muted">{{ sublabel }}</span>
    </span>
  </RouterLink>
</template>
