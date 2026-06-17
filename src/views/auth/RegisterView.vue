<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppLogo from '@/components/ui/AppLogo.vue'
import { APP_NAME } from '@/constants/branding'
import { SUBSCRIPTION_PLANS, MONTHLY_PRICE } from '@/constants/plans'
import { formatCurrencyValue } from '@/utils/currency'
import {
  saveSignupDraft,
  signupCheckout,
  type SignupDraft,
} from '@/lib/billingApi'
import type { SubscriptionPlanId } from '@/constants/plans'

const step = ref<1 | 2>(1)
const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const selectedPlan = ref<SubscriptionPlanId>('plan-semestral')
const localError = ref('')
const paying = ref(false)

const passwordMismatch = computed(
  () => confirmPassword.value.length > 0 && password.value !== confirmPassword.value
)

function validateStep1(): boolean {
  localError.value = ''
  if (!fullName.value.trim()) {
    localError.value = 'Ingresa tu nombre'
    return false
  }
  if (!email.value.trim()) {
    localError.value = 'Ingresa tu correo'
    return false
  }
  if (password.value.length < 6) {
    localError.value = 'La contraseña debe tener al menos 6 caracteres'
    return false
  }
  if (passwordMismatch.value) {
    localError.value = 'Las contraseñas no coinciden'
    return false
  }
  return true
}

function goToPayment() {
  if (!validateStep1()) return
  step.value = 2
}

function goBack() {
  step.value = 1
  localError.value = ''
}

async function payAndCreate() {
  if (!validateStep1()) {
    step.value = 1
    return
  }

  localError.value = ''
  paying.value = true

  const draft: SignupDraft = {
    fullName: fullName.value.trim(),
    email: email.value.trim().toLowerCase(),
    password: password.value,
    planId: selectedPlan.value,
  }

  try {
    saveSignupDraft(draft)
    const { checkoutUrl } = await signupCheckout(
      draft.fullName,
      draft.email,
      draft.password,
      draft.planId
    )
    window.location.href = checkoutUrl
  } catch (e) {
    paying.value = false
    localError.value = e instanceof Error ? e.message : 'No se pudo iniciar el pago'
  }
}

function monthlyEquivalent(amount: number, months: number) {
  return formatCurrencyValue(Math.round(amount / months))
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-surface lg:flex-row">
    <div class="relative hidden flex-1 flex-col justify-between overflow-hidden bg-ink p-12 text-white lg:flex">
      <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-lime/20 blur-3xl" />
      <div class="relative">
        <AppLogo size="lg" always-show-name name-class="text-2xl font-bold text-white" />
      </div>
      <div class="relative">
        <h2 class="text-4xl font-bold leading-tight">Empieza con MatuPark</h2>
        <p class="mt-4 max-w-md text-white/60">
          Crea tu cuenta, elige tu plan y configura tu parqueadero cuando estés dentro de la app.
        </p>
        <div class="mt-6 flex gap-2">
          <span class="pp-badge-lime">Paso {{ step }} de 2</span>
        </div>
      </div>
      <p class="relative text-sm text-white/40">© {{ APP_NAME }}</p>
    </div>

    <div class="flex flex-1 flex-col justify-center p-6 sm:p-10">
      <div class="mx-auto w-full max-w-md">
        <AppLogo always-show-name class="mb-6 lg:hidden" />

        <div class="pp-card p-8">
          <!-- Paso 1: datos personales -->
          <template v-if="step === 1">
            <h2 class="text-2xl font-bold text-ink">Crear cuenta</h2>
            <p class="mt-1 text-sm text-muted">Solo necesitamos tus datos de acceso</p>

            <form class="mt-6 space-y-4" @submit.prevent="goToPayment">
              <AppInput v-model="fullName" label="Tu nombre" required placeholder="Juan Pérez" />
              <AppInput v-model="email" label="Correo" type="email" required placeholder="tu@correo.com" />
              <AppInput
                v-model="password"
                label="Contraseña"
                type="password"
                required
                placeholder="Mín. 6 caracteres"
              />
              <AppInput
                v-model="confirmPassword"
                label="Confirmar contraseña"
                type="password"
                required
              />
              <p v-if="localError" class="text-sm font-medium text-red-600">{{ localError }}</p>
              <AppButton type="submit" class="w-full" size="lg" show-arrow>
                Siguiente — elegir plan
              </AppButton>
            </form>
          </template>

          <!-- Paso 2: plan y pago -->
          <template v-else>
            <button
              type="button"
              class="mb-4 text-sm font-semibold text-muted hover:text-ink"
              @click="goBack"
            >
              ← Volver
            </button>
            <h2 class="text-2xl font-bold text-ink">Elige tu plan</h2>
            <p class="mt-1 text-sm text-muted">
              Desde {{ formatCurrencyValue(MONTHLY_PRICE) }}/mes · pagas ahora y se crea tu cuenta
            </p>

            <div class="mt-5 space-y-3">
              <button
                v-for="plan in SUBSCRIPTION_PLANS"
                :key="plan.id"
                type="button"
                class="w-full rounded-2xl border-2 p-4 text-left transition"
                :class="
                  selectedPlan === plan.id
                    ? 'border-lime bg-lime/10 ring-2 ring-lime/30'
                    : 'border-black/8 bg-surface hover:border-lime/50'
                "
                @click="selectedPlan = plan.id"
              >
                <div class="flex items-start justify-between gap-2">
                  <div>
                    <p class="font-bold text-ink">{{ plan.name }}</p>
                    <p class="text-xs text-muted">
                      {{
                        plan.months === 1
                          ? '1 mes'
                          : `${monthlyEquivalent(plan.amount, plan.months)}/mes · ${plan.months} meses`
                      }}
                    </p>
                  </div>
                  <div class="text-right">
                    <p v-if="plan.badge" class="text-[10px] font-bold text-green-700">{{ plan.badge }}</p>
                    <p class="text-lg font-bold text-ink">{{ formatCurrencyValue(plan.amount) }}</p>
                  </div>
                </div>
              </button>
            </div>

            <p class="mt-4 rounded-2xl bg-surface px-4 py-3 text-xs text-muted">
              El parqueadero (nombre, dirección, tarifas, cupos) lo configuras después en
              <strong class="text-ink">Ajustes</strong> dentro de la app.
            </p>

            <p v-if="localError" class="mt-4 text-sm font-medium text-red-600">{{ localError }}</p>

            <AppButton
              class="mt-5 w-full"
              size="lg"
              show-arrow
              :loading="paying"
              @click="payAndCreate"
            >
              Pagar y crear cuenta
            </AppButton>
          </template>

          <p class="mt-6 text-center text-sm text-muted">
            ¿Ya tienes cuenta?
            <RouterLink to="/login" class="font-semibold text-ink underline-offset-2 hover:underline">
              Iniciar sesión
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
