<script setup lang="ts">
import type { CatalogBook, Named } from '../../shared/types'

const props = defineProps<{ book?: CatalogBook; locations: Named[]; categories: Named[] }>()
const emit = defineEmits<{ saved: []; cancel: [] }>()

const form = reactive({
  title: props.book?.title ?? '',
  author: props.book?.author ?? '',
  locationId: props.book?.location.id ?? null as number | null,
  categoryIds: props.book?.categories.map(c => c.id) ?? [] as number[],
  copies: props.book?.copies ?? 1,
})
const busy = ref(false)
const error = ref('')
const titleInput = ref<HTMLInputElement>()
onMounted(() => titleInput.value?.focus())

async function save() {
  busy.value = true
  error.value = ''
  try {
    const body = { ...form, copies: Number(form.copies) }
    if (props.book) await $fetch(`/api/admin/books/${props.book.id}`, { method: 'PUT', body })
    else await $fetch('/api/admin/books', { method: 'POST', body })
    await refreshNuxtData('catalog')
    emit('saved')
  }
  catch (e) {
    error.value = apiError(e)
  }
  finally {
    busy.value = false
  }
}

const field = 'min-h-11 w-full rounded-lg border-2 border-rule bg-field px-3 focus:border-accent focus-visible:outline-none'
</script>

<template>
  <form class="grid gap-4 rounded-xl bg-panel p-5 sm:grid-cols-2" @submit.prevent="save">
    <label class="flex flex-col gap-1 sm:col-span-2">
      <span class="text-sm font-semibold text-muted">Título</span>
      <input ref="titleInput" v-model="form.title" required maxlength="200" :class="field">
    </label>
    <label class="flex flex-col gap-1">
      <span class="text-sm font-semibold text-muted">Autor <span class="font-normal">(opcional)</span></span>
      <input v-model="form.author" maxlength="120" :class="field">
    </label>
    <label class="flex flex-col gap-1">
      <span class="text-sm font-semibold text-muted">Ejemplares</span>
      <input v-model.number="form.copies" type="number" min="1" step="1" required inputmode="numeric" :class="[field, 'tabular']">
    </label>
    <label class="flex flex-col gap-1 sm:col-span-2">
      <span class="text-sm font-semibold text-muted">Ubicación</span>
      <select v-model="form.locationId" required :class="field">
        <option :value="null" disabled>Elige dónde está</option>
        <option v-for="l in locations" :key="l.id" :value="l.id">{{ l.name }}</option>
      </select>
      <span v-if="!locations.length" class="text-sm text-muted">
        Aún no hay ubicaciones. <NuxtLink to="/panel/ubicaciones" class="font-bold text-accent-ink underline underline-offset-4">Crea la primera</NuxtLink>.
      </span>
    </label>
    <fieldset v-if="categories.length" class="sm:col-span-2">
      <legend class="text-sm font-semibold text-muted">Categorías <span class="font-normal">(opcional)</span></legend>
      <div class="mt-2 flex flex-wrap gap-2">
        <label
          v-for="c in categories"
          :key="c.id"
          class="inline-flex min-h-11 cursor-pointer items-center gap-2 rounded-full border-2 px-4 font-semibold transition-colors has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent"
          :class="form.categoryIds.includes(c.id) ? 'border-accent bg-ground text-accent-ink' : 'border-rule text-muted'"
        >
          <input v-model="form.categoryIds" type="checkbox" :value="c.id" class="sr-only">
          {{ c.name }}
        </label>
      </div>
    </fieldset>
    <p v-if="error" class="flex items-start gap-2 text-sm font-semibold text-danger sm:col-span-2" role="alert">
      <AppIcon name="alert" class="mt-0.5 size-4" />{{ error }}
    </p>
    <div class="flex flex-wrap gap-2 sm:col-span-2">
      <button type="submit" class="min-h-11 rounded-full bg-accent px-5 font-bold text-on-accent disabled:opacity-60" :disabled="busy">
        {{ busy ? 'Guardando…' : book ? 'Guardar cambios' : 'Añadir libro' }}
      </button>
      <button type="button" class="min-h-11 rounded-full px-4 font-semibold text-muted hover:text-ink" @click="emit('cancel')">
        Cancelar
      </button>
    </div>
  </form>
</template>
