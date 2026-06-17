export type UserRole = 'admin' | 'operator'

export type VehicleType = 'car' | 'moto'

export type TicketStatus = 'ACTIVE' | 'FINALIZED'

export type BillingMode = 'full_hour' | 'proportional'

export type PaymentMethod = 'cash' | 'card' | 'transfer' | 'nequi' | 'daviplata' | 'other'

export type CashSessionStatus = 'OPEN' | 'CLOSED'

export type CashMovementType = 'income' | 'expense' | 'adjustment'

export interface UserProfile {
  id: string
  email: string
  full_name: string
  role: UserRole
  parking_lot_id: string | null
  created_at?: string
}

export interface ParkingLot {
  id: string
  slug: string
  name: string
  address: string
  phone: string
  nit: string
  logo_url: string | null
  is_open: boolean
  schedule: string
  created_at?: string
}

export interface Settings {
  id: string
  parking_lot_id: string
  max_cars: number
  max_motos: number
  rate_car_hour: number
  rate_moto_hour: number
  rate_car_day: number | null
  rate_moto_day: number | null
  tolerance_minutes: number
  billing_mode: BillingMode
  currency_code?: string
  currency_locale?: string
  updated_at?: string
}

export interface Vehicle {
  id: string
  plate: string
  type: VehicleType
  parking_lot_id: string
}

export interface Ticket {
  id: string
  code: string
  plate: string
  vehicle_type: VehicleType
  parking_lot_id: string
  entry_at: string
  exit_at: string | null
  status: TicketStatus
  observations: string | null
  amount_paid: number | null
  created_at?: string
}

export interface Payment {
  id: string
  ticket_id: string
  parking_lot_id: string
  amount: number
  method: PaymentMethod | string
  paid_at: string
  cash_session_id?: string | null
  created_by?: string | null
  notes?: string | null
}

export interface CashSession {
  id: string
  parking_lot_id: string
  opened_by: string | null
  closed_by: string | null
  opening_amount: number
  closing_amount: number | null
  expected_amount: number | null
  status: CashSessionStatus
  opened_at: string
  closed_at: string | null
  notes: string | null
}

export interface CashMovement {
  id: string
  parking_lot_id: string
  cash_session_id: string | null
  type: CashMovementType
  category: string | null
  description: string | null
  amount: number
  payment_method: PaymentMethod | string | null
  reference_id: string | null
  created_by: string | null
  created_at: string
}

export interface SessionPaymentDetail {
  id: string
  amount: number
  method: string
  paid_at: string
  ticket_id: string
  plate: string
  ticket_code: string
  vehicle_type: VehicleType
}

export type CashLedgerKind = 'opening' | 'payment' | 'expense' | 'income' | 'adjustment'

export interface CashLedgerEntry {
  id: string
  kind: CashLedgerKind
  at: string
  concept: string
  detail: string
  method: string
  amount: number
  sign: 'in' | 'out' | 'neutral'
  vehicle_type?: VehicleType
}

export interface ReportSnapshot {
  id: string
  parking_lot_id: string
  period_start: string
  period_end: string
  total_income: number
  vehicles_served: number
  cars_count: number
  motos_count: number
  daily_average: number
  created_at?: string
}

export interface DashboardStats {
  activeCars: number
  activeMotos: number
  availableCars: number
  availableMotos: number
  todayIncome: number
  todayVehicles: number
}

export type SubscriptionStatus = 'pending' | 'active' | 'expired' | 'cancelled'

export interface Subscription {
  id: string
  parking_lot_id: string
  plan_id: string
  status: SubscriptionStatus
  payment_reference: string | null
  amount: number | null
  currency: string
  link_id: string | null
  transaction_id: string | null
  starts_at: string | null
  expires_at: string | null
  paid_at: string | null
  created_at?: string
  updated_at?: string
}

export interface OccupancyLevel {
  level: 'high' | 'medium' | 'low' | 'full'
  label: string
  color: string
}
