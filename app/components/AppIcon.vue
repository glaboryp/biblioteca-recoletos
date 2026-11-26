<script setup lang="ts">
defineProps<{ name: 'search' | 'pin' | 'x' | 'book' | 'alert' }>()
</script>

<template>
  <svg
    class="shrink-0"
    viewBox="0 0 24 24"
    fill="none"
    stroke="currentColor"
    stroke-width="1.75"
    stroke-linecap="round"
    stroke-linejoin="round"
    aria-hidden="true"
  >
    <template v-if="name === 'search'"><circle cx="11" cy="11" r="7" /><path d="m20 20-3.5-3.5" /></template>
    <template v-else-if="name === 'pin'"><path d="M12 21s-7-6.2-7-11.5a7 7 0 0 1 14 0C19 14.8 12 21 12 21Z" /><circle cx="12" cy="9.5" r="2.5" /></template>
    <template v-else-if="name === 'x'"><path d="M6 6l12 12M18 6 6 18" /></template>
    <template v-else-if="name === 'book'"><path d="M4 5.5A2.5 2.5 0 0 1 6.5 3H20v15H6.5A2.5 2.5 0 0 0 4 20.5v-15Z" /><path d="M4 20.5A2.5 2.5 0 0 0 6.5 23H20v-5" /></template>
    <template v-else><circle cx="12" cy="12" r="9" /><path d="M12 7.5v5.5M12 16.5h.01" /></template>
  </svg>
</template>
