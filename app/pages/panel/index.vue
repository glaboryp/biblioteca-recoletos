<script setup lang="ts">
import type { Catalog, CatalogBook } from '../../../shared/types'

definePageMeta({ layout: 'panel', middleware: 'encargada' })
useHead({ title: 'Libros · Panel de encargadas' })

const { data, status, refresh } = await useFetch<Catalog>('/api/catalog', { key: 'catalog' })
const text = ref('')
const adding = ref(false)
const editing = ref<number | null>(null)
const error = ref('')

const results = computed(() => filterBooks(data.value?.books ?? [], { text: text.value, locationId: null, categoryId: null }))

async function remove(book: CatalogBook) {
  error.value = ''
  try {
    await $fetch(`/api/admin/books/${book.id}`, { method: 'DELETE', query: book.loans.length ? { force: 1 } : {} })
    await refresh()
  }
  catch (e) {
    error.value = apiError(e, 'No se ha podido borrar el libro.')
  }
}
</script>

<template>
  <div class="max-w-4xl">
    <div class="flex flex-wrap items-center justify-between gap-3">
      <h1 class="text-2xl font-extrabold tracking-[-0.02em]">Libros</h1>
      <button v-if="!adding" type="button" class="min-h-11 rounded-full bg-accent px-5 font-bold text-on-accent" @click="adding = true; editing = null">
        Añadir libro
      </button>
    </div>

    <BookForm
      v-if="adding && data"
      class="mt-5"
      :locations="data.locations"
      :categories="data.categories"
      @saved="adding = false"
      @cancel="adding = false"
    />

    <label class="relative mt-5 block">
      <span class="sr-only">Buscar libro</span>
      <AppIcon name="search" class="pointer-events-none absolute top-1/2 left-4 size-5 -translate-y-1/2 text-muted" />
      <input v-model="text" type="search" placeholder="Buscar por título o autor" class="min-h-12 w-full rounded-full border-2 border-rule bg-field pr-4 pl-12 focus:border-accent focus-visible:outline-none">
    </label>

    <p v-if="error" class="mt-4 flex items-start gap-2 font-semibold text-danger" role="alert">
      <AppIcon name="alert" class="mt-0.5 size-5" />{{ error }}
    </p>

    <p v-if="status === 'error'" class="mt-6 text-danger" role="alert">No se han podido cargar los libros. Recarga la página.</p>
    <p v-else-if="data && !data.books.length" class="mt-6 rounded-xl bg-panel p-5 text-muted">
      Aún no hay libros. Añade el primero o <NuxtLink to="/panel/importar" class="font-bold text-accent-ink underline underline-offset-4">importa una lista</NuxtLink>.
    </p>
    <p v-else-if="data && !results.length" class="mt-6 text-muted">Ningún libro coincide con la búsqueda.</p>

    <p v-if="data?.books.length" class="tabular mt-6 text-sm font-semibold text-muted">
      {{ results.length }} de {{ data.books.length }} libros
    </p>
    <ul class="mt-2">
      <li v-for="book in results" :key="book.id" class="border-b border-rule py-3">
        <BookForm
          v-if="editing === book.id && data"
          :book="book"
          :locations="data.locations"
          :categories="data.categories"
          @saved="editing = null"
          @cancel="editing = null"
        />
        <div v-else class="flex flex-wrap items-center gap-x-4 gap-y-1">
          <div class="min-w-0 flex-1 basis-60">
            <p class="font-bold">{{ book.title }}</p>
            <p class="text-sm text-muted">
              {{ book.author ?? 'Autor desconocido' }} · <span class="font-semibold text-accent-ink">{{ book.location.name }}</span>
              <template v-if="book.categories.length"> · {{ book.categories.map(c => c.name).join(', ') }}</template>
            </p>
          </div>
          <p class="tabular text-sm text-muted">
            {{ book.copies - book.loans.length }} de {{ book.copies }} {{ book.copies === 1 ? 'libre' : 'libres' }}
          </p>
          <div class="flex flex-wrap items-center">
            <button type="button" class="min-h-11 rounded-full px-3 text-sm font-bold text-accent-ink hover:bg-panel" @click="editing = book.id; adding = false">
              Editar
            </button>
            <ConfirmButton
              label="Borrar"
              :question="book.loans.length ? `Tiene ${book.loans.length} prestado(s). ¿Borrar igualmente?` : '¿Borrar este libro?'"
              confirm-label="Sí, borrar"
              :action="() => remove(book)"
            />
          </div>
        </div>
      </li>
    </ul>
  </div>
</template>
