<script setup lang="ts">
import type { CatalogBook } from '../../shared/types'

const props = defineProps<{ book: CatalogBook }>()

const NAME_KEY = 'recoletos:nombre'
const MAX_BLANK_LINES = 3

const free = computed(() => props.book.copies - props.book.loans.length)
const blankLines = computed(() => Math.min(free.value, MAX_BLANK_LINES))
const hiddenFree = computed(() => free.value - blankLines.value)

const borrowing = ref(false)
const name = ref('')
const returning = ref<number | null>(null)
const busy = ref(false)
const error = ref('')
const notice = ref('')
const nameInput = ref<HTMLInputElement>()

async function startBorrow() {
  error.value = ''
  notice.value = ''
  returning.value = null
  try { name.value = localStorage.getItem(NAME_KEY) ?? '' }
  catch { name.value = '' }
  borrowing.value = true
  await nextTick()
  nameInput.value?.focus()
  nameInput.value?.select()
}

async function submitBorrow() {
  if (!name.value.trim()) {
    error.value = 'Escribe tu nombre para apuntarte el libro.'
    nameInput.value?.focus()
    return
  }
  busy.value = true
  error.value = ''
  try {
    await $fetch(`/api/books/${props.book.id}/borrow`, { method: 'POST', body: { name: name.value } })
    try { localStorage.setItem(NAME_KEY, name.value.trim()) }
    catch {}
    await refreshNuxtData('catalog')
    borrowing.value = false
    notice.value = `Apuntado. Cuando acabes, déjalo en ${props.book.location.name}.`
  }
  catch (e) {
    error.value = apiError(e)
  }
  finally {
    busy.value = false
  }
}

async function confirmReturn(loanId: number) {
  busy.value = true
  error.value = ''
  try {
    await $fetch(`/api/loans/${loanId}/return`, { method: 'POST' })
    await refreshNuxtData('catalog')
    returning.value = null
    notice.value = `Devuelto. Gracias por dejarlo en ${props.book.location.name}.`
  }
  catch (e) {
    error.value = apiError(e)
  }
  finally {
    busy.value = false
  }
}

function askReturn(loanId: number) {
  borrowing.value = false
  error.value = ''
  notice.value = ''
  returning.value = loanId
}
</script>

