<script setup lang="ts">
const { user, clear } = useUserSession()
const route = useRoute()

const links = [
  { to: '/panel', label: 'Libros' },
  { to: '/panel/ubicaciones', label: 'Ubicaciones' },
  { to: '/panel/categorias', label: 'Categorías' },
  { to: '/panel/prestamos', label: 'Préstamos' },
  { to: '/panel/encargadas', label: 'Encargadas' },
  { to: '/panel/importar', label: 'Importar' },
]

async function logout() {
  await $fetch('/api/auth/logout', { method: 'POST' })
  await clear()
  await navigateTo('/panel/login')
}
</script>

<template>
  <div class="min-h-dvh md:grid md:grid-cols-[15rem_minmax(0,1fr)]">
    <aside class="md:sticky md:top-0 md:flex md:h-dvh md:flex-col md:px-4 md:py-6">
      <div class="flex h-14 items-center justify-between px-4 md:h-auto md:flex-col md:items-start md:gap-1 md:px-2">
        <NuxtLink to="/" class="-ml-1 rounded-md p-1" aria-label="Ir al catálogo público">
          <picture>
            <source srcset="/brand/logo-light.webp" media="(prefers-color-scheme: dark)">
            <img src="/brand/logo-teal.webp" alt="" width="640" height="190" class="h-8 w-auto">
          </picture>
        </NuxtLink>
        <span class="text-sm font-semibold text-muted md:px-1">Panel de encargadas</span>
      </div>
      <nav aria-label="Secciones del panel" class="overflow-x-auto px-2 md:mt-8 md:overflow-visible md:px-0">
        <ul class="flex gap-1 md:flex-col">
          <li v-for="l in links" :key="l.to">
            <NuxtLink
              :to="l.to"
              class="flex min-h-11 items-center rounded-full px-4 font-semibold whitespace-nowrap text-muted transition-colors hover:text-ink"
              :class="route.path === l.to ? 'bg-panel text-ink' : ''"
              :aria-current="route.path === l.to ? 'page' : undefined"
            >
              {{ l.label }}
            </NuxtLink>
          </li>
        </ul>
      </nav>
      <div class="hidden md:mt-auto md:block md:px-2">
        <p class="truncate text-sm text-muted" :title="user?.email">{{ user?.email }}</p>
        <button type="button" class="mt-1 -ml-3 min-h-11 rounded-full px-3 text-sm font-bold text-muted hover:bg-panel hover:text-ink" @click="logout">
          Salir
        </button>
      </div>
    </aside>
    <main class="px-4 pt-6 pb-16 md:px-10 md:pt-8">
      <slot />
      <div class="mt-12 flex items-center gap-2 border-t border-rule pt-4 text-sm text-muted md:hidden">
        <span class="min-w-0 truncate">{{ user?.email }}</span>
        <button type="button" class="ml-auto min-h-11 rounded-full px-3 font-bold hover:text-ink" @click="logout">Salir</button>
      </div>
    </main>
  </div>
</template>
