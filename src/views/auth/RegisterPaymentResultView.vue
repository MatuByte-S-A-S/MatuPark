<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { clearSignupDraft, loadSignupDraft, signupConfirm } from '@/lib/billingApi'
import AppButton from '@/components/ui/AppButton.vue'
import AppLogo from '@/components/ui/AppLogo.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()

const confirming = ref(true)
const paid = ref(false)
const needsLogin = ref(false)
const error = ref('')

onMounted(async () => {
  const reference = String(route.query.reference ?? '')
  const draft = loadSignupDraft()

  if (!reference) {
    confirming.value = false
    error.value = 'Referencia de pago no encontrada'
    return
  }

  try {
    const result = await signupConfirm(reference)
    paid.value = result.paid && result.accountCreated

    if (paid.value) {
      clearSignupDraft()
      if (draft) {
        const ok = await auth.login(draft.email, draft.password)
        if (ok) {
          await router.replace('/dashboard')
          return
        }
      }
      needsLogin.value = true
      error.value = `Cuenta creada${result.email ? ` (${result.email})` : ''}. Inicia sesión con tu correo y contraseña.`
      return
    }

    if (result.alreadyCompleted) {
      clearSignupDraft()
      if (draft) {
        const ok = await auth.login(draft.email, draft.password)
        if (ok) {
          await router.replace('/dashboard')
          return
        }
      }
      needsLogin.value = true
      error.value = 'Tu cuenta ya está activa. Inicia sesión con tu correo y contraseña.'
      return
    }

    error.value = `Pago no confirmado (${result.status ?? 'pendiente'}). Si ya pagaste, espera un momento e intenta de nuevo.`
  } catch (e) {
    error.value = e instanceof Error ? e.message : 'No se pudo completar el registro'
  } finally {
    confirming.value = false
  }
})
</script>

<template>
  <div class="flex min-h-screen flex-col items-center justify-center bg-surface p-6">
    <AppLogo always-show-name class="mb-8" />

    <div class="pp-card w-full max-w-md p-8 text-center">
      <div v-if="confirming" class="space-y-4">
        <div class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-ink/10 border-t-ink" />
        <h2 class="text-xl font-bold text-ink">Confirmando pago…</h2>
        <p class="text-sm text-muted">Creando tu cuenta MatuPark</p>
      </div>

      <div v-else-if="needsLogin" class="space-y-4">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime text-2xl font-bold text-ink">
          ✓
        </div>
        <h2 class="text-2xl font-bold text-ink">¡Cuenta lista!</h2>
        <p class="text-sm text-muted">{{ error }}</p>
        <AppButton class="w-full" show-arrow @click="router.push('/login')">
          Ir a iniciar sesión
        </AppButton>
      </div>

      <div v-else-if="paid" class="space-y-4">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime text-2xl font-bold text-ink">
          ✓
        </div>
        <h2 class="text-2xl font-bold text-ink">¡Bienvenido!</h2>
        <p class="text-sm text-muted">Redirigiendo al panel…</p>
      </div>

      <div v-else class="space-y-4">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
          !
        </div>
        <h2 class="text-xl font-bold text-ink">No se pudo completar</h2>
        <p class="text-sm text-muted">{{ error }}</p>
        <AppButton class="w-full" show-arrow @click="router.push('/register')">
          Volver al registro
        </AppButton>
        <RouterLink to="/login" class="block text-sm font-semibold text-ink underline">
          Iniciar sesión
        </RouterLink>
      </div>
    </div>
  </div>
</template>
