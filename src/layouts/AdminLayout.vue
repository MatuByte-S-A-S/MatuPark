<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref, watch } from 'vue'
import { useRoute, RouterLink } from 'vue-router'
import { useAuthStore } from '@/stores/auth'
import { useParkingStore } from '@/stores/parking'
import { useAdminBootstrap } from '@/composables/useAdminBootstrap'
import NavIcon from '@/components/layout/NavIcon.vue'
import CashHeaderWidget from '@/components/layout/CashHeaderWidget.vue'
import OperationQueuePanel from '@/components/layout/OperationQueuePanel.vue'
import AppLogo from '@/components/ui/AppLogo.vue'
import NotifyToast from '@/components/ui/NotifyToast.vue'
import PageLoader from '@/components/ui/PageLoader.vue'

import { APP_COMPANY, APP_NAME } from '@/constants/branding'

const auth = useAuthStore()
const parking = useParkingStore()
const route = useRoute()
const { ready: adminReady, ensureReady, teardown, reset } = useAdminBootstrap()

const mobileOpen = ref(false)
const mobileOpsOpen = ref(false)
const opsOpen = ref(false)
const opsRef = ref<HTMLElement | null>(null)

const canOperate = computed(() => auth.canAccess(['admin', 'operator']))

const operationsLinks = [
  { to: '/ingreso', label: 'Ingreso', icon: 'plus' as const },
  { to: '/salida', label: 'Salida', icon: 'exit' as const },
]

const navItems = computed(() => {
  const items = [
    { to: '/dashboard', label: 'Panel' },
    { to: '/aforo', label: 'Aforo', roles: ['admin', 'operator'] as const },
    { to: '/caja', label: 'Caja', roles: ['admin', 'operator'] as const },
    { to: '/reportes', label: 'Reportes', roles: ['admin'] as const },
    { to: '/configuracion', label: 'Ajustes', roles: ['admin'] as const },
    { to: '/usuarios', label: 'Usuarios', roles: ['admin'] as const },
  ]
  return items.filter((i) => !i.roles || auth.canAccess([...i.roles]))
})

const isOperationsActive = computed(() =>
  operationsLinks.some((link) => route.path === link.to)
)

function isActive(path: string) {
  return route.path === path
}

function closeOps() {
  opsOpen.value = false
}

function onDocClick(e: MouseEvent) {
  if (!opsRef.value?.contains(e.target as Node)) opsOpen.value = false
}

