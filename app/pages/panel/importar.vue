<script setup lang="ts">
definePageMeta({ layout: 'panel', middleware: 'encargada' })
useHead({ title: 'Importar · Panel de encargadas' })

type Row = { line: number; title: string; author: string | null; location: string; categories: string[]; copies: number; duplicate: boolean }
type Preview = { rows: Row[]; errors: { line: number; message: string }[]; newLocations: string[]; newCategories: string[] }

const EXAMPLE = `titulo;autor;ubicacion;categorias;ejemplares
Camino;San Josemaría Escrivá;Oratorio · Estantería 1;Oración|Clásicos;2
Historia de un alma;Santa Teresa de Lisieux;Oratorio · Estantería 1;Santos;1`


const text = ref('')
const preview = ref<Preview | null>(null)
const busy = ref(false)
const error = ref('')
const result = ref<{ created: number; skipped: number } | null>(null)

const toImport = computed(() => preview.value?.rows.filter(r => !r.duplicate).length ?? 0)

watch(text, () => { preview.value = null; result.value = null })

async function readFile(event: Event) {
  const file = (event.target as HTMLInputElement).files?.[0]
  if (file) text.value = await file.text()
}

async function review() {
  busy.value = true
  error.value = ''
  try {
    preview.value = await $fetch<Preview>('/api/admin/import/preview', { method: 'POST', body: { text: text.value } })
  }
  catch (e) {
    error.value = apiError(e, 'No se ha podido revisar la lista.')
  }
  finally {
    busy.value = false
  }
}

async function apply() {
  busy.value = true
  error.value = ''
  try {
    result.value = await $fetch('/api/admin/import', { method: 'POST', body: { text: text.value } })
    await refreshNuxtData('catalog')
    preview.value = null
  }
  catch (e) {
    error.value = apiError(e, 'No se ha podido importar la lista.')
  }
  finally {
    busy.value = false
  }
}

</script>

<template>
  <div class="max-w-4xl">
    <h1 class="text-2xl font-extrabold tracking-[-0.02em]">Importar una lista</h1>
    <p class="mt-1 max-w-[65ch] text-muted">
      Pega aquí la lista de libros (o sube un fichero .csv). Antes de guardar nada verás qué libros se añaden,
      cuáles ya estaban y qué ubicaciones o categorías nuevas se crean.
    </p>

    <details class="mt-5 rounded-xl bg-panel p-5">
      <summary class="cursor-pointer font-bold">Formato de la lista</summary>
      <p class="mt-3 text-sm text-muted">
        Columnas: <strong class="text-ink">titulo</strong> y <strong class="text-ink">ubicacion</strong> son obligatorias;
        <strong class="text-ink">autor</strong>, <strong class="text-ink">categorias</strong> (separadas por |) y
        <strong class="text-ink">ejemplares</strong> (1 si se deja vacío) son opcionales. Vale separar con punto y coma, coma o tabulador.
      </p>
      <pre class="mt-3 overflow-x-auto rounded-lg bg-ground p-3 text-sm">{{ EXAMPLE }}</pre>
    </details>

    <label class="mt-6 flex flex-col gap-1">
      <span class="text-sm font-semibold text-muted">Lista de libros</span>
      <textarea
        v-model="text"
        rows="8"
        spellcheck="false"
        :placeholder="EXAMPLE"
        class="w-full rounded-lg border-2 border-rule bg-field p-3 text-sm focus:border-accent focus-visible:outline-none"
      />
    </label>
    <div class="mt-3 flex flex-wrap items-center gap-3">
      <button type="button" class="min-h-11 rounded-full bg-accent px-5 font-bold text-on-accent disabled:opacity-60" :disabled="busy || !text.trim()" @click="review">
        {{ busy && !preview ? 'Revisando…' : 'Revisar lista' }}
      </button>
      <label class="inline-flex min-h-11 cursor-pointer items-center rounded-full px-3 font-bold text-accent-ink hover:bg-panel has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-accent">
        <input type="file" accept=".csv,.txt,text/csv,text/plain" class="sr-only" @change="readFile">
        Subir fichero .csv
      </label>
    </div>

    <p v-if="error" class="mt-4 flex items-start gap-2 font-semibold text-danger" role="alert">
      <AppIcon name="alert" class="mt-0.5 size-5" />{{ error }}
    </p>
    <p v-if="result" class="mt-6 rounded-xl bg-panel p-5 font-semibold text-free-ink" role="status">
      Listo: {{ result.created }} {{ result.created === 1 ? 'libro añadido' : 'libros añadidos' }}<template v-if="result.skipped">, {{ result.skipped }} ya estaban y se han omitido</template>.
      <NuxtLink to="/panel" class="ml-1 underline underline-offset-4">Ver libros</NuxtLink>
    </p>

    <section v-if="preview" class="mt-8" aria-labelledby="preview-title">
      <h2 id="preview-title" class="text-xl font-extrabold">Revisión</h2>

      <div v-if="preview.errors.length" class="mt-3 rounded-xl bg-panel p-5" role="alert">
        <p class="font-bold text-danger">Hay {{ preview.errors.length }} {{ preview.errors.length === 1 ? 'línea con error' : 'líneas con errores' }}. Corrígelas y vuelve a revisar.</p>
        <ul class="mt-2 text-sm">
          <li v-for="e in preview.errors" :key="e.line" class="tabular py-0.5">Línea {{ e.line }}: {{ e.message }}</li>
        </ul>
      </div>

      <p v-if="preview.newLocations.length" class="mt-3 text-sm">
        <span class="font-semibold text-muted">Ubicaciones nuevas:</span> {{ preview.newLocations.join(', ') }}
      </p>
      <p v-if="preview.newCategories.length" class="mt-1 text-sm">
        <span class="font-semibold text-muted">Categorías nuevas:</span> {{ preview.newCategories.join(', ') }}
      </p>

      <div class="mt-4 overflow-x-auto">
        <table class="w-full min-w-[36rem] text-left text-sm">
          <thead class="text-muted">
            <tr>
              <th class="py-2 pr-3 font-semibold">Línea</th>
              <th class="py-2 pr-3 font-semibold">Título</th>
              <th class="py-2 pr-3 font-semibold">Autor</th>
              <th class="py-2 pr-3 font-semibold">Ubicación</th>
              <th class="py-2 pr-3 text-right font-semibold">Ejemplares</th>
            </tr>
          </thead>
          <tbody>
            <tr v-for="r in preview.rows" :key="r.line" class="border-t border-rule" :class="r.duplicate ? 'text-muted' : ''">
              <td class="tabular py-2 pr-3">{{ r.line }}</td>
              <td class="py-2 pr-3 font-semibold">
                {{ r.title }}
                <span v-if="r.duplicate" class="ml-1 rounded-full bg-panel px-2 py-0.5 text-xs font-semibold">Ya existe, se omitirá</span>
              </td>
              <td class="py-2 pr-3">{{ r.author ?? '—' }}</td>
              <td class="py-2 pr-3">{{ r.location }}</td>
              <td class="tabular py-2 pr-3 text-right">{{ r.copies }}</td>
            </tr>
          </tbody>
        </table>
      </div>

      <button
        type="button"
        class="mt-5 min-h-12 rounded-full bg-accent px-6 font-bold text-on-accent disabled:opacity-50"
        :disabled="busy || !!preview.errors.length || !toImport"
        @click="apply"
      >
        {{ busy ? 'Importando…' : `Importar ${toImport} ${toImport === 1 ? 'libro' : 'libros'}` }}
      </button>
    </section>
  </div>
</template>
