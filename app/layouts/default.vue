<template>
  <div class="mx-auto flex min-h-dvh max-w-[1100px] flex-col px-4 sm:px-6">
    <header class="flex h-14 items-center justify-between sm:h-16">
      <NuxtLink to="/" class="-ml-1 rounded-md p-1" aria-label="Recoletos, centro universitario — inicio">
        <picture>
          <source srcset="/brand/logo-light.webp" media="(prefers-color-scheme: dark)">
          <img src="/brand/logo-teal.webp" alt="" width="640" height="190" class="h-9 w-auto sm:h-10">
        </picture>
      </NuxtLink>
      <NuxtLink
        to="/panel"
        class="inline-flex min-h-11 items-center rounded-full px-3 text-sm font-semibold text-muted transition-colors hover:bg-panel hover:text-ink"
      >
        Encargadas
      </NuxtLink>
    </header>
    <slot />
    <footer class="mt-auto py-10 text-sm text-muted">
      ¿Falta un libro o está en otro sitio? Díselo a una encargada.
    </footer>
  </div>
</template>
