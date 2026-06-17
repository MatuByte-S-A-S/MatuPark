<script setup lang="ts">
import { ref, watch, computed } from 'vue'
import { useParkingStore } from '@/stores/parking'
import { useOperationQueueStore } from '@/stores/operationQueue'
import { calculateAmount, formatCurrency, formatDuration } from '@/utils/billing'
import { PAYMENT_METHODS } from '@/utils/paymentMethods'
import AppModal from '@/components/ui/AppModal.vue'
import PaymentMethodButton from '@/components/ui/PaymentMethodButton.vue'
import AppButton from '@/components/ui/AppButton.vue'
import VehicleTopIcon from '@/components/parking/VehicleTopIcon.vue'
import type { PaymentMethod, Ticket } from '@/types'

const props = defineProps<{
  open: boolean
  ticket: Ticket | null
  slotId?: string | null
}>()

const emit = defineEmits<{ close: [] }>()

const parking = useParkingStore()
const queue = useOperationQueueStore()

const paymentMethod = ref<PaymentMethod>('cash')

watch(
  () => props.open,
  (v) => {
    if (v) paymentMethod.value = 'cash'
  }
)

const billing = computed(() => {
  if (!props.ticket || !parking.settings) return null
  const b = calculateAmount(parking.settings, props.ticket.vehicle_type, props.ticket.entry_at)
  return {
    amount: b.amount,
    amountFmt: formatCurrency(b.amount),
    duration: formatDuration(b.minutes),
  }
})

function confirmExit() {
  if (!props.ticket || !billing.value) return
  queue.enqueueExit(props.ticket, billing.value.amount, paymentMethod.value)
  emit('close')
}
</script>

<template>
  <AppModal
    :open="open && !!ticket"
    :title="slotId ? `Salida · cupo ${slotId}` : 'Registrar salida'"
    wide
    @close="$emit('close')"
  >
    <div v-if="ticket && billing" class="space-y-5">
      <div class="flex items-center gap-4 rounded-2xl bg-ink p-4 text-white">
        <VehicleTopIcon :type="ticket.vehicle_type" class="h-16 w-12 shrink-0" />
        <div class="min-w-0 flex-1">
          <p class="text-2xl font-bold tracking-wide">{{ ticket.plate }}</p>
          <p class="font-mono text-sm text-lime">{{ ticket.code }}</p>
          <p class="mt-1 text-xs text-white/60">{{ billing.duration }} en parqueadero</p>
        </div>
        <div class="text-right">
          <p class="text-xs text-white/60">Total a cobrar</p>
          <p class="text-3xl font-bold text-lime">{{ billing.amountFmt }}</p>
        </div>
      </div>

      <div>
        <p class="mb-3 text-sm font-semibold text-ink">Método de pago</p>
        <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
          <PaymentMethodButton
            v-for="m in PAYMENT_METHODS"
            :key="m.value"
            :icon="m.icon"
            :label="m.label"
            :active="paymentMethod === m.value"
            @click="paymentMethod = m.value"
          />
        </div>
      </div>

      <div class="flex gap-3">
        <AppButton variant="secondary" class="flex-1" @click="$emit('close')">Cancelar</AppButton>
        <AppButton class="flex-1" show-arrow @click="confirmExit">
          Cobrar y liberar cupo
        </AppButton>
      </div>
      <p class="text-center text-[11px] text-muted">
        El cobro se procesa en segundo plano — puedes seguir operando el parqueadero.
      </p>
    </div>
  </AppModal>
</template>
