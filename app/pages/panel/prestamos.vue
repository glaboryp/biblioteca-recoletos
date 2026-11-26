<script setup lang="ts">
import type { Catalog } from '../../../shared/types'

definePageMeta({ layout: 'panel', middleware: 'encargada' })
useHead({ title: 'Préstamos · Panel de encargadas' })

const { data, refresh } = await useFetch<Catalog>('/api/catalog', { key: 'catalog' })
const error = ref('')

const loans = computed(() => (data.value?.books ?? [])
  .flatMap(b => b.loans.map(l => ({ ...l, book: b })))
  .sort((a, b) => a.borrowedAt.localeCompare(b.borrowedAt)))

async function close(id: number) {
  error.value = ''
  try {
    await $fetch(`/api/loans/${id}/return`, { method: 'POST' })
    await refresh()
  }
  catch (e) {
    error.value = apiError(e)
  }
}
</script>

<template>
  <div class="max-w-3xl">
    <h1 class="text-2xl font-extrabold tracking-[-0.02em]">Préstamos</h1>
    <p class="mt-1 text-muted">Libros que alguien se ha llevado y no ha devuelto, del más antiguo al más reciente.</p>
    <p v-if="error" class="mt-4 flex items-start gap-2 font-semibold text-danger" role="alert">
      <AppIcon name="alert" class="mt-0.5 size-5" />{{ error }}
    </p>
    <p v-if="data && !loans.length" class="mt-6 rounded-xl bg-panel p-5 text-muted">Ahora mismo no hay ningún libro prestado.</p>
    <ul class="mt-4">
      <li v-for="loan in loans" :key="loan.id" class="flex flex-wrap items-center gap-x-4 gap-y-1 border-b border-rule py-3">
        <div class="min-w-0 flex-1 basis-60">
          <p class="font-bold">{{ loan.book.title }}</p>
          <p class="text-sm text-muted">{{ loan.book.location.name }}</p>
        </div>
        <div class="basis-40">
          <p class="font-hand text-2xl leading-none">{{ loan.borrowerName }}</p>
          <p class="tabular text-sm text-muted">desde el {{ formatDate(loan.borrowedAt) }}</p>
        </div>
        <ConfirmButton label="Marcar devuelto" question="¿Ya está en su sitio?" confirm-label="Sí, devuelto" tone="accent" :action="() => close(loan.id)" />
      </li>
    </ul>
  </div>
</template>
