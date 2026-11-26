const fmt = new Intl.DateTimeFormat('es-ES', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Europe/Madrid' })

export const formatDate = (iso: string) => fmt.format(new Date(iso)).replace('.', '')
