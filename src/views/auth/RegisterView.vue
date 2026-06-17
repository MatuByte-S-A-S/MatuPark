<script setup lang="ts">
import { ref, computed } from 'vue'
import { useRouter } from 'vue-router'
import { RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppLogo from '@/components/ui/AppLogo.vue'
import { APP_NAME } from '@/constants/branding'

const auth = useAuthStore()
const router = useRouter()

const fullName = ref('')
const email = ref('')
const password = ref('')
const confirmPassword = ref('')
const parkingName = ref('')
const address = ref('')
const phone = ref('')

const localError = ref('')

const passwordMismatch = computed(
  () => confirmPassword.value.length > 0 && password.value !== confirmPassword.value
)

async function submit() {
  localError.value = ''
  auth.error = null

  if (password.value.length < 6) {
    localError.value = 'La contraseña debe tener al menos 6 caracteres'
    return
  }
  if (passwordMismatch.value) {
    localError.value = 'Las contraseñas no coinciden'
    return
  }
  if (!parkingName.value.trim()) {
    localError.value = 'Indica el nombre de tu parqueadero'
    return
  }

  const ok = await auth.register({
    email: email.value,
    password: password.value,
    fullName: fullName.value,
    parkingName: parkingName.value,
    address: address.value,
    phone: phone.value,
  })

  if (ok) router.push('/dashboard')
}

const displayError = computed(() => localError.value || auth.error)
</script>

<template>
  <div class="flex min-h-screen flex-col bg-surface lg:flex-row">
    <div class="relative hidden flex-1 flex-col justify-between overflow-hidden bg-ink p-12 text-white lg:flex">
      <div class="absolute -right-20 -top-20 h-64 w-64 rounded-full bg-lime/20 blur-3xl" />
      <div class="relative">
        <AppLogo size="lg" always-show-name name-class="text-2xl font-bold text-white" />
      </div>
      <div class="relative">
        <h2 class="text-4xl font-bold leading-tight">Crea tu cuenta en minutos</h2>
        <p class="mt-4 max-w-md text-white/60">
          Registras tu parqueadero, quedas como administrador y empiezas a operar de inmediato.
        </p>
      </div>
      <p class="relative text-sm text-white/40">© {{ APP_NAME }}</p>
    </div>

    <div class="flex flex-1 flex-col justify-center p-6 sm:p-10">
      <div class="mx-auto w-full max-w-md">
        <AppLogo always-show-name class="mb-6" />

        <div class="pp-card p-8">
          <h2 class="text-2xl font-bold text-ink">Crear cuenta</h2>
          <p class="mt-1 text-sm text-muted">Nuevo parqueadero + usuario administrador</p>

          <form class="mt-6 max-h-[70vh] space-y-4 overflow-y-auto pr-1" @submit.prevent="submit">
            <AppInput v-model="fullName" label="Tu nombre" required placeholder="Juan Pérez" />
            <AppInput v-model="email" label="Correo" type="email" required placeholder="tu@correo.com" />
            <AppInput v-model="password" label="Contraseña" type="password" required placeholder="Mín. 6 caracteres" />
            <AppInput
              v-model="confirmPassword"
              label="Confirmar contraseña"
              type="password"
              required
            />
            <div class="border-t border-surface pt-4">
              <p class="mb-3 text-xs font-semibold uppercase tracking-wide text-muted">Parqueadero</p>
              <AppInput
                v-model="parkingName"
                label="Nombre del parqueadero"
                required
                placeholder="Parqueadero Central"
              />
              <AppInput v-model="address" label="Dirección" placeholder="Opcional" class="mt-4" />
              <AppInput v-model="phone" label="Teléfono" placeholder="Opcional" class="mt-4" />
            </div>
            <p v-if="displayError" class="text-sm font-medium text-red-600">{{ displayError }}</p>
            <AppButton type="submit" class="w-full" size="lg" :loading="auth.loading" show-arrow>
              Crear cuenta
            </AppButton>
          </form>

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
