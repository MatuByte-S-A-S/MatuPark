<script setup lang="ts">
import { onMounted, onUnmounted } from 'vue'
import { RouterLink } from 'vue-router'
import MarketingLayout from '@/layouts/MarketingLayout.vue'
import AppButton from '@/components/ui/AppButton.vue'
import AppIcon from '@/components/ui/AppIcon.vue'
import { usePageSeo } from '@/composables/usePageSeo'
import {
  APP_COMPANY,
  APP_COMPANY_URL,
  APP_DESCRIPTION,
  APP_FULL_TITLE,
  APP_KEYWORDS,
  APP_LOGO,
  APP_NAME,
} from '@/constants/branding'
import { MONTHLY_PRICE, SUBSCRIPTION_PLANS } from '@/constants/plans'
import { formatCurrencyValue } from '@/utils/currency'

const appUrl = import.meta.env.VITE_APP_URL || (typeof window !== 'undefined' ? window.location.origin : '')

usePageSeo({
  title: APP_FULL_TITLE,
  description: APP_DESCRIPTION,
  url: appUrl,
  image: `${appUrl}${APP_LOGO}`,
  type: 'website',
})

const problems = [
  {
    title: 'Cuadernos y Excel que no cuadran',
    text: 'Pierdes tiempo cuadrando caja a mano y aún así quedan dudas al cierre del turno.',
  },
  {
    title: 'No sabes cuántos cupos quedan',
    text: 'Los clientes preguntan y tu equipo responde a ojo. Eso genera filas, errores y mal clima.',
  },
  {
    title: 'Salidas lentas en hora pico',
    text: 'Buscar placas, calcular tarifas y cobrar en efectivo frena la operación cuando más lo necesitas.',
  },
]

const benefits = [
  {
    icon: 'parking' as const,
    title: 'Aforo en vivo',
    text: 'Ve cupos libres de carros y motos al instante. Tu equipo y tus clientes saben qué hay disponible.',
  },
  {
    icon: 'ticket' as const,
    title: 'Ingreso y salida ágiles',
    text: 'Registra vehículos en segundos, con tickets QR y cola en segundo plano para no detener la operación.',
  },
  {
    icon: 'wallet' as const,
    title: 'Caja bajo control',
    text: 'Apertura, cierre, movimientos y cobros vinculados. Sabes cuánto entró y cuánto debería haber.',
  },
  {
    icon: 'chart-bar' as const,
    title: 'Reportes claros',
    text: 'Ingresos, ocupación y movimientos exportables. Decisiones con datos, no con suposiciones.',
  },
  {
    icon: 'users' as const,
    title: 'Equipo organizado',
    text: 'Administradores y operadores con roles definidos. Cada quien hace lo suyo, sin mezclar permisos.',
  },
  {
    icon: 'smartphone' as const,
    title: 'Desde cualquier dispositivo',
    text: 'Funciona en el navegador. Sin instalar apps complicadas ni comprar equipos costosos.',
  },
]

const steps = [
  {
    n: '01',
    title: 'Crea tu cuenta',
    text: 'Regístrate, elige tu plan y configura tu parqueadero en minutos. Te acompañamos desde el inicio.',
  },
  {
    n: '02',
    title: 'Configura tarifas y cupos',
    text: 'Define capacidad, precios por hora o día, tolerancia y moneda. Tu reglas, tu negocio.',
  },
  {
    n: '03',
    title: 'Opera el día a día',
    text: 'Ingresos, salidas, cobros y aforo en una sola pantalla. Tu equipo trabaja con confianza.',
  },
  {
    n: '04',
    title: 'Cierra y mejora',
    text: 'Revisa reportes, cuadra caja y toma decisiones para crecer con tranquilidad.',
  },
]

