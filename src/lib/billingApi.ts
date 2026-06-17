import type { Subscription } from '@/types'
import type { SubscriptionPlanId } from '@/constants/plans'

const BASE = '/api/billing'

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, {
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
    ...init,
  })
  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data.error || res.statusText || 'Error de facturación')
  }
  return data as T
}

export function fetchPlans() {
  return request<{ plans: { id: SubscriptionPlanId; amount: number; months: number; name: string }[] }>(
    '/plans'
  )
}

export function fetchSubscription(parkingLotId: string) {
  return request<{ subscription: Subscription | null; history: Subscription[] }>(
    `/subscription?parkingLotId=${encodeURIComponent(parkingLotId)}`
  )
}

export function createCheckout(parkingLotId: string, planId: SubscriptionPlanId, lotName?: string) {
  return request<{ checkoutUrl: string; reference: string; amount: number; currency: string }>(
    '/checkout',
    {
      method: 'POST',
      body: JSON.stringify({ parkingLotId, planId, lotName }),
    }
  )
}

export function confirmPayment(reference: string) {
  return request<{ paid: boolean; status: string; subscription: Subscription | null }>('/confirm', {
    method: 'POST',
    body: JSON.stringify({ reference }),
  })
}

export function signupCheckout(
  fullName: string,
  email: string,
  password: string,
  planId: SubscriptionPlanId
) {
  return request<{ checkoutUrl: string; reference: string; amount: number; currency: string }>(
    '/signup-checkout',
    {
      method: 'POST',
      body: JSON.stringify({ fullName, email, password, planId }),
    }
  )
}

export function signupConfirm(reference: string) {
  return request<{
    paid: boolean
    status?: string
    accountCreated: boolean
    email?: string
    alreadyCompleted?: boolean
  }>('/signup-confirm', {
    method: 'POST',
    body: JSON.stringify({ reference }),
  })
}

export const SIGNUP_STORAGE_KEY = 'matupark_signup_draft'

export interface SignupDraft {
  fullName: string
  email: string
  password: string
  planId: SubscriptionPlanId
}

export function saveSignupDraft(draft: SignupDraft) {
  sessionStorage.setItem(SIGNUP_STORAGE_KEY, JSON.stringify(draft))
}

export function loadSignupDraft(): SignupDraft | null {
  try {
    const raw = sessionStorage.getItem(SIGNUP_STORAGE_KEY)
    return raw ? (JSON.parse(raw) as SignupDraft) : null
  } catch {
    return null
  }
}

export function clearSignupDraft() {
  sessionStorage.removeItem(SIGNUP_STORAGE_KEY)
}
