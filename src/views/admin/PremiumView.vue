<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useParkingStore } from '@/stores/parking'
import { useSubscriptionStore } from '@/stores/subscription'
import { SUBSCRIPTION_PLANS, MONTHLY_PRICE } from '@/constants/plans'
import { formatCurrencyValue } from '@/utils/currency'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import type { SubscriptionPlanId } from '@/constants/plans'

const auth = useAuthStore()
const parking = useParkingStore()
const subscription = useSubscriptionStore()

const selectedPlan = ref<SubscriptionPlanId>('plan-semestral')

const premiumFeatures = [
  { icon: 'chart-bar' as const, title: 'Reportes avanzados', desc: 'Métricas completas y exportación' },
  { icon: 'users' as const, title: 'Usuarios ilimitados', desc: 'Operadores y administradores' },
  { icon: 'parking' as const, title: 'Aforo en tiempo real', desc: 'Panel visual de cupos' },
  { icon: 'wallet' as const, title: 'Caja integrada', desc: 'Libro de movimientos y turnos' },
]

onMounted(() => {
  if (auth.parkingLotId) void subscription.load(auth.parkingLotId)
})

async function pay(planId: SubscriptionPlanId) {
  if (!auth.parkingLotId) return
  selectedPlan.value = planId
  await subscription.startCheckout(auth.parkingLotId, planId, parking.lot?.name)
}

function monthlyEquivalent(amount: number, months: number) {
  return formatCurrencyValue(Math.round(amount / months))
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-6">
    <!-- Estado actual -->
    <div
      class="pp-card flex flex-wrap items-center justify-between gap-4 p-5"
      :class="subscription.isActive ? 'ring-1 ring-lime/40' : 'ring-1 ring-red-200'"
    >
      <div>
        <p class="text-xs font-semibold uppercase tracking-wide text-muted">Tu plan</p>
        <h2 class="text-xl font-bold text-ink">{{ subscription.statusLabel }}</h2>
        <p v-if="subscription.expiresLabel" class="mt-1 text-sm text-muted">
          {{ subscription.isActive ? 'Vence' : 'Venció' }} el {{ subscription.expiresLabel }}
        </p>
        <p v-if="subscription.isTrial && subscription.daysLeft !== null" class="mt-1 text-sm text-amber-700">
          Te quedan {{ subscription.daysLeft }} días de prueba gratuita
        </p>
      </div>
      <div v-if="!subscription.isActive" class="rounded-2xl bg-red-50 px-4 py-2 text-sm font-semibold text-red-700">
        Renueva para seguir operando
      </div>
      <div v-else-if="subscription.daysLeft !== null && subscription.daysLeft <= 7" class="rounded-2xl bg-amber-50 px-4 py-2 text-sm font-semibold text-amber-800">
        Renueva pronto — {{ subscription.daysLeft }} días restantes
      </div>
    </div>

    <div>
      <h2 class="pp-page-title">Elige tu plan</h2>
      <p class="text-sm text-muted">
        MatuPark cuesta {{ formatCurrencyValue(MONTHLY_PRICE) }}/mes. Ahorra con planes semestral o anual.
        Pagos seguros vía Bold · PayMatuByte.
      </p>
    </div>

    <p v-if="subscription.error" class="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
      {{ subscription.error }}
    </p>

    <!-- Planes -->
    <div class="grid gap-4 md:grid-cols-3">
      <div
        v-for="plan in SUBSCRIPTION_PLANS"
        :key="plan.id"
        class="pp-card relative flex flex-col p-6 transition"
        :class="plan.featured ? 'ring-2 ring-lime shadow-lg' : ''"
      >
        <span
          v-if="plan.badge"
          class="absolute -top-3 right-4 rounded-full bg-lime px-3 py-1 text-xs font-bold text-ink"
        >
          {{ plan.badge }}
        </span>

        <h3 class="text-lg font-bold text-ink">{{ plan.name }}</h3>
        <p class="mt-2 min-h-[40px] text-sm text-muted">{{ plan.description }}</p>

        <p class="mt-4 text-3xl font-bold text-ink">
          {{ formatCurrencyValue(plan.amount) }}
        </p>
        <p class="text-xs text-muted">
          {{ plan.months === 1 ? 'por mes' : `${monthlyEquivalent(plan.amount, plan.months)}/mes · ${plan.months} meses` }}
        </p>
        <p v-if="plan.savings" class="mt-2 text-xs font-medium text-green-700">{{ plan.savings }}</p>

        <AppButton
          class="mt-6 w-full"
          :variant="plan.featured ? 'primary' : 'secondary'"
          :loading="subscription.checkoutLoading && selectedPlan === plan.id"
          show-arrow
          @click="pay(plan.id)"
        >
          Pagar con Bold
        </AppButton>
      </div>
    </div>

    <!-- Incluye -->
    <div class="pp-card p-6">
      <h3 class="font-bold text-ink">Todo plan incluye</h3>
      <div class="mt-4 grid gap-4 sm:grid-cols-2">
        <div v-for="f in premiumFeatures" :key="f.title" class="flex gap-3">
          <div class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime/20 text-ink">
            <AppIcon :name="f.icon" :size="18" />
          </div>
          <div>
            <p class="font-semibold text-ink">{{ f.title }}</p>
            <p class="text-sm text-muted">{{ f.desc }}</p>
          </div>
        </div>
      </div>
    </div>

    <!-- Próximamente premium -->
    <div class="grid gap-4 md:grid-cols-3">
      <div class="pp-card border-2 border-dashed border-black/10 p-5 opacity-70">
        <AppIcon name="camera" :size="22" />
        <h4 class="mt-2 font-bold text-ink">Reconocimiento de placas</h4>
        <span class="pp-badge-lime mt-3 inline-block">Próximamente</span>
      </div>
      <div class="pp-card border-2 border-dashed border-black/10 p-5 opacity-70">
        <AppIcon name="building" :size="22" />
        <h4 class="mt-2 font-bold text-ink">Multi-sucursal</h4>
        <span class="pp-badge-lime mt-3 inline-block">Próximamente</span>
      </div>
      <div class="pp-card border-2 border-dashed border-black/10 p-5 opacity-70">
        <AppIcon name="parking" :size="22" />
        <h4 class="mt-2 font-bold text-ink">Multi-parqueadero</h4>
        <span class="pp-badge-lime mt-3 inline-block">Próximamente</span>
      </div>
    </div>
  </div>
</template>