const tips = [
  {
    tag: 'Operación',
    title: '5 señales de que tu parqueadero necesita software hoy',
    excerpt:
      'Filas largas, caja que no cuadra y clientes molestos no son “parte del negocio”. Son síntomas de falta de control.',
  },
  {
    tag: 'Clientes',
    title: 'Cómo el aforo en vivo mejora la experiencia',
    excerpt:
      'Cuando el cliente sabe que hay cupo antes de entrar, confía en ti. Eso se traduce en lealtad y recomendaciones.',
  },
  {
    tag: 'Finanzas',
    title: 'Cierre de caja sin sudor frío',
    excerpt:
      'Un turno bien registrado termina en minutos. Un turno en cuaderno termina en discusión. La diferencia es sistema.',
  },
]

const audiences = [
  'Parqueaderos independientes en barrios y zonas comerciales',
  'Edificios residenciales y conjuntos con visitantes frecuentes',
  'Centros comerciales y locales que necesitan control por turno',
  'Emprendedores que quieren profesionalizar su operación sin complicarse',
]

const faqs = [
  {
    q: '¿Qué es MatuPark?',
    a: 'MatuPark es software en la nube para administrar parqueaderos: ingresos, salidas, aforo, caja y reportes. Es un producto de MatuByte S.A.S.',
  },
  {
    q: '¿Para quién está pensado?',
    a: 'Para dueños y administradores de parqueaderos en Colombia que quieren orden, control y una operación más amable con clientes y equipo.',
  },
  {
    q: '¿Necesito instalar algo?',
    a: 'No. Funciona en el navegador desde celular, tablet o computador. Solo necesitas internet.',
  },
  {
    q: '¿Quién desarrolla MatuPark?',
    a: `MatuPark es desarrollado por ${APP_COMPANY} (matubyte.com). Software colombiano para negocios que quieren crecer con orden.`,
  },
]

let jsonLdScript: HTMLScriptElement | null = null

onMounted(() => {
  setMetaKeywords(APP_KEYWORDS)

  const schema = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'SoftwareApplication',
        name: APP_NAME,
        applicationCategory: 'BusinessApplication',
        operatingSystem: 'Web',
        description: APP_DESCRIPTION,
        offers: {
          '@type': 'Offer',
          price: MONTHLY_PRICE,
          priceCurrency: 'COP',
        },
        provider: {
          '@type': 'Organization',
          name: APP_COMPANY,
          url: APP_COMPANY_URL,
        },
      },
      {
        '@type': 'Organization',
        name: APP_COMPANY,
        url: APP_COMPANY_URL,
        sameAs: [APP_COMPANY_URL],
      },
    ],
  }

  jsonLdScript = document.createElement('script')
  jsonLdScript.type = 'application/ld+json'
  jsonLdScript.textContent = JSON.stringify(schema)
  document.head.appendChild(jsonLdScript)
})

onUnmounted(() => {
  jsonLdScript?.remove()
})

function setMetaKeywords(content: string) {
  let el = document.querySelector('meta[name="keywords"]') as HTMLMetaElement | null
  if (!el) {
    el = document.createElement('meta')
    el.name = 'keywords'
    document.head.appendChild(el)
  }
  el.content = content
}
</script>

