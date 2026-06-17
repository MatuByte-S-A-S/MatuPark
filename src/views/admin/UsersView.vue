<script setup lang="ts">
import { onMounted, ref, computed } from 'vue'
import { matudb } from '@/lib/matudb'
import { useAuthStore } from '@/stores/auth'
import { useNotify } from '@/composables/useNotify'
import type { UserProfile, UserRole } from '@/types'
import AppButton from '@/components/ui/AppButton.vue'
import AppInput from '@/components/ui/AppInput.vue'
import AppSelect from '@/components/ui/AppSelect.vue'
import AppModal from '@/components/ui/AppModal.vue'
import PageLoader from '@/components/ui/PageLoader.vue'

const auth = useAuthStore()
const notify = useNotify()

const users = ref<UserProfile[]>([])
const modalOpen = ref(false)
const email = ref('')
const fullName = ref('')
const password = ref('')
const role = ref<UserRole>('operator')
const saving = ref(false)
const ready = ref(false)

const sortedUsers = computed(() => {
  const me = auth.profile?.id
  return [...users.value].sort((a, b) => {
    if (a.id === me) return -1
    if (b.id === me) return 1
    return 0
  })
})

async function load() {
  if (!auth.parkingLotId) return
  const { data } = await matudb
    .from('users')
    .select('*')
    .eq('parking_lot_id', auth.parkingLotId)
    .order('created_at', { ascending: false })
  users.value = (data as UserProfile[]) ?? []
}

onMounted(async () => {
  await load()
  ready.value = true
})

async function invite() {
  saving.value = true
  const { data: signUpData, error } = await matudb.auth.signUp({
    email: email.value,
    password: password.value,
    options: { data: { name: fullName.value.trim() } },
  })

  if (error || !signUpData.user?.id) {
    saving.value = false
    notify.error('No se creó el usuario', error?.message)
    return
  }

  const { error: profileErr } = await matudb.from('users').insert({
    id: signUpData.user.id,
    email: email.value,
    full_name: fullName.value.trim(),
    role: role.value,
    parking_lot_id: auth.parkingLotId,
  })

  saving.value = false

  if (profileErr) {
    notify.error('Error en perfil', profileErr.message)
    return
  }

  email.value = ''
  fullName.value = ''
  password.value = ''
  role.value = 'operator'
  modalOpen.value = false
  await load()
  notify.success('Usuario creado')
}
</script>

<template>
  <PageLoader v-if="!ready" label="Cargando usuarios…" />

  <div v-else class="relative pb-24">
    <div class="pp-card overflow-hidden">
      <table class="w-full text-left text-sm">
        <thead class="bg-surface/80 text-xs font-semibold uppercase tracking-wide text-muted">
          <tr>
            <th class="px-5 py-4">Nombre</th>
            <th class="px-5 py-4">Correo</th>
            <th class="px-5 py-4">Rol</th>
          </tr>
        </thead>
        <tbody>
          <tr
            v-for="u in sortedUsers"
            :key="u.id"
            class="border-t border-surface transition hover:bg-surface/40"
            :class="u.id === auth.profile?.id ? 'bg-lime/10' : ''"
          >
            <td class="px-5 py-4 font-semibold text-ink">
              {{ u.full_name }}
              <span v-if="u.id === auth.profile?.id" class="ml-2 text-xs font-normal text-muted">(tú)</span>
            </td>
            <td class="px-5 py-4 text-muted">{{ u.email }}</td>
            <td class="px-5 py-4">
              <span class="rounded-full bg-lime px-3 py-1 text-xs font-bold capitalize text-ink">{{ u.role }}</span>
            </td>
          </tr>
          <tr v-if="!sortedUsers.length">
            <td colspan="3" class="px-5 py-12 text-center text-muted">Sin usuarios</td>
          </tr>
        </tbody>
      </table>
    </div>

    <button
      type="button"
      class="fixed bottom-8 right-8 z-20 flex h-14 w-14 items-center justify-center rounded-full bg-ink text-white shadow-xl transition hover:scale-105 hover:bg-ink/90 lg:right-10"
      title="Nuevo usuario"
      @click="modalOpen = true"
    >
      <svg class="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" stroke-width="2">
        <path stroke-linecap="round" d="M12 5v14M5 12h14" />
      </svg>
    </button>

    <AppModal :open="modalOpen" title="Nuevo usuario" wide @close="modalOpen = false">
      <form class="grid gap-4 md:grid-cols-2" @submit.prevent="invite">
        <AppInput v-model="fullName" label="Nombre completo" required />
        <AppInput v-model="email" label="Correo" type="email" required />
        <AppInput v-model="password" label="Contraseña" type="password" required />
        <AppSelect v-model="role" label="Rol">
          <option value="admin">Administrador</option>
          <option value="operator">Operador</option>
        </AppSelect>
        <div class="flex justify-end gap-3 md:col-span-2 md:border-t md:border-surface md:pt-4">
          <AppButton type="button" variant="secondary" @click="modalOpen = false">Cancelar</AppButton>
          <AppButton type="submit" :loading="saving" show-arrow>Crear usuario</AppButton>
        </div>
      </form>
    </AppModal>
  </div>
</template>