<template>
  <article class="flex flex-col gap-4 rounded-xl bg-panel p-5" :aria-labelledby="`book-${book.id}`">
    <header>
      <h2 :id="`book-${book.id}`" class="text-xl leading-snug font-bold text-balance">
        {{ book.title }}
      </h2>
      <p class="mt-0.5 text-[0.9375rem] text-muted">
        {{ book.author ?? 'Autor desconocido' }}
      </p>
    </header>

    <p class="flex items-start gap-2 font-bold text-accent-ink">
      <AppIcon name="pin" class="mt-0.5 size-5" />
      <span>{{ book.location.name }}</span>
    </p>

    <ul v-if="book.categories.length" class="-mt-1 flex flex-wrap gap-1.5" aria-label="Categorías">
      <li
        v-for="c in book.categories"
        :key="c.id"
        class="rounded-full bg-ground px-2.5 py-0.5 text-[0.8125rem] font-semibold text-muted"
      >
        {{ c.name }}
      </li>
    </ul>

    <section class="mt-1 flex flex-1 flex-col" :aria-label="`Préstamos de ${book.title}`">
      <div class="flex items-baseline justify-between border-b-2 border-rule pb-1.5 text-sm">
        <span class="font-semibold text-muted">Prestado a</span>
        <span class="tabular font-semibold" :class="free > 0 ? 'text-free-ink' : 'text-muted'">
          {{ free > 0 ? `${free} de ${book.copies} ${book.copies === 1 ? 'libre' : 'libres'}` : 'Ninguno libre' }}
        </span>
      </div>

      <ol>
        <li v-for="loan in book.loans" :key="loan.id" class="border-b border-rule">
          <div v-if="returning === loan.id" class="flex flex-wrap items-center gap-2 py-2.5">
            <span class="mr-auto text-[0.9375rem]">¿Devuelves el ejemplar de <strong>{{ loan.borrowerName }}</strong>?</span>
            <button
              type="button"
              class="min-h-11 rounded-full bg-accent px-4 font-bold text-on-accent transition-opacity disabled:opacity-60"
              :disabled="busy"
              @click="confirmReturn(loan.id)"
            >
              Sí, lo devuelvo
            </button>
            <button type="button" class="min-h-11 rounded-full px-3 font-semibold text-muted hover:text-ink" :disabled="busy" @click="returning = null">
              Cancelar
            </button>
          </div>
          <div v-else class="flex min-h-14 items-center gap-3 py-1.5">
            <div class="min-w-0 flex-1">
              <p class="font-hand text-[1.625rem] leading-none break-words">{{ loan.borrowerName }}</p>
              <p class="tabular mt-0.5 text-[0.8125rem] text-muted">desde el {{ formatDate(loan.borrowedAt) }}</p>
            </div>
            <button
              type="button"
              class="-mr-2 min-h-11 rounded-full px-2 text-sm font-bold text-accent-ink underline decoration-rule underline-offset-4 hover:decoration-current"
              :aria-label="`Devolver el ejemplar de ${loan.borrowerName}`"
              @click="askReturn(loan.id)"
            >
              Devolver
            </button>
          </div>
        </li>

        <li v-for="n in blankLines" :key="`free-${n}`" class="border-b border-dashed border-rule">
          <form v-if="borrowing && n === 1" class="flex flex-wrap items-end gap-2 py-2.5" @submit.prevent="submitBorrow">
            <label class="flex min-w-[10rem] flex-1 flex-col">
              <span class="text-[0.8125rem] font-semibold text-muted">Tu nombre</span>
              <input
                :ref="(el) => { nameInput = el as HTMLInputElement }"
                v-model="name"
                type="text"
                name="nombre"
                autocomplete="given-name"
                maxlength="80"
                enterkeyhint="done"
                class="min-h-11 w-full border-0 border-b-2 border-accent bg-transparent px-0 font-hand text-[1.75rem] leading-none outline-none focus-visible:outline-none"
                :aria-invalid="!!error"
              >
            </label>
            <button
              type="submit"
              class="min-h-11 rounded-full bg-accent px-4 font-bold text-on-accent transition-opacity disabled:opacity-60"
              :disabled="busy"
              :aria-busy="busy"
            >
              {{ busy ? 'Apuntando…' : 'Apuntar' }}
            </button>
            <button type="button" class="min-h-11 rounded-full px-3 font-semibold text-muted hover:text-ink" :disabled="busy" @click="borrowing = false; error = ''">
              Cancelar
            </button>
          </form>
          <div v-else class="flex min-h-12 items-center gap-2 text-sm text-free-ink">
            <span class="size-2 rounded-full bg-free" aria-hidden="true" />
            Libre
          </div>
        </li>
      </ol>

      <p v-if="hiddenFree > 0" class="pt-2 text-sm text-muted">
        y {{ hiddenFree }} {{ hiddenFree === 1 ? 'ejemplar libre más' : 'ejemplares libres más' }}
      </p>

      <div aria-live="polite" class="empty:hidden">
        <p v-if="error" class="mt-3 flex items-start gap-2 text-sm font-semibold text-danger">
          <AppIcon name="alert" class="mt-0.5 size-4" />{{ error }}
        </p>
        <p v-else-if="notice" class="enter mt-3 text-sm font-semibold text-free-ink">
          {{ notice }}
        </p>
      </div>

      <div class="min-h-4 flex-1" />
      <p v-if="free === 0" class="text-sm text-muted">
        Cuando alguien lo devuelva, aparecerá aquí como libre.
      </p>
      <button
        v-if="free > 0 && !borrowing"
        type="button"
        class="min-h-12 w-full rounded-full bg-accent px-5 font-bold text-on-accent transition-[opacity,transform] active:scale-[0.98] sm:w-auto"
        @click="startBorrow"
      >
        Me lo llevo
      </button>
    </section>
  </article>
</template>
