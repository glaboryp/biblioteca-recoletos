<script setup lang="ts">
definePageMeta({ layout: false })
useHead({ title: 'Acceso encargadas · Biblioteca de Recoletos' })

const route = useRoute()
const { loggedIn } = useUserSession()
if (loggedIn.value) await navigateTo('/panel')

const messages: Record<string, string> = {
  acceso: 'Tu cuenta de Google no tiene acceso al panel. Pide a una encargada que añada tu email.',
  google: 'No se ha podido entrar con Google. Vuelve a intentarlo.',
}
const error = computed(() => messages[String(route.query.error ?? '')])
</script>

<template>
  <main class="mx-auto flex min-h-dvh max-w-sm flex-col justify-center px-4 py-10">
    <NuxtLink to="/" class="-ml-1 self-start rounded-md p-1" aria-label="Ir al catálogo público">
      <picture>
        <source srcset="/brand/logo-light.webp" media="(prefers-color-scheme: dark)">
        <img src="/brand/logo-teal.webp" alt="" width="640" height="190" class="h-10 w-auto">
      </picture>
    </NuxtLink>
    <h1 class="mt-10 text-[1.75rem] leading-tight font-extrabold tracking-[-0.02em]">Panel de encargadas</h1>
    <p class="mt-2 text-muted">Entra con tu cuenta de Google para añadir libros, ubicaciones y préstamos.</p>
    <p v-if="error" class="mt-6 flex items-start gap-2 rounded-xl bg-panel p-4 font-semibold text-danger" role="alert">
      <AppIcon name="alert" class="mt-0.5 size-5" />{{ error }}
    </p>
    <a
      href="/auth/google"
      class="mt-8 inline-flex min-h-12 items-center justify-center gap-3 rounded-full bg-accent px-6 font-bold text-on-accent"
    >
      Entrar con Google
    </a>
    <NuxtLink to="/" class="mt-4 inline-flex min-h-11 items-center justify-center rounded-full text-sm font-bold text-muted hover:text-ink">
      Volver al catálogo
    </NuxtLink>
  </main>
</template>
