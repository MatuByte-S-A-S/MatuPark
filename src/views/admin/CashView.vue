<script setup lang="ts">
import { ref, computed } from 'vue'
import { useCashStore } from '@/stores/cash'
import { useNotify } from '@/composables/useNotify'
import { formatCurrency } from '@/utils/billing'
import { PAYMENT_METHODS, paymentMethodLabel } from '@/utils/paymentMethods'
import PaymentMethodButton from '@/components/ui/PaymentMethodButton.vue'
import type { CashLedgerKind, PaymentMethod } from '@/types'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppChip from '@/components/ui/AppChip.vue'
import CurrencyInput from '@/components/ui/CurrencyInput.vue'
import AppModal from '@/components/ui/AppModal.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import KpiCard from '@/components/ui/KpiCard.vue'

const cash = useCashStore()
const notify = useNotify()

const showOpen = ref(false)
const showClose = ref(false)
const showExpense = ref(false)
const openingAmount = ref(0)
const closingAmount = ref(0)
const expenseAmount = ref(0)
const expenseCategory = ref('')
const expenseDesc = ref('')
const expenseMethod = ref<PaymentMethod>('cash')
const acting = ref(false)
const ledgerFilter = ref<'all' | 'payments' | 'expenses'>('all')

const diff = computed(() => {
  if (!closingAmount.value) return null
  return closingAmount.value - cash.expectedCash
})

const filteredLedger = computed(() => {
  if (ledgerFilter.value === 'payments') {
    return cash.ledger.filter((e) => e.kind === 'payment')
  }
  if (ledgerFilter.value === 'expenses') {
    return cash.ledger.filter((e) => e.kind === 'expense' || e.kind === 'income' || e.kind === 'adjustment')
  }
  return cash.ledger
})

