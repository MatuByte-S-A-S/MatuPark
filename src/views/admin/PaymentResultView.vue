<script setup lang="ts">
import { onMounted, ref } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useSubscriptionStore } from '@/stores/subscription'
import { useNotify } from '@/composables/useNotify'
import AppButton from '@/components/ui/AppButton.vue'

const route = useRoute()
const router = useRouter()
const auth = useAuthStore()
const subscription = useSubscriptionStore()
const notify = useNotify()

const confirming = ref(true)
const paid = ref(false)
const status = ref('')

onMounted(async () => {
  const reference = String(route.query.reference ?? '')
  const queryPaid = route.query.paid === 'true'
  status.value = String(route.query.status ?? '')

  if (!reference || !auth.parkingLotId) {
    confirming.value = false
    return
  }

  try {
    const result = await subscription.confirm(reference, auth.parkingLotId)
    paid.value = result.paid || queryPaid
    status.value = result.status || status.value

    if (paid.value) {
      notify.success('Pago confirmado', 'Tu plan MatuPark está activo')
    } else {
      notify.error('Pago no completado', `Estado: ${status.value || 'pendiente'}`)
    }
  } catch (e) {
    paid.value = queryPaid
    notify.error(
      'No se pudo verificar',
      e instanceof Error ? e.message : 'Intenta de nuevo desde tu plan'
    )
  } finally {
    confirming.value = false
  }
})
</script>

<template>
  <div class="mx-auto max-w-lg py-8">
    <div class="pp-card p-8 text-center">
      <div v-if="confirming" class="space-y-4">
        <div class="mx-auto h-12 w-12 animate-spin rounded-full border-4 border-ink/10 border-t-ink" />
        <h2 class="text-xl font-bold text-ink">Verificando pago…</h2>
        <p class="text-sm text-muted">Espera un momento mientras confirmamos con Bold.</p>
      </div>

      <div v-else-if="paid" class="space-y-4">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-lime text-2xl font-bold text-ink">
          ✓
        </div>
        <h2 class="text-2xl font-bold text-ink">¡Pago exitoso!</h2>
        <p class="text-sm text-muted">
          Tu suscripción MatuPark está activa.
          <span v-if="subscription.expiresLabel">Vence el {{ subscription.expiresLabel }}.</span>
        </p>
        <AppButton class="w-full" show-arrow @click="router.push('/dashboard')">
          Ir al panel
        </AppButton>
      </div>

      <div v-else class="space-y-4">
        <div class="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-100 text-2xl text-red-600">
          !
        </div>
        <h2 class="text-2xl font-bold text-ink">Pago no confirmado</h2>
        <p class="text-sm text-muted">
          Estado: {{ status || 'desconocido' }}.
          Si ya pagaste, espera unos minutos o contacta soporte.
        </p>
        <AppButton class="w-full" show-arrow @click="router.push('/cuenta')">
          Ir a mi cuenta
        </AppButton>
      </div>
    </div>
  </div>
</template>
