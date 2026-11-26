<script setup lang="ts">
import type { Catalog } from '../../shared/types'

const route = useRoute()
const router = useRouter()

const { data, status, refresh } = await useFetch<Catalog>('/api/catalog', { key: 'catalog' })

const toId = (v: unknown) => (Number(v) > 0 ? Number(v) : null)
const text = ref(String(route.query.q ?? ''))
const locationId = ref<number | null>(toId(route.query.ubicacion))
const categoryId = ref<number | null>(toId(route.query.categoria))

watch([text, locationId, categoryId], () => {
  router.replace({
    query: {
      ...(text.value.trim() ? { q: text.value.trim() } : {}),
      ...(locationId.value ? { ubicacion: locationId.value } : {}),
      ...(categoryId.value ? { categoria: categoryId.value } : {}),
    },
  })
})

const books = computed(() => data.value?.books ?? [])
const results = computed(() => filterBooks(books.value, { text: text.value, locationId: locationId.value, categoryId: categoryId.value }))
const filtered = computed(() => !!(text.value.trim() || locationId.value || categoryId.value))
const lentNow = computed(() => books.value.reduce((n, b) => n + b.loans.length, 0))

const plural = (n: number, one: string, many: string) => `${n} ${n === 1 ? one : many}`
const summary = computed(() => {
  if (!data.value) return ''
  const parts = [
    plural(books.value.length, 'libro', 'libros'),
    `en ${plural(data.value.locations.length, 'sitio', 'sitios')}`,
  ]
  return `${parts.join(' ')} · ${plural(lentNow.value, 'prestado', 'prestados')} ahora`
})

function clearFilters() {
  text.value = ''
  locationId.value = null
  categoryId.value = null
}

useHead({ title: 'Biblioteca de Recoletos' })
</script>

<template>
  <main class="pt-6 sm:pt-10">
    <h1 class="text-[1.75rem] leading-tight font-extrabold tracking-[-0.02em] sm:text-[2rem]">
      Biblioteca de Recoletos
    </h1>
    <p class="tabular mt-1 min-h-6 text-muted">
      {{ summary }}
    </p>

    <div role="search" class="mt-5 grid items-end gap-3 sm:grid-cols-[minmax(0,1fr)_14rem_14rem]">
      <label class="relative block">
        <span class="sr-only">Buscar por título o autor</span>
        <AppIcon name="search" class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
        <input
          v-model="text"
          type="search"
          placeholder="Título o autor"
          autocomplete="off"
          enterkeyhint="search"
          class="h-13 w-full rounded-full border-2 border-rule bg-field pr-11 pl-12 text-[1.0625rem] placeholder:text-muted focus:border-accent focus-visible:outline-none"
        >
        <button
          v-if="text"
          type="button"
          class="absolute top-1/2 right-1.5 grid size-10 -translate-y-1/2 place-items-center rounded-full text-muted hover:bg-panel hover:text-ink"
          aria-label="Borrar búsqueda"
          @click="text = ''"
        >
          <AppIcon name="x" class="size-5" />
        </button>
      </label>
      <div class="grid grid-cols-2 gap-3 sm:contents">
        <label class="flex flex-col gap-1">
          <span class="px-1 text-[0.8125rem] font-semibold text-muted">Ubicación</span>
          <select
            v-model="locationId"
            class="h-11 w-full truncate rounded-full border-2 border-rule bg-field px-4 font-semibold focus:border-accent focus-visible:outline-none sm:h-13"
          >
            <option :value="null">Todas</option>
            <option v-for="l in data?.locations" :key="l.id" :value="l.id">{{ l.name }}</option>
          </select>
        </label>
        <label class="flex flex-col gap-1">
          <span class="px-1 text-[0.8125rem] font-semibold text-muted">Categoría</span>
          <select
            v-model="categoryId"
            class="h-11 w-full truncate rounded-full border-2 border-rule bg-field px-4 font-semibold focus:border-accent focus-visible:outline-none sm:h-13"
          >
            <option :value="null">Todas</option>
            <option v-for="c in data?.categories" :key="c.id" :value="c.id">{{ c.name }}</option>
          </select>
        </label>
      </div>
    </div>

    <div v-if="status === 'pending' && !data" class="mt-8 grid gap-4 md:grid-cols-2 xl:grid-cols-3" aria-busy="true" aria-label="Cargando libros">
      <div v-for="n in 3" :key="n" class="h-64 animate-pulse rounded-xl bg-panel motion-reduce:animate-none" />
    </div>

    <div v-else-if="status === 'error'" class="mt-10 flex flex-col items-start gap-3 rounded-xl bg-panel p-6" role="alert">
      <p class="flex items-center gap-2 font-bold"><AppIcon name="alert" class="size-5 text-danger" />No se ha podido cargar la biblioteca.</p>
      <p class="text-muted">Revisa tu conexión y vuelve a intentarlo.</p>
      <button type="button" class="min-h-11 rounded-full bg-accent px-5 font-bold text-on-accent" @click="refresh()">
        Reintentar
      </button>
    </div>

    <div v-else-if="!books.length" class="mt-10 rounded-xl bg-panel p-6">
      <p class="font-bold">Aún no hay libros en la biblioteca.</p>
      <p class="mt-1 text-muted">Las encargadas los irán añadiendo desde su panel.</p>
    </div>

    <template v-else>
      <div class="mt-6 flex min-h-11 items-center justify-between gap-3" aria-live="polite">
        <p class="tabular font-semibold text-muted">
          {{ filtered ? plural(results.length, 'libro encontrado', 'libros encontrados') : plural(results.length, 'libro', 'libros') }}
        </p>
        <button
          v-if="filtered"
          type="button"
          class="min-h-11 rounded-full px-3 text-sm font-bold text-accent-ink hover:bg-panel"
          @click="clearFilters"
        >
          Quitar filtros
        </button>
      </div>

      <div v-if="!results.length" class="mt-2 rounded-xl bg-panel p-6">
        <p class="font-bold">
          No tenemos ningún libro que coincida{{ text.trim() ? ` con «${text.trim()}»` : '' }}.
        </p>
        <p class="mt-1 text-muted">Prueba con otra palabra del título, solo el apellido del autor o quita los filtros.</p>
      </div>

      <div v-else class="mt-2 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
        <BookCard v-for="book in results" :key="book.id" :book="book" />
      </div>
    </template>
  </main>
</template>
