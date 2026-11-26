export function apiError(e: unknown, fallback = 'No se ha podido guardar. Inténtalo de nuevo.'): string {
  const err = e as { data?: { statusMessage?: string; message?: string }; statusMessage?: string }
  return err?.data?.statusMessage || err?.data?.message || err?.statusMessage || fallback
}
