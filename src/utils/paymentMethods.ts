import type { PaymentMethod } from '@/types'
import type { IconName } from '@/types/icons'

export const PAYMENT_METHODS: { value: PaymentMethod; label: string; icon: IconName }[] = [
  { value: 'cash', label: 'Efectivo', icon: 'banknote' },
  { value: 'card', label: 'Tarjeta', icon: 'credit-card' },
  { value: 'transfer', label: 'Transferencia', icon: 'landmark' },
  { value: 'nequi', label: 'Nequi', icon: 'smartphone' },
  { value: 'daviplata', label: 'Daviplata', icon: 'wallet' },
  { value: 'other', label: 'Otro', icon: 'more' },
]

export function paymentMethodLabel(method: string): string {
  return PAYMENT_METHODS.find((m) => m.value === method)?.label ?? method
}
