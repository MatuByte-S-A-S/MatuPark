export type SubscriptionPlanId = 'trial' | 'plan-mensual' | 'plan-semestral' | 'plan-anual'

export interface SubscriptionPlan {
  id: SubscriptionPlanId
  name: string
  description: string
  amount: number
  months: number
  currency: 'COP'
  badge?: string
  savings?: string
  featured?: boolean
}

export const MONTHLY_PRICE = 27000

export const SUBSCRIPTION_PLANS: SubscriptionPlan[] = [
  {
    id: 'plan-mensual',
    name: 'Mensual',
    description: 'Renovación cada mes. Ideal para probar sin compromiso largo.',
    amount: MONTHLY_PRICE,
    months: 1,
    currency: 'COP',
  },
  {
    id: 'plan-semestral',
    name: 'Semestral',
    description: '6 meses de MatuPark con descuento del 10%.',
    amount: 145800,
    months: 6,
    currency: 'COP',
    badge: '10% OFF',
    savings: 'Ahorras $16.200 vs pagar mes a mes',
    featured: true,
  },
  {
    id: 'plan-anual',
    name: 'Anual',
    description: '12 meses con el mejor precio — 20% de descuento.',
    amount: 259200,
    months: 12,
    currency: 'COP',
    badge: '20% OFF',
    savings: 'Ahorras $64.800 vs pagar mes a mes',
  },
]

export const PLAN_BY_ID = Object.fromEntries(
  SUBSCRIPTION_PLANS.map((p) => [p.id, p])
) as Record<Exclude<SubscriptionPlanId, 'trial'>, SubscriptionPlan>

export function planLabel(planId: string): string {
  if (planId === 'trial') return 'Prueba gratuita'
  return PLAN_BY_ID[planId as keyof typeof PLAN_BY_ID]?.name ?? planId
}