onMounted(() => {
  void ensureReady()
  document.addEventListener('click', onDocClick)
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

watch(
  () => route.path,
  () => {
    mobileOpen.value = false
    mobileOpsOpen.value = false
    opsOpen.value = false
  }
)

onUnmounted(() => {
  teardown()
  document.removeEventListener('click', onDocClick)
})

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

    <header class="sticky top-0 z-40 border-b border-black/[0.04] bg-white/90 backdrop-blur-xl">
      <div class="mx-auto flex h-16 max-w-[1400px] items-center gap-2 px-3 sm:gap-3 sm:px-4 lg:px-6">
        <RouterLink to="/dashboard" class="flex shrink-0 items-center">
          <AppLogo />
        </RouterLink>

        <!-- Nav desktop — sin scroll -->
        <nav class="pp-nav-shell mx-auto hidden min-w-0 flex-1 items-center justify-center overflow-visible lg:flex">
          <RouterLink
            v-for="item in navItems.slice(0, 1)"
            :key="item.to"
            :to="item.to"
            class="pp-nav-pill"
            :class="isActive(item.to) ? 'pp-nav-pill-active' : ''"
          >
            {{ item.label }}
          </RouterLink>

          <div
            v-if="canOperate"
            ref="opsRef"
            class="relative shrink-0"
            @mouseenter="opsOpen = true"
            @mouseleave="opsOpen = false"
          >
            <button
              type="button"
              class="pp-nav-pill inline-flex items-center gap-1"
              :class="isOperationsActive || opsOpen ? 'pp-nav-pill-active' : ''"
              aria-haspopup="true"
              :aria-expanded="opsOpen"
              @click.stop="opsOpen = !opsOpen"
            >
              Operación
              <svg
                class="h-3 w-3 transition"
                :class="opsOpen ? 'rotate-180' : ''"
                viewBox="0 0 20 20"
                fill="currentColor"
                aria-hidden="true"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>

            <div
              v-show="opsOpen"
              class="absolute left-1/2 top-full z-50 pt-1.5 -translate-x-1/2"
            >
              <div class="flex min-w-[9.5rem] flex-col gap-0.5 rounded-2xl bg-white p-1.5 shadow-lg ring-1 ring-black/[0.08]">
                <RouterLink
                  v-for="link in operationsLinks"
                  :key="link.to"
                  :to="link.to"
                  class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold transition hover:bg-[#eef0f2]"
                  :class="isActive(link.to) ? 'bg-ink text-white hover:bg-ink hover:text-white' : 'text-ink/70'"
                  @click="closeOps"
                >
                  <NavIcon :name="link.icon" class="!h-4 !w-4" />
                  {{ link.label }}
                </RouterLink>
              </div>
            </div>
          </div>

          <RouterLink
            v-for="item in navItems.slice(1)"
            :key="item.to"
            :to="item.to"
            class="pp-nav-pill"
            :class="isActive(item.to) ? 'pp-nav-pill-active' : ''"
          >
            {{ item.label }}
          </RouterLink>
        </nav>

        <button
          type="button"
          class="pp-icon-btn lg:hidden"
          aria-label="Menú"
          @click="mobileOpen = !mobileOpen"
        >
          <NavIcon name="menu" />
        </button>

        <div class="ml-auto flex shrink-0 items-center gap-1.5 sm:gap-2">
          <CashHeaderWidget v-if="canOperate" />

          <a
            v-if="parking.lot?.slug"
            :href="`/parking/${parking.lot.slug}`"
            target="_blank"
            class="hidden rounded-full bg-lime px-2.5 py-1.5 text-[11px] font-bold text-ink xl:inline-flex"
          >
            Landing
          </a>

          <RouterLink
            to="/cuenta"
            class="flex items-center gap-2 rounded-full bg-[#eef0f2] py-1 pl-1 pr-2.5 transition hover:ring-2 hover:ring-lime/50 sm:pr-3"
            :class="isActive('/cuenta') ? 'ring-2 ring-lime/60' : ''"
            title="Mi cuenta"
          >
            <span
              class="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-ink text-xs font-bold text-lime sm:h-9 sm:w-9"
            >
              {{ initials }}
            </span>
            <span class="hidden min-w-0 sm:block">
              <span class="block truncate text-sm font-bold leading-tight text-ink">{{ auth.profile?.full_name }}</span>
              <span class="block truncate text-[10px] capitalize text-muted">{{ auth.profile?.role }}</span>
            </span>
          </RouterLink>

          <button
            type="button"
            class="pp-icon-btn !h-8 !w-8 sm:!h-9 sm:!w-9"
            title="Cerrar sesión"
            @click="auth.logout(); $router.push('/login')"
          >
            <NavIcon name="logout" class="!h-4 !w-4" />
          </button>
        </div>
      </div>

      <!-- Mobile nav -->
      <div v-if="mobileOpen" class="border-t border-black/[0.04] px-3 py-2 lg:hidden">
        <nav class="flex flex-col gap-1.5">
          <RouterLink
            v-for="item in navItems"
            :key="item.to"
            :to="item.to"
            class="pp-nav-pill"
            :class="isActive(item.to) ? 'pp-nav-pill-active' : 'bg-white'"
            @click="mobileOpen = false"
          >
            {{ item.label }}
          </RouterLink>

          <div v-if="canOperate" class="rounded-2xl bg-white p-1 ring-1 ring-black/[0.06]">
            <button
              type="button"
              class="flex w-full items-center justify-between rounded-xl px-3 py-2 text-sm font-semibold text-ink"
              @click="mobileOpsOpen = !mobileOpsOpen"
            >
              Operación
              <svg
                class="h-4 w-4 transition"
                :class="mobileOpsOpen ? 'rotate-180' : ''"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fill-rule="evenodd"
                  d="M5.23 7.21a.75.75 0 011.06.02L10 11.168l3.71-3.938a.75.75 0 111.08 1.04l-4.24 4.5a.75.75 0 01-1.08 0l-4.24-4.5a.75.75 0 01.02-1.06z"
                  clip-rule="evenodd"
                />
              </svg>
            </button>
            <div v-if="mobileOpsOpen" class="flex flex-col gap-0.5 px-1 pb-1">
              <RouterLink
                v-for="link in operationsLinks"
                :key="link.to"
                :to="link.to"
                class="flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-semibold"
                :class="isActive(link.to) ? 'bg-ink text-white' : 'text-ink/70 hover:bg-[#eef0f2]'"
                @click="mobileOpen = false; mobileOpsOpen = false"
              >
                <NavIcon :name="link.icon" class="!h-4 !w-4" />
                {{ link.label }}
              </RouterLink>
            </div>
          </div>

          <RouterLink
            to="/cuenta"
            class="pp-nav-pill bg-white"
            :class="isActive('/cuenta') ? 'pp-nav-pill-active' : ''"
            @click="mobileOpen = false"
          >
            Mi cuenta
          </RouterLink>
        </nav>
      </div>
    </header>

    <main class="mx-auto w-full max-w-[1400px] flex-1 px-3 py-3 sm:px-4 sm:py-4 lg:px-6">
      <PageLoader v-if="!adminReady" label="Preparando tu sesión…" />
      <RouterView v-else v-slot="{ Component }">
        <KeepAlive :max="6">
          <component :is="Component" />
        </KeepAlive>
      </RouterView>
    </main>

    <footer class="border-t border-black/[0.04] bg-white py-3 text-center text-xs text-muted">
      Powered by <strong class="text-ink">{{ APP_NAME }}</strong> of <strong class="text-ink">{{ APP_COMPANY }}</strong>
    </footer>
  </div>
</template>
