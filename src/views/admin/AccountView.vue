<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useParkingStore } from '@/stores/parking'
import { useSubscriptionStore } from '@/stores/subscription'
import { SUBSCRIPTION_PLANS, MONTHLY_PRICE } from '@/constants/plans'
import { formatCurrencyValue } from '@/utils/currency'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import PageLoader from '@/components/ui/PageLoader.vue'
import { APP_NAME } from '@/constants/branding'
import type { IconName } from '@/types/icons'
import type { SubscriptionPlanId } from '@/constants/plans'

const includedFeatures: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'parking', title: 'Aforo en vivo', desc: 'Cupos y ocupación al instante' },
  { icon: 'wallet', title: 'Caja integrada', desc: 'Turnos, cobros y movimientos' },
  { icon: 'chart-bar', title: 'Reportes', desc: 'Métricas y exportación' },
  { icon: 'users', title: 'Multiusuario', desc: 'Operadores y administradores' },
]

const auth = useAuthStore()
const parking = useParkingStore()
const subscription = useSubscriptionStore()

const selectedPlan = ref<SubscriptionPlanId>('plan-semestral')

const initials = computed(() => {
  const name = auth.profile?.full_name ?? '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})

const roleLabel = computed(() => {
  if (auth.profile?.role === 'admin') return 'Administrador'
  if (auth.profile?.role === 'operator') return 'Operador'
  return auth.profile?.role ?? '—'
})

const planTone = computed(() => {
  if (!subscription.isActive) return 'danger'
  if (subscription.daysLeft !== null && subscription.daysLeft <= 7) return 'warn'
  return 'ok'
})

const renewalProgress = computed(() => {
  const sub = subscription.current
  if (!sub?.starts_at || !sub.expires_at) return null
  const start = new Date(sub.starts_at).getTime()
  const end = new Date(sub.expires_at).getTime()
  const now = Date.now()
  const total = end - start
  if (total <= 0) return null
  const elapsed = Math.min(Math.max(now - start, 0), total)
  return Math.round((elapsed / total) * 100)
})

const currentPlanId = computed(() => subscription.current?.plan_id ?? null)

function isCurrentPlan(planId: string) {
  return currentPlanId.value === planId && subscription.isActive
}

onMounted(() => {
  if (auth.parkingLotId && auth.isAdmin) {
    void subscription.load(auth.parkingLotId)
  }
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
  <div class="account-page mx-auto max-w-4xl space-y-6">
    <!-- Hero perfil -->
    <section class="pp-detail-panel relative overflow-hidden p-6 sm:p-8">
      <div
        class="pointer-events-none absolute -right-8 -top-8 h-40 w-40 rounded-full bg-lime/10 blur-2xl"
        aria-hidden="true"
      />
      <div class="relative flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
        <div class="flex items-center gap-4">
          <span
            class="flex h-16 w-16 shrink-0 items-center justify-center rounded-2xl bg-lime text-xl font-bold text-ink shadow-lg ring-4 ring-white/10 sm:h-[4.5rem] sm:w-[4.5rem] sm:text-2xl"
          >
            {{ initials }}
          </span>
          <div class="min-w-0">
            <p class="text-xs font-semibold uppercase tracking-widest text-white/50">Mi cuenta</p>
            <h1 class="truncate text-2xl font-bold text-white sm:text-3xl">
              {{ auth.profile?.full_name ?? 'Usuario' }}
            </h1>
            <p class="mt-1 truncate text-sm text-white/70">{{ auth.profile?.email }}</p>
            <span
              class="mt-3 inline-flex items-center rounded-full px-3 py-1 text-xs font-bold uppercase tracking-wide"
              :class="
                auth.isAdmin
                  ? 'bg-lime text-ink'
                  : 'bg-white/15 text-white ring-1 ring-white/20'
              "
            >
              {{ roleLabel }}
            </span>
          </div>
        </div>

        <div class="flex flex-wrap gap-2 sm:justify-end">
          <a
            v-if="parking.lot?.slug"
            :href="`/parking/${parking.lot.slug}`"
            target="_blank"
            class="inline-flex items-center gap-2 rounded-full bg-white/10 px-4 py-2 text-xs font-bold text-white ring-1 ring-white/15 transition hover:bg-white/15"
          >
            Ver landing
          </a>
          <RouterLink
            v-if="auth.isAdmin"
            to="/configuracion"
            class="inline-flex items-center gap-2 rounded-full bg-white px-4 py-2 text-xs font-bold text-ink transition hover:bg-lime"
          >
            Ajustes del parqueadero
          </RouterLink>
        </div>
      </div>
    </section>

    <!-- Datos de la cuenta -->
    <section class="grid gap-3 sm:grid-cols-3">
      <div class="pp-card flex items-start gap-3 p-4">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-lime/25 text-ink">
          <AppIcon name="parking" :size="18" />
        </span>
        <div class="min-w-0">
          <p class="text-[10px] font-bold uppercase tracking-wide text-muted">Parqueadero</p>
          <p class="truncate font-semibold text-ink">{{ parking.lot?.name ?? '—' }}</p>
        </div>
      </div>

      <div class="pp-card flex items-start gap-3 p-4">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef0f2] text-ink">
          <AppIcon name="users" :size="18" />
        </span>
        <div class="min-w-0">
          <p class="text-[10px] font-bold uppercase tracking-wide text-muted">Acceso</p>
          <p class="font-semibold text-ink">{{ roleLabel }}</p>
          <p class="truncate text-xs text-muted">{{ auth.profile?.email }}</p>
        </div>
      </div>

      <div class="pp-card flex items-start gap-3 p-4">
        <span class="flex h-10 w-10 shrink-0 items-center justify-center rounded-xl bg-[#eef0f2] text-ink">
          <AppIcon name="wallet" :size="18" />
        </span>
        <div class="min-w-0">
          <p class="text-[10px] font-bold uppercase tracking-wide text-muted">Sesión</p>
          <p class="font-semibold text-ink">Activa</p>
          <p class="text-xs text-muted">MatuPark · {{ APP_NAME }}</p>
        </div>
      </div>
    </section>

    <!-- Suscripción (admin) -->
    <template v-if="auth.isAdmin">
      <PageLoader v-if="subscription.loading && !subscription.current" label="Cargando tu plan…" />

      <template v-else>
        <section
          class="pp-card overflow-hidden p-0"
          :class="{
            'ring-2 ring-lime/40': planTone === 'ok',
            'ring-2 ring-amber-300/60': planTone === 'warn',
            'ring-2 ring-red-300/70': planTone === 'danger',
          }"
        >
          <div
            class="flex flex-col gap-4 border-b border-black/[0.04] px-5 py-5 sm:flex-row sm:items-center sm:justify-between sm:px-6"
            :class="{
              'bg-lime/10': planTone === 'ok',
              'bg-amber-50/80': planTone === 'warn',
              'bg-red-50/80': planTone === 'danger',
            }"
          >
            <div>
              <p class="text-xs font-bold uppercase tracking-wide text-muted">Suscripción MatuPark</p>
              <h2 class="mt-1 text-2xl font-bold text-ink">{{ subscription.planName }}</h2>
              <p class="mt-1 text-sm text-muted">{{ subscription.statusLabel }}</p>
            </div>

            <div class="flex flex-col items-start sm:items-end">
              <span
                class="rounded-full px-3 py-1 text-xs font-bold"
                :class="{
                  'bg-lime text-ink': planTone === 'ok',
                  'bg-amber-200 text-amber-950': planTone === 'warn',
                  'bg-red-200 text-red-900': planTone === 'danger',
                }"
              >
                {{
                  planTone === 'danger'
                    ? 'Vencido'
                    : planTone === 'warn'
                      ? 'Por vencer'
                      : 'Activo'
                }}
              </span>
              <p v-if="subscription.expiresLabel" class="mt-2 text-sm font-medium text-ink">
                {{ subscription.isActive ? 'Vence' : 'Venció' }} el {{ subscription.expiresLabel }}
              </p>
              <p
                v-if="subscription.daysLeft !== null && subscription.isActive"
                class="text-xs text-muted"
              >
                {{ subscription.daysLeft }} días restantes
              </p>
            </div>
          </div>

          <div v-if="renewalProgress !== null && subscription.isActive" class="px-5 py-4 sm:px-6">
            <div class="mb-2 flex justify-between text-xs font-semibold text-muted">
              <span>Periodo del plan</span>
              <span>{{ renewalProgress }}% transcurrido</span>
            </div>
            <div class="h-2 overflow-hidden rounded-full bg-[#eef0f2]">
              <div
                class="h-full rounded-full transition-all duration-500"
                :class="{
                  'bg-lime': planTone === 'ok',
                  'bg-amber-400': planTone === 'warn',
                  'bg-red-400': planTone === 'danger',
                }"
                :style="{ width: `${renewalProgress}%` }"
              />
            </div>
          </div>

          <div
            v-if="!subscription.isActive"
            class="flex flex-wrap items-center justify-between gap-3 px-5 py-4 sm:px-6"
          >
            <p class="text-sm text-red-800">
              Renueva tu plan para seguir registrando ingresos, salidas y reportes.
            </p>
          </div>
        </section>

        <section class="space-y-4">
          <div>
            <h2 class="text-lg font-bold text-ink">Renovar o cambiar plan</h2>
            <p class="mt-1 text-sm text-muted">
              Desde {{ formatCurrencyValue(MONTHLY_PRICE) }}/mes · pagos seguros con Bold
            </p>
          </div>

          <p v-if="subscription.error" class="rounded-2xl bg-red-50 px-4 py-3 text-sm text-red-700">
            {{ subscription.error }}
          </p>

          <div class="grid gap-4 md:grid-cols-3">
            <div
              v-for="plan in SUBSCRIPTION_PLANS"
              :key="plan.id"
              class="pp-card relative flex flex-col p-5 transition"
              :class="[
                plan.featured ? 'ring-2 ring-lime shadow-md' : '',
                isCurrentPlan(plan.id) ? 'bg-lime/5 ring-2 ring-ink/20' : '',
              ]"
            >
              <span
                v-if="isCurrentPlan(plan.id)"
                class="absolute -top-2.5 left-4 rounded-full bg-ink px-2.5 py-0.5 text-[10px] font-bold text-lime"
              >
                Plan actual
              </span>
              <span
                v-else-if="plan.badge"
                class="absolute -top-2.5 right-4 rounded-full bg-lime px-2.5 py-0.5 text-[10px] font-bold text-ink"
              >
                {{ plan.badge }}
              </span>

              <h3 class="text-lg font-bold text-ink">{{ plan.name }}</h3>
              <p class="mt-2 min-h-[2.5rem] text-sm leading-snug text-muted">{{ plan.description }}</p>

              <p class="mt-4 text-3xl font-bold text-ink">
                {{ formatCurrencyValue(plan.amount) }}
              </p>
              <p class="text-xs text-muted">
                {{
                  plan.months === 1
                    ? 'cada mes'
                    : `${monthlyEquivalent(plan.amount, plan.months)}/mes · ${plan.months} meses`
                }}
              </p>
              <p v-if="plan.savings" class="mt-2 text-xs font-medium text-green-700">
                {{ plan.savings }}
              </p>

              <AppButton
                class="mt-5 w-full"
                :variant="plan.featured && !isCurrentPlan(plan.id) ? 'primary' : 'secondary'"
                :loading="subscription.checkoutLoading && selectedPlan === plan.id"
                :disabled="isCurrentPlan(plan.id)"
                show-arrow
                @click="pay(plan.id)"
              >
                {{ isCurrentPlan(plan.id) ? 'Plan activo' : 'Pagar con Bold' }}
              </AppButton>
            </div>
          </div>
        </section>

        <section class="pp-card p-5">
          <h3 class="font-bold text-ink">Incluido en tu suscripción</h3>
          <div class="mt-4 grid gap-3 sm:grid-cols-2">
            <div
              v-for="item in includedFeatures"
              :key="item.title"
              class="flex gap-3 rounded-2xl bg-[#eef0f2]/80 p-3"
            >
              <span class="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white text-ink shadow-sm">
                <AppIcon :name="item.icon" :size="16" />
              </span>
              <div>
                <p class="text-sm font-semibold text-ink">{{ item.title }}</p>
                <p class="text-xs text-muted">{{ item.desc }}</p>
              </div>
            </div>
          </div>
        </section>
      </template>
    </template>

    <!-- Operador -->
    <section v-else class="pp-card flex flex-col items-center px-6 py-10 text-center">
      <span class="flex h-14 w-14 items-center justify-center rounded-2xl bg-[#eef0f2] text-ink">
        <AppIcon name="users" :size="24" />
      </span>
      <h2 class="mt-4 text-lg font-bold text-ink">Cuenta de operador</h2>
      <p class="mt-2 max-w-sm text-sm text-muted">
        Tu acceso está vinculado al parqueadero
        <strong class="text-ink">{{ parking.lot?.name }}</strong>.
        La suscripción y los pagos los gestiona el administrador.
      </p>
      <RouterLink
        to="/dashboard"
        class="mt-6 inline-flex items-center gap-2 rounded-full bg-ink px-5 py-2.5 text-sm font-bold text-lime transition hover:bg-ink/90"
      >
        Ir al panel
      </RouterLink>
    </section>
  </div>
</template>
