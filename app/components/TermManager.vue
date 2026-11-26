<script setup lang="ts">
import type { Catalog, Named } from '../../shared/types'

const props = defineProps<{ kind: 'locations' | 'categories' }>()
const copy = props.kind === 'locations'
  ? { title: 'Ubicaciones', one: 'ubicación', placeholder: 'Ej.: Oratorio · Estantería 1', hint: 'Cada sitio donde se guardan libros: sala y estantería.' }
  : { title: 'Categorías', one: 'categoría', placeholder: 'Ej.: Oración', hint: 'Opcionales. Sirven para filtrar el catálogo.' }

const { data, refresh } = await useFetch<Catalog>('/api/catalog', { key: 'catalog' })
const items = computed<Named[]>(() => data.value?.[props.kind] ?? [])
const usage = computed(() => {
  const count = new Map<number, number>()
  for (const b of data.value?.books ?? []) {
    const ids = props.kind === 'locations' ? [b.location.id] : b.categories.map(c => c.id)
    for (const id of ids) count.set(id, (count.get(id) ?? 0) + 1)
  }
  return count
})

const newName = ref('')
const editing = ref<number | null>(null)
const editName = ref('')
const busy = ref(false)
const error = ref('')

async function run(fn: () => Promise<unknown>) {
  busy.value = true
  error.value = ''
  try {
    await fn()
    await refresh()
    return true
  }
  catch (e) {
    error.value = apiError(e)
    return false
  }
  finally {
    busy.value = false
  }
}

async function create() {
  if (await run(() => $fetch(`/api/admin/${props.kind}`, { method: 'POST', body: { name: newName.value } }))) newName.value = ''
}

async function rename(id: number) {
  if (await run(() => $fetch(`/api/admin/${props.kind}/${id}`, { method: 'PUT', body: { name: editName.value } }))) editing.value = null
}

const remove = (id: number) => run(() => $fetch(`/api/admin/${props.kind}/${id}`, { method: 'DELETE' }))

const field = 'min-h-11 w-full rounded-lg border-2 border-rule bg-field px-3 focus:border-accent focus-visible:outline-none'
</script>

<template>
  <div class="max-w-2xl">
    <h1 class="text-2xl font-extrabold tracking-[-0.02em]">{{ copy.title }}</h1>
    <p class="mt-1 text-muted">{{ copy.hint }}</p>

    <form class="mt-5 flex flex-wrap items-end gap-2" @submit.prevent="create">
      <label class="flex min-w-[12rem] flex-1 flex-col gap-1">
        <span class="text-sm font-semibold text-muted">Nueva {{ copy.one }}</span>
        <input v-model="newName" required maxlength="60" :placeholder="copy.placeholder" :class="field">
      </label>
      <button type="submit" class="min-h-11 rounded-full bg-accent px-5 font-bold text-on-accent disabled:opacity-60" :disabled="busy">
        Añadir
      </button>
    </form>

    <p v-if="error" class="mt-4 flex items-start gap-2 font-semibold text-danger" role="alert">
      <AppIcon name="alert" class="mt-0.5 size-5" />{{ error }}
    </p>

    <p v-if="data && !items.length" class="mt-6 rounded-xl bg-panel p-5 text-muted">Todavía no hay ninguna.</p>
    <ul class="mt-4">
      <li v-for="item in items" :key="item.id" class="border-b border-rule py-2">
        <form v-if="editing === item.id" class="flex flex-wrap items-center gap-2" @submit.prevent="rename(item.id)">
          <label class="min-w-[12rem] flex-1">
            <span class="sr-only">Nuevo nombre</span>
            <input v-model="editName" required maxlength="60" :class="field" @keydown.esc="editing = null">
          </label>
          <button type="submit" class="min-h-11 rounded-full bg-accent px-4 font-bold text-on-accent disabled:opacity-60" :disabled="busy">Guardar</button>
          <button type="button" class="min-h-11 rounded-full px-3 font-semibold text-muted hover:text-ink" @click="editing = null">Cancelar</button>
        </form>
        <div v-else class="flex flex-wrap items-center gap-x-3">
          <p class="min-w-0 flex-1 font-semibold">{{ item.name }}</p>
          <p class="tabular text-sm text-muted">{{ usage.get(item.id) ?? 0 }} libros</p>
          <button type="button" class="min-h-11 rounded-full px-3 text-sm font-bold text-accent-ink hover:bg-panel" @click="editing = item.id; editName = item.name">
            Renombrar
          </button>
          <ConfirmButton label="Borrar" :question="`¿Borrar «${item.name}»?`" confirm-label="Sí, borrar" :action="() => remove(item.id)" />
        </div>
      </li>
    </ul>
  </div>
</template>
