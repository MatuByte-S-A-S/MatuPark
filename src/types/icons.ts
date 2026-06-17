import type { Component } from 'vue'
import {
  Banknote,
  BarChart3,
  Bike,
  Building2,
  Camera,
  Car,
  CircleParking,
  CreditCard,
  Landmark,
  LayoutGrid,
  MoreHorizontal,
  Search,
  Smartphone,
  Ticket,
  TrendingUp,
  Users,
  Wallet,
} from '@lucide/vue'

export const iconMap = {
  banknote: Banknote,
  car: Car,
  bike: Bike,
  'chart-bar': BarChart3,
  ticket: Ticket,
  parking: CircleParking,
  'credit-card': CreditCard,
  landmark: Landmark,
  smartphone: Smartphone,
  wallet: Wallet,
  more: MoreHorizontal,
  building: Building2,
  camera: Camera,
  users: Users,
  trending: TrendingUp,
  grid: LayoutGrid,
  search: Search,
} as const satisfies Record<string, Component>

export type IconName = keyof typeof iconMap