const dispatchSummary = computed(() => {
  const { cars, motos, total } = cash.paymentBreakdown
  if (!total) return 'Sin salidas cobradas en este turno'
  const parts = []
  if (cars) parts.push(`${cars} carro${cars === 1 ? '' : 's'}`)
  if (motos) parts.push(`${motos} moto${motos === 1 ? '' : 's'}`)
  return `${total} salida${total === 1 ? '' : 's'} · ${parts.join(' · ')}`
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

async function handleClose() {
  if (!closingAmount.value) {
    notify.error('Cierre', 'Indica el monto contado en caja')
    return
  }
  acting.value = true
  const res = await cash.closeCash(closingAmount.value)
  acting.value = false
  if (res.error) {
    notify.error('Cierre', res.error)
    return
  }
  notify.success('Caja cerrada', diff.value !== null ? `Diferencia: ${formatCurrency(diff.value)}` : '')
  showClose.value = false
  closingAmount.value = 0
}

async function handleExpense() {
  const amount = expenseAmount.value
  if (!amount || amount <= 0) {
    notify.error('Gasto', 'Monto inválido')
    return
  }
  acting.value = true
  const res = await cash.addMovement({
    type: 'expense',
    amount,
    category: expenseCategory.value || 'Gasto',
    description: expenseDesc.value,
    paymentMethod: expenseMethod.value,
  })
  acting.value = false
  if (res.error) {
    notify.error('Gasto', res.error)
    return
  }
  notify.success('Gasto registrado', formatCurrency(amount))
  showExpense.value = false
  expenseAmount.value = 0
  expenseCategory.value = ''
  expenseDesc.value = ''
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleString('es-CO', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
  })
}

function kindBadge(kind: CashLedgerKind) {
  if (kind === 'opening') return 'Apertura'
  if (kind === 'payment') return 'Cobro'
  if (kind === 'expense') return 'Gasto'
  if (kind === 'income') return 'Ingreso'
  return 'Ajuste'
}

function kindClass(kind: CashLedgerKind) {
  if (kind === 'payment') return 'bg-lime/30 text-ink'
  if (kind === 'expense') return 'bg-red-100 text-red-800'
  if (kind === 'opening') return 'bg-surface text-muted'
  return 'bg-surface text-ink'
}
</script>

<template>
  <div class="mx-auto max-w-5xl space-y-5">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <div>
        <h2 class="pp-page-title">Caja</h2>
        <p class="mt-1 text-sm text-muted">
          {{ cash.openSession ? 'Turno abierto' : 'Sin turno activo' }}
          <span v-if="cash.openSession" class="font-semibold text-ink">
            · {{ new Date(cash.openSession.opened_at).toLocaleString('es-CO') }}
          </span>
        </p>
      </div>
      <div class="flex flex-wrap gap-2">
        <AppButton v-if="!cash.openSession" @click="showOpen = true">Abrir caja</AppButton>
        <template v-else>
          <AppButton variant="secondary" @click="showExpense = true">Registrar gasto</AppButton>
          <AppButton @click="closingAmount = Math.round(cash.expectedCash); showClose = true">
            Cerrar caja
          </AppButton>
        </template>
      </div>
    </div>

    <div v-if="!cash.openSession" class="pp-card flex flex-col items-center px-6 py-16 text-center">
      <div class="flex h-16 w-16 items-center justify-center rounded-2xl bg-lime/30 text-ink">
        <AppIcon name="wallet" :size="32" />
      </div>
      <h3 class="mt-4 text-xl font-bold text-ink">Caja cerrada</h3>
      <p class="mt-2 max-w-md text-sm text-muted">
        Abre la caja al iniciar turno. Indica el efectivo inicial (puede ser $0). Cada salida de vehículo
        quedará registrada como cobro en el libro de movimientos.
      </p>
      <AppButton class="mt-6" @click="showOpen = true">Abrir caja ahora</AppButton>
    </div>

    <template v-else>
      <div class="grid grid-cols-2 gap-2.5 xl:grid-cols-4">
        <KpiCard
          icon="wallet"
          title="Base de apertura"
          :value="formatCurrency(cash.openingBase)"
          subtitle="Efectivo al abrir el turno"
        />
        <KpiCard
          icon="banknote"
          title="Cobros del turno"
          :value="formatCurrency(cash.sessionIncome)"
          :subtitle="`${cash.paymentBreakdown.total} salidas cobradas`"
          highlight
        />
        <KpiCard
          title="Gastos"
          :value="formatCurrency(cash.sessionExpenses)"
          subtitle="Egresos manuales del turno"
        />
        <KpiCard
          title="Efectivo esperado"
          :value="formatCurrency(cash.expectedCash)"
          subtitle="Base + cobros efectivo − gastos"
          highlight
        />
      </div>

      <div class="grid gap-4 lg:grid-cols-3">
        <section class="pp-card p-4 lg:col-span-1">
          <h3 class="text-sm font-bold text-ink">Salidas del turno</h3>
          <p class="mt-2 text-lg font-bold text-ink">{{ dispatchSummary }}</p>
          <ul v-if="cash.cobrosByMethod.length" class="mt-4 space-y-2 border-t border-surface pt-3 text-sm">
            <li
              v-for="m in cash.cobrosByMethod"
              :key="m.method"
              class="flex justify-between gap-2"
            >
              <span class="text-muted">{{ paymentMethodLabel(m.method) }} · {{ m.count }}</span>
              <span class="font-semibold">{{ formatCurrency(m.amount) }}</span>
            </li>
          </ul>
        </section>

        <section class="pp-card p-4 lg:col-span-2">
          <h3 class="text-sm font-bold text-ink">Cómo se calcula el efectivo</h3>
          <dl class="mt-3 grid gap-2 text-sm sm:grid-cols-2">
            <div class="flex justify-between rounded-xl bg-surface px-3 py-2">
              <dt class="text-muted">Base apertura</dt>
              <dd class="font-semibold">{{ formatCurrency(cash.openingBase) }}</dd>
            </div>
            <div class="flex justify-between rounded-xl bg-surface px-3 py-2">
              <dt class="text-muted">+ Cobros en efectivo</dt>
              <dd class="font-semibold">{{ formatCurrency(cash.cashIncome) }}</dd>
            </div>
            <div class="flex justify-between rounded-xl bg-surface px-3 py-2">
              <dt class="text-muted">Cobros tarjeta/otros</dt>
              <dd class="font-semibold text-muted">{{ formatCurrency(cash.nonCashIncome) }}</dd>
            </div>
            <div class="flex justify-between rounded-xl bg-surface px-3 py-2">
              <dt class="text-muted">− Gastos</dt>
              <dd class="font-semibold text-red-600">{{ formatCurrency(cash.sessionExpenses) }}</dd>
            </div>
            <div class="flex justify-between rounded-xl bg-lime/20 px-3 py-2 ring-1 ring-lime/40">
              <dt class="font-semibold text-ink">= Efectivo esperado</dt>
              <dd class="font-bold text-ink">{{ formatCurrency(cash.expectedCash) }}</dd>
            </div>
          </dl>
          <p class="mt-3 text-xs text-muted">
            <strong>Total cobrado en el turno:</strong> {{ formatCurrency(cash.sessionIncome) }}
            ({{ formatCurrency(cash.cashIncome) }} efectivo + {{ formatCurrency(cash.nonCashIncome) }} otros métodos).
            Solo el efectivo suma al conteo físico de la caja.
          </p>
        </section>
      </div>

      <section class="pp-card overflow-hidden">
        <div class="flex flex-col gap-3 border-b border-surface px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5">
          <div>
            <h3 class="font-bold text-ink">Libro de movimientos</h3>
            <p class="text-xs text-muted">Apertura, cobros por salida y gastos del turno</p>
          </div>
          <div class="flex gap-1.5 overflow-x-auto">
            <AppChip :active="ledgerFilter === 'all'" @click="ledgerFilter = 'all'">Todos</AppChip>
            <AppChip :active="ledgerFilter === 'payments'" @click="ledgerFilter = 'payments'">Cobros</AppChip>
            <AppChip :active="ledgerFilter === 'expenses'" @click="ledgerFilter = 'expenses'">Gastos</AppChip>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full min-w-[640px] text-left text-sm">
            <thead class="bg-surface/80 text-xs font-semibold uppercase text-muted">
              <tr>
                <th class="px-4 py-3">Hora</th>
                <th class="px-4 py-3">Tipo</th>
                <th class="px-4 py-3">Concepto</th>
                <th class="px-4 py-3">Detalle</th>
                <th class="px-4 py-3">Método</th>
                <th class="px-4 py-3 text-right">Monto</th>
              </tr>
            </thead>
            <tbody>
              <tr
                v-for="row in filteredLedger"
                :key="row.id"
                class="border-t border-surface transition hover:bg-lime/5"
              >
                <td class="whitespace-nowrap px-4 py-3 text-muted">{{ formatTime(row.at) }}</td>
                <td class="px-4 py-3">
                  <span class="rounded-full px-2 py-0.5 text-[10px] font-bold uppercase" :class="kindClass(row.kind)">
                    {{ kindBadge(row.kind) }}
                  </span>
                </td>
                <td class="px-4 py-3 font-medium text-ink">{{ row.concept }}</td>
                <td class="max-w-[220px] truncate px-4 py-3 text-muted" :title="row.detail">{{ row.detail }}</td>
                <td class="px-4 py-3 text-muted">{{ row.method }}</td>
                <td
                  class="whitespace-nowrap px-4 py-3 text-right font-bold"
                  :class="row.sign === 'out' ? 'text-red-600' : row.sign === 'in' ? 'text-ink' : 'text-muted'"
                >
                  <template v-if="row.sign === 'out'">−</template>
                  <template v-else-if="row.sign === 'in'">+</template>
                  {{ formatCurrency(row.amount) }}
                </td>
              </tr>
              <tr v-if="!filteredLedger.length">
                <td colspan="6" class="px-4 py-14 text-center text-muted">
                  Sin movimientos en este filtro
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </section>
    </template>

    <AppModal :open="showOpen" title="Abrir caja" @close="showOpen = false">
      <div class="space-y-4">
        <p class="text-sm text-muted">
          Registra el efectivo con el que inicias el turno. Puede ser <strong>$0</strong> si no hay billetes en caja
          al abrir — los cobros por salidas se sumarán después.
        </p>
        <CurrencyInput v-model="openingAmount" label="Base de apertura (efectivo inicial)" />
        <AppButton class="w-full" :loading="acting" @click="handleOpen">Confirmar apertura</AppButton>
      </div>
    </AppModal>

    <AppModal :open="showClose" title="Cerrar caja" @close="showClose = false">
      <div class="space-y-4">
        <div class="rounded-2xl bg-surface p-4 text-sm">
          <p class="text-muted">Efectivo que debería haber en caja</p>
          <p class="text-2xl font-bold text-ink">{{ formatCurrency(cash.expectedCash) }}</p>
          <dl class="mt-3 space-y-1.5 border-t border-black/[0.06] pt-3 text-xs">
            <div class="flex justify-between">
              <dt class="text-muted">Base de apertura</dt>
              <dd class="font-semibold">{{ formatCurrency(cash.openingBase) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted">+ Cobros en efectivo</dt>
              <dd class="font-semibold">{{ formatCurrency(cash.cashIncome) }}</dd>
            </div>
            <div class="flex justify-between">
              <dt class="text-muted">− Gastos</dt>
              <dd class="font-semibold text-red-600">{{ formatCurrency(cash.sessionExpenses) }}</dd>
            </div>
            <div class="flex justify-between border-t border-black/[0.06] pt-1.5">
              <dt class="font-semibold text-ink">= Efectivo esperado</dt>
              <dd class="font-bold text-ink">{{ formatCurrency(cash.expectedCash) }}</dd>
            </div>
          </dl>
          <p class="mt-3 text-[11px] text-muted">
            Total facturado del turno: {{ formatCurrency(cash.sessionIncome) }}
            (incluye {{ formatCurrency(cash.nonCashIncome) }} en tarjeta/transferencia, que no van al cajón).
          </p>
        </div>
        <CurrencyInput v-model="closingAmount" label="Efectivo contado al cierre" />
        <p
          v-if="diff !== null"
          class="text-sm font-semibold"
          :class="diff === 0 ? 'text-ink' : diff > 0 ? 'text-green-700' : 'text-red-600'"
        >
          Diferencia: {{ formatCurrency(diff) }}
        </p>
        <AppButton class="w-full" :loading="acting" @click="handleClose">Cerrar turno</AppButton>
      </div>
    </AppModal>

    <AppModal :open="showExpense" title="Registrar gasto" @close="showExpense = false">
      <div class="space-y-4">
        <CurrencyInput v-model="expenseAmount" label="Monto del gasto" />
        <AppInput v-model="expenseCategory" label="Categoría" placeholder="Ej: Servicios, insumos…" />
        <AppInput v-model="expenseDesc" label="Descripción" />
        <div>
          <p class="mb-2 text-sm font-medium text-ink">Método</p>
          <div class="grid grid-cols-2 gap-2 sm:grid-cols-3">
            <PaymentMethodButton
              v-for="m in PAYMENT_METHODS"
              :key="m.value"
              :icon="m.icon"
              :label="m.label"
              :active="expenseMethod === m.value"
              @click="expenseMethod = m.value"
            />
          </div>
        </div>
        <AppButton class="w-full" :loading="acting" @click="handleExpense">Guardar gasto</AppButton>
      </div>
    </AppModal>
  </div>
</template>
