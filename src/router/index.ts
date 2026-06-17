import { createRouter, createWebHistory } from 'vue-router'
import { useAuthStore } from '@/stores/auth'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('@/views/auth/LoginView.vue'),
      meta: { public: true, guestOnly: true },
    },
    {
      path: '/register',
      name: 'register',
      component: () => import('@/views/auth/RegisterView.vue'),
      meta: { public: true, guestOnly: true },
    },
    {
      path: '/register/pago-resultado',
      name: 'register-payment-result',
      component: () => import('@/views/auth/RegisterPaymentResultView.vue'),
      meta: { public: true, guestOnly: true },
    },
    {
      path: '/ticket/:code',
      name: 'public-ticket',
      component: () => import('@/views/public/TicketPublicView.vue'),
      meta: { public: true, layout: 'public' },
    },
    {
      path: '/parking/:slug',
      name: 'public-landing',
      component: () => import('@/views/public/LandingView.vue'),
      meta: { public: true, layout: 'public' },
    },
    {
      path: '/',
      component: () => import('@/layouts/AdminLayout.vue'),
      meta: { requiresAuth: true },
      children: [
        { path: '', redirect: '/dashboard' },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('@/views/admin/DashboardView.vue'),
        },
        {
          path: 'ingreso',
          name: 'ingreso',
          component: () => import('@/views/admin/EntryView.vue'),
          meta: { roles: ['admin', 'operator'] },
        },
        {
          path: 'salida',
          name: 'salida',
          component: () => import('@/views/admin/ExitView.vue'),
          meta: { roles: ['admin', 'operator'] },
        },
        {
          path: 'aforo',
          name: 'aforo',
          component: () => import('@/views/admin/OccupancyView.vue'),
          meta: { roles: ['admin', 'operator'] },
        },
        {
          path: 'configuracion',
          name: 'configuracion',
          component: () => import('@/views/admin/SettingsView.vue'),
          meta: { roles: ['admin'] },
        },
        {
          path: 'usuarios',
          name: 'usuarios',
          component: () => import('@/views/admin/UsersView.vue'),
          meta: { roles: ['admin'] },
        },
        {
          path: 'caja',
          name: 'caja',
          component: () => import('@/views/admin/CashView.vue'),
          meta: { roles: ['admin', 'operator'] },
        },
        {
          path: 'reportes',
          name: 'reportes',
          component: () => import('@/views/admin/ReportsView.vue'),
          meta: { roles: ['admin'] },
        },
        {
          path: 'premium',
          name: 'premium',
          component: () => import('@/views/admin/PremiumView.vue'),
          meta: { roles: ['admin'] },
        },
        {
          path: 'premium/pago-resultado',
          name: 'payment-result',
          component: () => import('@/views/admin/PaymentResultView.vue'),
          meta: { roles: ['admin'] },
        },
      ],
    },
    {
      path: '/:pathMatch(.*)*',
      name: 'not-found',
      component: () => import('@/views/NotFoundView.vue'),
      meta: { public: true },
    },
  ],
})

router.beforeEach(async (to) => {
  const auth = useAuthStore()
  if (!auth.ready) await auth.init()

  if (to.meta.public) {
    if (to.meta.guestOnly && auth.isAuthenticated) return '/dashboard'
    return true
  }

  if (to.meta.requiresAuth && !auth.isAuthenticated) {
    return { name: 'login', query: { redirect: to.fullPath } }
  }

  const roles = to.meta.roles as string[] | undefined
  if (roles && auth.profile && !roles.includes(auth.profile.role)) {
    return '/dashboard'
  }

  return true
})

export default router
