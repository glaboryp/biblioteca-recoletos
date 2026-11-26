<script setup lang="ts">
definePageMeta({ layout: 'panel', middleware: 'encargada' })
useHead({ title: 'Ubicaciones · Panel de encargadas' })
</script>

<template>
  <TermManager kind="locations" />
</template>
