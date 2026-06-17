<script setup lang="ts">
import AppIcon from '@/components/ui/AppIcon.vue'
import type { IconName } from '@/types/icons'

const items: { icon: IconName; title: string; desc: string }[] = [
  { icon: 'camera', title: 'Reconocimiento de placas', desc: 'LPR con cámaras' },
  { icon: 'building', title: 'Multi-sucursal', desc: 'Varias sedes centralizadas' },
  { icon: 'parking', title: 'Multi-parqueadero', desc: 'Varios lots por tenant' },
]
</script>

<template>
  <div class="mx-auto max-w-3xl space-y-6">
    <p class="text-sm text-muted">Módulos preparados para próximas versiones</p>

    <div class="grid gap-4 md:grid-cols-3">
      <div
        v-for="item in items"
        :key="item.title"
        class="pp-card border-2 border-dashed border-lime/60 p-6"
      >
        <div class="flex h-12 w-12 items-center justify-center rounded-2xl bg-lime/20 text-ink">
          <AppIcon :name="item.icon" :size="24" />
        </div>
        <h3 class="mt-3 font-bold text-ink">{{ item.title }}</h3>
        <p class="mt-2 text-sm text-muted">{{ item.desc }}</p>
        <span class="pp-badge-lime mt-4">Próximamente</span>
      </div>
    </div>
  </div>
</template>
