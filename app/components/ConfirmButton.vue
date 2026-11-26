<script setup lang="ts">
const props = defineProps<{ label: string; question: string; confirmLabel: string; action: () => Promise<unknown>; tone?: 'danger' | 'accent' }>()

const asking = ref(false)
const busy = ref(false)

async function run() {
  busy.value = true
  try {
    await props.action()
    asking.value = false
  }
  finally {
    busy.value = false
  }
}
</script>

<template>
  <span v-if="asking" class="flex flex-wrap items-center gap-2" role="group" :aria-label="question">
    <span class="text-sm font-semibold">{{ question }}</span>
    <button type="button" class="min-h-11 rounded-full px-4 text-sm font-bold disabled:opacity-60" :class="tone === 'accent' ? 'bg-accent text-on-accent' : 'bg-danger text-white dark:text-ground'" :disabled="busy" @click="run">
      {{ busy ? 'Un momento…' : confirmLabel }}
    </button>
    <button type="button" class="min-h-11 rounded-full px-3 text-sm font-semibold text-muted hover:text-ink" :disabled="busy" @click="asking = false">
      Cancelar
    </button>
  </span>
  <button v-else type="button" class="min-h-11 rounded-full px-3 text-sm font-bold hover:bg-panel" :class="tone === 'accent' ? 'text-accent-ink' : 'text-muted hover:text-danger'" @click="asking = true">
    {{ label }}
  </button>
</template>
