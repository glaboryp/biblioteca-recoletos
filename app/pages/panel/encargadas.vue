<script setup lang="ts">
definePageMeta({ layout: 'panel', middleware: 'encargada' })
useHead({ title: 'Encargadas · Panel de encargadas' })

type Encargada = { email: string; addedBy: string; isAdmin: boolean }
const { user } = useUserSession()
const { data, refresh, error: loadError } = await useFetch<Encargada[]>('/api/admin/encargadas')
const email = ref('')
const busy = ref(false)
const error = ref('')

async function add() {
  busy.value = true
  error.value = ''
  try {
    await $fetch('/api/admin/encargadas', { method: 'POST', body: { email: email.value } })
    email.value = ''
    await refresh()
  }
  catch (e) {
    error.value = apiError(e)
  }
  finally {
    busy.value = false
  }
}

async function remove(target: string) {
  error.value = ''
  try {
    await $fetch(`/api/admin/encargadas/${encodeURIComponent(target)}`, { method: 'DELETE' })
    await refresh()
  }
  catch (e) {
    error.value = apiError(e)
  }
}
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="text-2xl font-extrabold tracking-[-0.02em]">Encargadas</h1>
    <p class="mt-1 text-muted">Quien esté en esta lista puede entrar al panel con su cuenta de Google.</p>

    <form class="mt-5 flex flex-wrap items-end gap-2" @submit.prevent="add">
      <label class="flex min-w-[14rem] flex-1 flex-col gap-1">
        <span class="text-sm font-semibold text-muted">Email de Google</span>
        <input v-model="email" type="email" required autocomplete="off" placeholder="nombre@gmail.com" class="min-h-11 w-full rounded-lg border-2 border-rule bg-field px-3 focus:border-accent focus-visible:outline-none">
      </label>
      <button type="submit" class="min-h-11 rounded-full bg-accent px-5 font-bold text-on-accent disabled:opacity-60" :disabled="busy">
        Añadir encargada
      </button>
    </form>

    <p v-if="error || loadError" class="mt-4 flex items-start gap-2 font-semibold text-danger" role="alert">
      <AppIcon name="alert" class="mt-0.5 size-5" />{{ error || apiError(loadError, 'No se ha podido cargar la lista.') }}
    </p>

    <ul class="mt-4">
      <li v-for="e in data" :key="e.email" class="flex flex-wrap items-center gap-x-3 border-b border-rule py-2">
        <div class="min-w-0 flex-1 py-1.5">
          <p class="truncate font-semibold">{{ e.email }}<span v-if="e.email === user?.email" class="font-normal text-muted"> (tú)</span></p>
          <p class="text-sm text-muted">{{ e.isAdmin ? 'Administradora · no se puede quitar' : `Añadida por ${e.addedBy}` }}</p>
        </div>
        <ConfirmButton
          v-if="!e.isAdmin"
          label="Quitar"
          :question="e.email === user?.email ? '¿Quitarte a ti? Perderás el acceso.' : '¿Quitar acceso?'"
          confirm-label="Sí, quitar"
          :action="() => remove(e.email)"
        />
      </li>
    </ul>
  </div>
</template>
