import { beforeEach, expect, test } from 'vitest'
import type { Db } from '../server/db/client'
import { createBook } from '../server/services/books'
import { getCatalog } from '../server/services/catalog'
import { borrow, returnLoan } from '../server/services/loans'
import { createTerm } from '../server/services/taxonomy'
import { createTestDb } from './helpers/db'

let db: Db
let bookId: number

beforeEach(async () => {
  db = await createTestDb()
  const loc = await createTerm(db, 'locations', 'Oratorio')
  bookId = await createBook(db, { title: 'Camino', locationId: loc, copies: 1 })
})

test('borrow registra nombre recortado y aparece en el catálogo', async () => {
  const id = await borrow(db, bookId, '  María ')
  const { books } = await getCatalog(db)
  expect(books[0].loans).toEqual([{ id, borrowerName: 'María', borrowedAt: expect.any(String) }])
})

test('nombre vacío o solo espacios → 400', async () => {
  await expect(borrow(db, bookId, '')).rejects.toMatchObject({ statusCode: 400 })
  await expect(borrow(db, bookId, '   ')).rejects.toMatchObject({ statusCode: 400 })
})

test('nombre de 81 caracteres → 400', async () => {
  await expect(borrow(db, bookId, 'a'.repeat(81))).rejects.toMatchObject({ statusCode: 400 })
  await expect(borrow(db, bookId, 'a'.repeat(80))).resolves.toEqual(expect.any(Number))
})

test('sin ejemplares libres → 409 "No quedan ejemplares libres"', async () => {
  await borrow(db, bookId, 'Ana')
  await expect(borrow(db, bookId, 'Luis')).rejects.toMatchObject({ statusCode: 409, message: 'No quedan ejemplares libres' })
})

test('borrow concurrente sobre la última copia: solo uno gana', async () => {
  const r = await Promise.allSettled([borrow(db, bookId, 'Ana'), borrow(db, bookId, 'Luis')])
  expect(r.filter(x => x.status === 'fulfilled')).toHaveLength(1)
})

test('returnLoan cierra el préstamo y libera la copia', async () => {
  const id = await borrow(db, bookId, 'Ana')
  await returnLoan(db, id)
  expect((await getCatalog(db)).books[0].loans).toEqual([])
  await expect(borrow(db, bookId, 'Luis')).resolves.toEqual(expect.any(Number))
})

test('returnLoan dos veces → 409 "Este préstamo ya estaba devuelto"', async () => {
  const id = await borrow(db, bookId, 'Ana')
  await returnLoan(db, id)
  await expect(returnLoan(db, id)).rejects.toMatchObject({ statusCode: 409, message: 'Este préstamo ya estaba devuelto' })
})

test('libro o préstamo inexistente → 404', async () => {
  await expect(borrow(db, 999, 'Ana')).rejects.toMatchObject({ statusCode: 404 })
  await expect(returnLoan(db, 999)).rejects.toMatchObject({ statusCode: 404 })
})
