<script setup lang="ts">
import { ref, computed } from 'vue'
import { RouterLink } from 'vue-router'
import { useCashStore } from '@/stores/cash'
import { useNotify } from '@/composables/useNotify'
import { formatCurrency } from '@/utils/billing'
import AppIcon from '@/components/ui/AppIcon.vue'
import AppModal from '@/components/ui/AppModal.vue'
import CurrencyInput from '@/components/ui/CurrencyInput.vue'
import AppButton from '@/components/ui/AppButton.vue'

const cash = useCashStore()
const notify = useNotify()

const showOpen = ref(false)
const openingAmount = ref(0)
const acting = ref(false)

const isOpen = computed(() => !!cash.openSession)

const label = computed(() => {
  if (!isOpen.value) return 'Abrir caja'
  return formatCurrency(cash.expectedCash)
})

const sublabel = computed(() => {
  if (!isOpen.value) return 'Caja cerrada'
  const base = Number(cash.openSession?.opening_amount ?? 0)
  return `Base ${formatCurrency(base)}`
})

async function handleOpen() {
  acting.value = true
  const res = await cash.openCash(openingAmount.value || 0)
  acting.value = false
  if (res.error) {
    notify.error('Caja', res.error)
    return
  }
  notify.success('Caja abierta', formatCurrency(openingAmount.value || 0))
  showOpen.value = false
  openingAmount.value = 0
}

function onClick(e: MouseEvent) {
  if (isOpen.value) return
  e.preventDefault()
  showOpen.value = true
}
</script>

<template>
  <RouterLink
    to="/caja"
    class="group flex items-center gap-2 rounded-full py-1.5 pl-2 pr-3 ring-1 transition hover:ring-black/10"
    :class="isOpen ? 'bg-lime/25 ring-lime/40' : 'bg-white ring-black/[0.06]'"
    :title="isOpen ? `Caja abierta · ${label}` : 'Abrir caja'"
    @click="onClick"
  >
    <span
      class="flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition"
      :class="isOpen ? 'bg-ink text-lime' : 'bg-[#eef0f2] text-muted group-hover:text-ink'"
    >
      <AppIcon name="wallet" :size="18" />
    </span>
    <span class="hidden min-w-0 sm:block">
      <span class="block truncate text-xs font-bold leading-tight text-ink">{{ label }}</span>
      <span class="block truncate text-[10px] text-muted">{{ sublabel }}</span>
    </span>
  </RouterLink>

  <AppModal :open="showOpen" title="Abrir caja" @close="showOpen = false">
    <div class="space-y-4">
      <p class="text-sm text-muted">
        Indica el efectivo inicial del turno. Los cobros quedarán vinculados a esta sesión.
      </p>
      <CurrencyInput v-model="openingAmount" label="Monto inicial en efectivo" />
      <AppButton class="w-full" :loading="acting" @click="handleOpen">Confirmar apertura</AppButton>
    </div>
  </AppModal>
</template>
