<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useParkingStore } from '@/stores/parking'
import { useAdminBootstrap } from '@/composables/useAdminBootstrap'
import { useSubscriptionStore } from '@/stores/subscription'
import NavIcon from '@/components/layout/NavIcon.vue'
import CashHeaderWidget from '@/components/layout/CashHeaderWidget.vue'
import OperationQueuePanel from '@/components/layout/OperationQueuePanel.vue'
import AppLogo from '@/components/ui/AppLogo.vue'
import NotifyToast from '@/components/ui/NotifyToast.vue'
import PageLoader from '@/components/ui/PageLoader.vue'

import { APP_COMPANY, APP_NAME } from '@/constants/branding'

const auth = useAuthStore()
const parking = useParkingStore()
const subscription = useSubscriptionStore()
const route = useRoute()
const { ready: adminReady, ensureReady, teardown, reset } = useAdminBootstrap()

const mobileOpen = ref(false)

const navItems = computed(() => {
  const items = [
    { to: '/dashboard', label: 'Panel', icon: 'home' },
    { to: '/ingreso', label: 'Ingreso', icon: 'plus', roles: ['admin', 'operator'] as const },
    { to: '/salida', label: 'Salida', icon: 'exit', roles: ['admin', 'operator'] as const },
    { to: '/aforo', label: 'Aforo', icon: 'parking', roles: ['admin', 'operator'] as const },
    { to: '/caja', label: 'Caja', icon: 'cash', roles: ['admin', 'operator'] as const },
    { to: '/reportes', label: 'Reportes', icon: 'chart', roles: ['admin'] as const },
    { to: '/premium', label: 'Plan', icon: 'star', roles: ['admin'] as const },
    { to: '/configuracion', label: 'Ajustes', icon: 'settings', roles: ['admin'] as const },
    { to: '/usuarios', label: 'Usuarios', icon: 'users', roles: ['admin'] as const },
  ]
  return items.filter((i) => !i.roles || auth.canAccess([...i.roles]))
})

const pageTitle = computed(() => {
  if (route.path.startsWith('/premium/pago-resultado')) return 'Resultado de pago'
  if (route.path === '/premium') return 'Plan MatuPark'
  const item = navItems.value.find((i) => i.to === route.path)
  return item?.label ?? 'Panel'
})

const showSubscriptionBanner = computed(() => {
  if (!auth.isAdmin || !subscription.current) return false
  if (!subscription.isActive) return true
  return subscription.daysLeft !== null && subscription.daysLeft <= 7
})

function isActive(path: string) {
  return route.path === path
}

onMounted(() => {
  void ensureReady()
  if (auth.parkingLotId && auth.isAdmin) {
    void subscription.load(auth.parkingLotId)
  }
})

watch(
  () => auth.parkingLotId,
  (id, prev) => {
    if (id && id !== prev) {
      reset()
      void ensureReady(true)
    }
  }
)

onUnmounted(() => teardown())

const initials = computed(() => {
  const name = auth.profile?.full_name ?? '?'
  return name
    .split(' ')
    .map((w) => w[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()
})
</script>

<template>
  <div class="flex min-h-screen flex-col bg-[#eef0f2]">
    <NotifyToast />
    <OperationQueuePanel />

    <!-- Header estilo Parkzone -->
    <header class="sticky top-0 z-40 border-b border-black/[0.04] bg-white/90 backdrop-blur-xl">
      <div class="mx-auto flex h-[4.25rem] max-w-[1400px] items-center gap-4 px-4 lg:px-8">
        <!-- Logo -->
        <RouterLink to="/dashboard" class="flex shrink-0 items-center">
          <AppLogo />
        </RouterLink>

        <!-- Nav pills desktop -->
        <nav class="pp-nav-shell mx-auto hidden max-w-2xl flex-1 overflow-x-auto lg:flex">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="pp-nav-pill"
            :class="isActive(item.to) ? 'pp-nav-pill-active' : ''"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <!-- Mobile menu btn -->
        <button
          type="button"
          class="pp-icon-btn lg:hidden"
          aria-label="Menú"
          @click="mobileOpen = !mobileOpen"
        >
          <NavIcon name="menu" />
        </button>

        <!-- User area -->
        <div class="ml-auto flex shrink-0 items-center gap-2 sm:gap-3">
          <CashHeaderWidget v-if="auth.canAccess(['admin', 'operator'])" />

          <span class="pp-live-dot hidden text-xs font-semibold text-muted md:inline">En vivo</span>

          <a
            v-if="parking.lot?.slug"
            :href="`/parking/${parking.lot.slug}`"
            target="_blank"
            class="hidden rounded-full bg-lime px-3 py-2 text-xs font-bold text-ink sm:inline-flex"
          >
            Landing
          </a>

          <div class="flex items-center gap-2 rounded-full bg-[#eef0f2] py-1.5 pl-1.5 pr-3">
            <span
              class="flex h-9 w-9 items-center justify-center rounded-full bg-ink text-xs font-bold text-lime"
            >
              {{ initials }}
            </span>
            <div class="hidden min-w-0 sm:block">
              <p class="truncate text-sm font-bold leading-tight text-ink">{{ auth.profile?.full_name }}</p>
              <p class="truncate text-[10px] capitalize text-muted">{{ auth.profile?.role }}</p>
            </div>
          </div>

          <button
            type="button"
            class="pp-icon-btn !h-9 !w-9"
            title="Cerrar sesión"
            @click="auth.logout(); $router.push('/login')"
          >
            <NavIcon name="logout" class="!h-4 !w-4" />
          </button>
        </div>
      </div>

      <!-- Mobile nav scroll -->
      <div v-if="mobileOpen" class="border-t border-black/[0.04] px-4 py-3 lg:hidden">
        <nav class="flex gap-2 overflow-x-auto pb-1">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="pp-nav-pill whitespace-nowrap"
            :class="isActive(item.to) ? 'pp-nav-pill-active' : 'bg-white'"
            @click="mobileOpen = false"
          >
            {{ item.label }}
          </RouterLink>
        </nav>
      </div>
    </header>

    <!-- Breadcrumb + title -->
    <div class="mx-auto w-full max-w-[1400px] px-4 pt-5 lg:px-8">
      <p class="text-xs font-medium text-muted">
        {{ parking.lot?.name || 'Parqueadero' }} / {{ pageTitle }}
      </p>

      <RouterLink
        v-if="showSubscriptionBanner"
        to="/premium"
        class="mt-3 flex items-center justify-between gap-3 rounded-2xl px-4 py-3 text-sm font-semibold transition hover:opacity-90"
        :class="subscription.isActive ? 'bg-amber-50 text-amber-900 ring-1 ring-amber-200' : 'bg-red-50 text-red-800 ring-1 ring-red-200'"
      >
        <span>
          {{ subscription.isActive ? `Tu plan vence en ${subscription.daysLeft} días` : 'Tu plan MatuPark venció' }}
          — renueva para seguir operando
        </span>
        <span class="shrink-0 underline">Ver planes</span>
      </RouterLink>
    </div>

    <main class="mx-auto w-full max-w-[1400px] flex-1 px-4 py-5 lg:px-8 lg:py-6">
      <PageLoader v-if="!adminReady" label="Preparando tu sesión…" />
      <RouterView v-else v-slot="{ Component }">
        <KeepAlive :max="6">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>

    <footer class="border-t border-black/[0.04] bg-white py-4 text-center text-xs text-muted">
      Powered by <strong class="text-ink">{{ APP_NAME }}</strong> of <strong class="text-ink">{{ APP_COMPANY }}</strong>
    </footer>
  </div>
</template>
