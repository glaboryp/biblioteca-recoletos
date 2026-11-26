import type { CatalogBook } from '../../shared/types'

export const normalize = (s: string) => s.normalize('NFD').replace(/\p{Diacritic}/gu, '').toLowerCase().trim()

export type BookQuery = { text: string; locationId: number | null; categoryId: number | null }

export function filterBooks(books: CatalogBook[], q: BookQuery): CatalogBook[] {
  const words = normalize(q.text).split(/\s+/).filter(Boolean)
  return books.filter((b) => {
    if (q.locationId && b.location.id !== q.locationId) return false
    if (q.categoryId && !b.categories.some(c => c.id === q.categoryId)) return false
    const haystack = normalize(`${b.title} ${b.author ?? ''}`)
    return words.every(w => haystack.includes(w))
  })
}
