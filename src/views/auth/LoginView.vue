<script setup lang="ts">
import { ref } from 'vue'
import { useRoute, useRouter, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppLogo from '@/components/ui/AppLogo.vue'
import { APP_NAME } from '@/constants/branding'

const auth = useAuthStore()
const router = useRouter()
const route = useRoute()

const email = ref('')
const password = ref('')

async function submit() {
  const ok = await auth.login(email.value, password.value)
  if (ok) {
    const redirect = (route.query.redirect as string) || '/dashboard'
    router.push(redirect)
  }
}
</script>

<template>
  <div class="flex min-h-screen flex-col bg-surface lg:flex-row">
    <div class="relative hidden flex-1 flex-col justify-between overflow-hidden bg-ink p-12 text-white lg:flex">
      <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-lime/20 blur-3xl" />
      <div class="absolute -bottom-10 -left-10 h-48 w-48 rounded-full bg-lime/10 blur-2xl" />
      <div class="relative">
        <AppLogo size="lg" always-show-name name-class="text-2xl font-bold text-white" />
      </div>
      <div class="relative">
        <h2 class="text-4xl font-bold leading-tight">Administra tu parqueadero con estilo</h2>
        <p class="mt-4 max-w-md text-white/60">
          Aforo en vivo, tickets QR, cobros automáticos y reportes — todo en un solo lugar.
        </p>
        <div class="mt-8 flex gap-2">
          <span class="pp-badge-lime">Realtime</span>
          <span class="rounded-full bg-white/10 px-3 py-1 text-xs font-semibold">MatuDB</span>
        </div>
      </div>
      <p class="relative text-sm text-white/40">© {{ APP_NAME }}</p>
    </div>

    <div class="flex flex-1 flex-col justify-center p-6 sm:p-10">
      <div class="mx-auto w-full max-w-md">
        <AppLogo always-show-name class="mb-8 lg:hidden" />

        <div class="pp-card p-8">
          <h2 class="text-2xl font-bold text-ink">Iniciar sesión</h2>
          <p class="mt-1 text-sm text-muted">Accede al panel de administración</p>

          <form class="mt-8 space-y-5" @submit.prevent="submit">
            <AppInput v-model="email" label="Correo" type="email" required placeholder="admin@parqueadero.com" />
            <AppInput v-model="password" label="Contraseña" type="password" required />
            <p v-if="auth.error" class="text-sm font-medium text-red-600">{{ auth.error }}</p>
            <AppButton type="submit" class="w-full" size="lg" :loading="auth.loading" show-arrow>
              Continuar
            </AppButton>
          </form>

          <p class="mt-6 text-center text-sm text-muted">
            ¿No tienes cuenta?
            <RouterLink to="/register" class="font-semibold text-ink underline-offset-2 hover:underline">
              Crear cuenta
            </RouterLink>
          </p>
        </div>
      </div>
    </div>
  </div>
</template>
