import { expect, test } from 'vitest'
import type { CatalogBook } from '../shared/types'
import { filterBooks, normalize } from '../app/utils/search'
import { formatDate } from '../app/utils/format'

const book = (id: number, title: string, author: string | null, locationId: number, categoryIds: number[] = []): CatalogBook => ({
  id, title, author, copies: 1, location: { id: locationId, name: `L${locationId}` },
  categories: categoryIds.map(c => ({ id: c, name: `C${c}` })), loans: [],
})
const books = [
  book(1, 'Libro de la vida', 'Santa Teresa de Jesús', 1, [10]),
  book(2, 'Camino', 'San Josemaría', 2, [10, 11]),
  book(3, 'Historia de un alma', null, 1, [11]),
]
const all = { text: '', locationId: null, categoryId: null }

test('normalize quita tildes, mayúsculas y espacios', () => {
  expect(normalize('  Josemaría ÉL ')).toBe('josemaria el')
})

test('busca por título o autor sin tildes ni mayúsculas', () => {
  expect(filterBooks(books, { ...all, text: 'teresa de jesus' }).map(b => b.id)).toEqual([1])
  expect(filterBooks(books, { ...all, text: 'CAMINO' }).map(b => b.id)).toEqual([2])
  expect(filterBooks(books, { ...all, text: 'alma' }).map(b => b.id)).toEqual([3])
})

test('varias palabras deben aparecer todas, en cualquier orden', () => {
  expect(filterBooks(books, { ...all, text: 'jesus vida' }).map(b => b.id)).toEqual([1])
})

test('combina texto, ubicación y categoría', () => {
  expect(filterBooks(books, { text: '', locationId: 1, categoryId: 11 }).map(b => b.id)).toEqual([3])
  expect(filterBooks(books, { text: 'san', locationId: 2, categoryId: 10 }).map(b => b.id)).toEqual([2])
})

test('texto vacío devuelve todos', () => {
  expect(filterBooks(books, all)).toHaveLength(3)
})

test('formatDate usa Europe/Madrid', () => {
  expect(formatDate('2026-03-02T23:30:00Z')).toBe('3 mar 2026')
})