<template>
  <MarketingLayout>
    <!-- Hero -->
    <section class="relative overflow-hidden">
      <div
        class="pointer-events-none absolute -left-32 top-0 h-96 w-96 rounded-full bg-lime/30 blur-3xl motion-safe:animate-pulse"
        aria-hidden="true"
      />
      <div
        class="pointer-events-none absolute -right-24 bottom-0 h-80 w-80 rounded-full bg-ink/5 blur-3xl"
        aria-hidden="true"
      />

      <div class="relative mx-auto max-w-6xl px-4 py-16 sm:px-6 sm:py-20 lg:px-8 lg:py-28">
        <div class="grid items-center gap-12 lg:grid-cols-2">
          <div class="motion-safe:animate-[fadeUp_0.7s_ease-out]">
            <span class="inline-flex items-center gap-2 rounded-full bg-lime/30 px-4 py-1.5 text-xs font-bold uppercase tracking-wide text-ink">
              <span class="h-2 w-2 rounded-full bg-lime shadow-[0_0_8px_#d7ee46]" />
              Hecho en Colombia · {{ APP_COMPANY }}
            </span>
            <h1 class="mt-6 text-4xl font-bold leading-[1.1] tracking-tight text-ink sm:text-5xl lg:text-[3.25rem]">
              Tu parqueadero merece
              <span class="text-ink/40"> calma, control </span>
              y confianza
            </h1>
            <p class="mt-6 max-w-xl text-lg leading-relaxed text-muted">
              <strong class="font-semibold text-ink">{{ APP_NAME }}</strong> te ayuda a operar mejor
              antes de pedirte más. Organiza ingresos, salidas, aforo y caja con una herramienta
              cercana, clara y pensada para el día a día real.
            </p>
            <p class="mt-4 max-w-xl text-sm leading-relaxed text-muted">
              Desarrollado con compromiso por
              <a
                :href="APP_COMPANY_URL"
                target="_blank"
                rel="noopener noreferrer"
                class="font-semibold text-ink underline decoration-lime decoration-2 underline-offset-2 hover:text-ink/80"
              >{{ APP_COMPANY }}</a>.
            </p>

            <div class="mt-8 flex flex-wrap gap-3">
              <RouterLink to="/register">
                <AppButton variant="lime" size="lg" show-arrow>Empezar con MatuPark</AppButton>
              </RouterLink>
              <RouterLink to="/login">
                <AppButton variant="secondary" size="lg">Ya tengo cuenta</AppButton>
              </RouterLink>
            </div>

            <p class="mt-6 text-sm text-muted">
              Primero te damos claridad. Luego tú decides si quieres crecer con nosotros.
            </p>
          </div>

          <div class="relative motion-safe:animate-[fadeUp_0.9s_ease-out]">
            <div class="pp-detail-panel p-6 sm:p-8">
              <p class="text-xs font-bold uppercase tracking-widest text-lime/80">Panel en vivo</p>
              <p class="mt-2 text-2xl font-bold text-white">Todo bajo control</p>
              <div class="mt-6 grid grid-cols-2 gap-3">
                <div class="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                  <p class="text-3xl font-bold text-lime">24</p>
                  <p class="text-xs text-white/60">Cupos libres</p>
                </div>
                <div class="rounded-2xl bg-white/10 p-4 ring-1 ring-white/10">
                  <p class="text-3xl font-bold text-white">$847k</p>
                  <p class="text-xs text-white/60">Ingresos hoy</p>
                </div>
                <div class="col-span-2 rounded-2xl bg-lime/20 p-4 ring-1 ring-lime/30">
                  <p class="text-sm font-semibold text-lime">Operación fluida</p>
                  <p class="mt-1 text-xs text-white/70">
                    Ingresos y salidas en cola — tu equipo no se detiene
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>

    <!-- Problema -->
    <section class="border-y border-black/[0.04] bg-white py-16 sm:py-20" aria-labelledby="problema-heading">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="max-w-2xl">
          <p class="text-xs font-bold uppercase tracking-widest text-muted">El problema</p>
          <h2 id="problema-heading" class="mt-2 text-3xl font-bold text-ink sm:text-4xl">
            Administrar un parqueadero no debería sentirse como apagar incendios
          </h2>
          <p class="mt-4 text-muted">
            Sabemos lo que es llegar cansado al cierre y aún tener dudas. Por eso construimos
            {{ APP_NAME }}: para devolverte orden y tranquilidad.
          </p>
        </div>
        <div class="mt-10 grid gap-4 md:grid-cols-3">
          <article
            v-for="item in problems"
            :key="item.title"
            class="pp-card p-6 transition hover:-translate-y-0.5 hover:shadow-lg"
          >
            <h3 class="font-bold text-ink">{{ item.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-muted">{{ item.text }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Beneficios -->
    <section id="beneficios" class="py-16 sm:py-20" aria-labelledby="beneficios-heading">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <p class="text-xs font-bold uppercase tracking-widest text-muted">Beneficios</p>
          <h2 id="beneficios-heading" class="mt-2 text-3xl font-bold text-ink sm:text-4xl">
            Control real, sin complicarte la vida
          </h2>
          <p class="mx-auto mt-4 max-w-2xl text-muted">
            Cada función está pensada para ayudarte hoy — no para impresionarte con botones que no
            usarás.
          </p>
        </div>
        <div class="mt-12 grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          <article
            v-for="b in benefits"
            :key="b.title"
            class="pp-card group p-6 transition hover:ring-2 hover:ring-lime/40"
          >
            <span
              class="flex h-11 w-11 items-center justify-center rounded-2xl bg-lime/25 text-ink transition group-hover:bg-lime"
            >
              <AppIcon :name="b.icon" :size="20" />
            </span>
            <h3 class="mt-4 font-bold text-ink">{{ b.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-muted">{{ b.text }}</p>
          </article>
        </div>
      </div>
    </section>

    <!-- Cómo funciona -->
    <section
      id="como-funciona"
      class="border-y border-black/[0.04] bg-white py-16 sm:py-20"
      aria-labelledby="como-heading"
    >
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="max-w-2xl">
          <p class="text-xs font-bold uppercase tracking-widest text-muted">Cómo funciona</p>
          <h2 id="como-heading" class="mt-2 text-3xl font-bold text-ink sm:text-4xl">
            De cero a operando en cuatro pasos
          </h2>
        </div>
        <ol class="mt-12 grid gap-6 md:grid-cols-2 lg:grid-cols-4">
          <li v-for="step in steps" :key="step.n" class="relative">
            <span class="text-4xl font-black text-lime/40">{{ step.n }}</span>
            <h3 class="mt-2 text-lg font-bold text-ink">{{ step.title }}</h3>
            <p class="mt-2 text-sm leading-relaxed text-muted">{{ step.text }}</p>
          </li>
        </ol>
      </div>
    </section>

    <!-- Consejos / blog-style -->
    <section id="consejos" class="py-16 sm:py-20" aria-labelledby="consejos-heading">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="flex flex-wrap items-end justify-between gap-4">
          <div>
            <p class="text-xs font-bold uppercase tracking-widest text-muted">Consejos</p>
            <h2 id="consejos-heading" class="mt-2 text-3xl font-bold text-ink">
              Ideas para cuidar tu parqueadero
            </h2>
            <p class="mt-2 max-w-xl text-sm text-muted">
              Contenido práctico para ti y tu equipo — porque creemos en ayudarte antes de venderte.
            </p>
          </div>
        </div>
        <div class="mt-10 grid gap-6 md:grid-cols-3">
          <article
            v-for="tip in tips"
            :key="tip.title"
            class="pp-card flex flex-col overflow-hidden transition hover:-translate-y-1 hover:shadow-lg"
          >
            <div class="bg-ink px-5 py-3">
              <span class="text-xs font-bold uppercase tracking-wide text-lime">{{ tip.tag }}</span>
            </div>
            <div class="flex flex-1 flex-col p-5">
              <h3 class="font-bold leading-snug text-ink">{{ tip.title }}</h3>
              <p class="mt-3 flex-1 text-sm leading-relaxed text-muted">{{ tip.excerpt }}</p>
              <p class="mt-4 text-xs font-semibold text-ink/40">MatuPark · {{ APP_COMPANY }}</p>
            </div>
          </article>
        </div>
      </div>
    </section>

    <!-- Para quién -->
    <section class="border-y border-black/[0.04] bg-ink py-16 text-white sm:py-20" aria-labelledby="para-quien-heading">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <h2 id="para-quien-heading" class="text-3xl font-bold sm:text-4xl">¿Para quién es {{ APP_NAME }}?</h2>
        <p class="mt-4 max-w-2xl text-white/60">
          Si tienes un parqueadero y quieres hacer las cosas bien — con cariño por tu negocio y
          respeto por tu cliente — esta herramienta es para ti.
        </p>
        <ul class="mt-10 grid gap-3 sm:grid-cols-2">
          <li
            v-for="item in audiences"
            :key="item"
            class="flex items-start gap-3 rounded-2xl bg-white/5 p-4 ring-1 ring-white/10"
          >
            <span class="mt-0.5 flex h-6 w-6 shrink-0 items-center justify-center rounded-full bg-lime text-xs font-bold text-ink">✓</span>
            <span class="text-sm text-white/80">{{ item }}</span>
          </li>
        </ul>
      </div>
    </section>

    <!-- Precios -->
    <section id="precios" class="py-16 sm:py-20" aria-labelledby="precios-heading">
      <div class="mx-auto max-w-6xl px-4 sm:px-6 lg:px-8">
        <div class="text-center">
          <p class="text-xs font-bold uppercase tracking-widest text-muted">Precios transparentes</p>
          <h2 id="precios-heading" class="mt-2 text-3xl font-bold text-ink">
            Invierte en orden, no en caos
          </h2>
          <p class="mx-auto mt-4 max-w-xl text-muted">
            Planes claros desde {{ formatCurrencyValue(MONTHLY_PRICE) }}/mes. Tú eliges cuándo dar
            el siguiente paso — nosotros te acompañamos.
          </p>
        </div>
        <div class="mt-10 grid gap-4 md:grid-cols-3">
          <article
            v-for="plan in SUBSCRIPTION_PLANS"
            :key="plan.id"
            class="pp-card relative flex flex-col p-6"
            :class="plan.featured ? 'ring-2 ring-lime shadow-lg' : ''"
          >
            <span
              v-if="plan.badge"
              class="absolute -top-2.5 right-4 rounded-full bg-lime px-3 py-0.5 text-[10px] font-bold text-ink"
            >
              {{ plan.badge }}
            </span>
            <h3 class="text-lg font-bold text-ink">{{ plan.name }}</h3>
            <p class="mt-2 text-3xl font-bold text-ink">{{ formatCurrencyValue(plan.amount) }}</p>
            <p class="mt-1 text-xs text-muted">{{ plan.description }}</p>
            <RouterLink to="/register" class="mt-6">
              <AppButton class="w-full" :variant="plan.featured ? 'primary' : 'secondary'" show-arrow>
                Elegir {{ plan.name.toLowerCase() }}
              </AppButton>
            </RouterLink>
          </article>
        </div>
      </div>
    </section>

    <!-- FAQ + SEO -->
    <section class="border-t border-black/[0.04] bg-white py-16 sm:py-20" aria-labelledby="faq-heading">
      <div class="mx-auto max-w-3xl px-4 sm:px-6 lg:px-8">
        <h2 id="faq-heading" class="text-center text-3xl font-bold text-ink">Preguntas frecuentes</h2>
        <dl class="mt-10 space-y-6">
          <div v-for="faq in faqs" :key="faq.q" class="border-b border-black/[0.06] pb-6">
            <dt class="font-bold text-ink">{{ faq.q }}</dt>
            <dd class="mt-2 text-sm leading-relaxed text-muted">{{ faq.a }}</dd>
          </div>
        </dl>
      </div>
    </section>

    <!-- CTA final -->
    <section class="relative overflow-hidden bg-lime py-16 sm:py-20">
      <div class="relative mx-auto max-w-3xl px-4 text-center sm:px-6">
        <h2 class="text-3xl font-bold text-ink sm:text-4xl">
          Estamos contigo. Tu parqueadero puede ser diferente.
        </h2>
        <p class="mt-4 text-ink/70">
          Da el primer paso hoy. Configura, prueba y siente la diferencia de operar con claridad.
        </p>
        <div class="mt-8 flex flex-wrap justify-center gap-3">
          <RouterLink to="/register">
            <AppButton variant="primary" size="lg" show-arrow>Crear mi cuenta</AppButton>
          </RouterLink>
          <RouterLink to="/login">
            <AppButton variant="secondary" size="lg">Iniciar sesión</AppButton>
          </RouterLink>
        </div>
      </div>
    </section>
  </MarketingLayout>
</template>

<style scoped>
@keyframes fadeUp {
  from {
    opacity: 0;
    transform: translateY(16px);
  }
  to {
    opacity: 1;
    transform: translateY(0);
  }
}
</style>
