<script setup lang="ts">
import { RouterLink } from 'vue-router'
import AppLogo from '@/components/ui/AppLogo.vue'
import AppButton from '@/components/ui/AppButton.vue'
import { APP_COMPANY, APP_COMPANY_URL, APP_NAME } from '@/constants/branding'

const navLinks = [
  { href: '#beneficios', label: 'Beneficios' },
  { href: '#como-funciona', label: 'Cómo funciona' },
  { href: '#consejos', label: 'Consejos' },
  { href: '#precios', label: 'Precios' },
]
</script>

<template>
  <div class="min-h-screen bg-[#eef0f2] text-ink">
    <header class="sticky top-0 z-40 border-b border-black/[0.04] bg-white/90 backdrop-blur-xl">
      <div class="mx-auto flex h-16 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 lg:px-8">
        <RouterLink to="/" class="shrink-0" aria-label="MatuPark inicio">
          <AppLogo />
        </RouterLink>

        <nav class="hidden items-center gap-1 md:flex" aria-label="Secciones">
          <a
            v-for="link in navLinks"
            :key="link.href"
            :href="link.href"
            class="rounded-full px-3 py-2 text-sm font-semibold text-ink/60 transition hover:bg-[#eef0f2] hover:text-ink"
          >
            {{ link.label }}
          </a>
        </nav>

        <div class="flex shrink-0 items-center gap-2">
          <RouterLink
            to="/login"
            class="hidden rounded-full px-4 py-2 text-sm font-semibold text-ink/70 transition hover:text-ink sm:inline-flex"
          >
            Iniciar sesión
          </RouterLink>
          <RouterLink to="/register">
            <AppButton size="sm" show-arrow>Crear cuenta</AppButton>
          </RouterLink>
        </div>
      </div>
    </header>

    <main>
      <slot />
    </main>

    <footer class="border-t border-black/[0.06] bg-ink text-white">
      <div class="mx-auto max-w-6xl px-4 py-12 sm:px-6 lg:px-8">
        <div class="grid gap-10 md:grid-cols-3">
          <div>
            <AppLogo name-class="font-bold text-white" always-show-name />
            <p class="mt-4 max-w-xs text-sm text-white/60">
              Software hecho con dedicación en Colombia para dueños de parqueaderos que quieren
              orden, control y tranquilidad en su operación diaria.
            </p>
          </div>
          <div>
            <p class="text-xs font-bold uppercase tracking-widest text-lime">Producto</p>
            <ul class="mt-4 space-y-2 text-sm text-white/70">
              <li><a href="#beneficios" class="hover:text-lime">Beneficios</a></li>
              <li><a href="#como-funciona" class="hover:text-lime">Cómo funciona</a></li>
              <li><a href="#precios" class="hover:text-lime">Planes</a></li>
              <li><RouterLink to="/register" class="hover:text-lime">Crear cuenta</RouterLink></li>
            </ul>
          </div>
          <div>
            <p class="text-xs font-bold uppercase tracking-widest text-lime">Desarrollado por</p>
            <p class="mt-4 text-sm text-white/70">
              <a
                :href="APP_COMPANY_URL"
                target="_blank"
                rel="noopener noreferrer"
                class="font-semibold text-white underline decoration-lime/50 underline-offset-4 hover:text-lime"
              >
                {{ APP_COMPANY }}
              </a>
              — tecnología confiable para negocios reales.
            </p>
            <a
              :href="APP_COMPANY_URL"
              target="_blank"
              rel="noopener noreferrer"
              class="mt-3 inline-flex text-sm font-semibold text-lime hover:underline"
            >
              matubyte.com →
            </a>
          </div>
        </div>
        <div class="mt-10 border-t border-white/10 pt-6 text-center text-xs text-white/40">
          © {{ new Date().getFullYear() }} {{ APP_NAME }} · producto de
          <a :href="APP_COMPANY_URL" class="text-white/60 hover:text-lime">{{ APP_COMPANY }}</a>
        </div>
      </div>
    </footer>
  </div>
</template>
