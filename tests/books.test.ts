import { beforeEach, expect, test } from 'vitest'
import type { Db } from '../server/db/client'
import { createBook, deleteBook, updateBook } from '../server/services/books'
import { getCatalog } from '../server/services/catalog'
import { createTestDb } from './helpers/db'

let db: Db
let oratorio: number, oracion: number, santos: number

beforeEach(async () => {
  db = await createTestDb()
  ;[{ id: oratorio }] = await db.query(`INSERT INTO locations (name) VALUES ('Oratorio') RETURNING id`)
  ;[{ id: oracion }, { id: santos }] = await db.query(`INSERT INTO categories (name) VALUES ('Oración'), ('Santos') RETURNING id`)
})

const openLoans = (bookId: number, n: number) =>
  Promise.all(Array.from({ length: n }, (_, i) =>
    db.query(`INSERT INTO loans (book_id, borrower_name) VALUES ($1, $2)`, [bookId, `P${i}`])))

test('createBook guarda categorías y aparece en el catálogo', async () => {
  await createBook(db, { title: '  Historia de un alma ', author: 'Santa Teresita', locationId: oratorio, categoryIds: [oracion, santos], copies: 2 })
  const { books, locations, categories } = await getCatalog(db)
  expect(books).toEqual([{
    id: expect.any(Number),
    title: 'Historia de un alma',
    author: 'Santa Teresita',
    copies: 2,
    location: { id: oratorio, name: 'Oratorio' },
    categories: [{ id: oracion, name: 'Oración' }, { id: santos, name: 'Santos' }],
    loans: [],
  }])
  expect(locations).toEqual([{ id: oratorio, name: 'Oratorio' }])
  expect(categories.map(c => c.name)).toEqual(['Oración', 'Santos'])
})

test('autor vacío se guarda como null', async () => {
  await createBook(db, { title: 'Camino', author: '   ', locationId: oratorio })
  const { books } = await getCatalog(db)
  expect(books[0]).toMatchObject({ author: null, copies: 1, categories: [] })
})

test('título vacío → 400', async () => {
  await expect(createBook(db, { title: '  ', locationId: oratorio })).rejects.toMatchObject({ statusCode: 400 })
})

test('ubicación inexistente → 400', async () => {
  await expect(createBook(db, { title: 'Camino', locationId: 999 })).rejects.toMatchObject({ statusCode: 400 })
})

test('categoría inexistente → 400', async () => {
  await expect(createBook(db, { title: 'Camino', locationId: oratorio, categoryIds: [999] })).rejects.toMatchObject({ statusCode: 400 })
})

test('ejemplares no enteros o < 1 → 400', async () => {
  await expect(createBook(db, { title: 'Camino', locationId: oratorio, copies: 0 })).rejects.toMatchObject({ statusCode: 400 })
  await expect(createBook(db, { title: 'Camino', locationId: oratorio, copies: 1.5 })).rejects.toMatchObject({ statusCode: 400 })
})

test('updateBook reemplaza categorías y datos', async () => {
  const id = await createBook(db, { title: 'Camino', locationId: oratorio, categoryIds: [oracion, santos] })
  await updateBook(db, id, { title: 'Surco', author: 'San Josemaría', locationId: oratorio, categoryIds: [santos], copies: 3 })
  const { books } = await getCatalog(db)
  expect(books[0]).toMatchObject({ title: 'Surco', author: 'San Josemaría', copies: 3, categories: [{ id: santos, name: 'Santos' }] })
})

test('updateBook de id inexistente → 404', async () => {
  await expect(updateBook(db, 999, { title: 'X', locationId: oratorio })).rejects.toMatchObject({ statusCode: 404 })
})

test('no se puede bajar copies por debajo de préstamos abiertos → 409', async () => {
  const id = await createBook(db, { title: 'Camino', locationId: oratorio, copies: 2 })
  await openLoans(id, 2)
  await expect(updateBook(db, id, { title: 'Camino', locationId: oratorio, copies: 1 })).rejects.toMatchObject({ statusCode: 409 })
})

test('el catálogo muestra solo préstamos abiertos, del más antiguo al más nuevo', async () => {
  const id = await createBook(db, { title: 'Camino', locationId: oratorio, copies: 3 })
  await db.query(`INSERT INTO loans (book_id, borrower_name, borrowed_at) VALUES ($1, 'Nuevo', now()), ($1, 'Viejo', now() - interval '2 days')`, [id])
  await db.query(`INSERT INTO loans (book_id, borrower_name, returned_at) VALUES ($1, 'Devuelto', now())`, [id])
  const { books } = await getCatalog(db)
  expect(books[0].loans.map(l => l.borrowerName)).toEqual(['Viejo', 'Nuevo'])
  expect(typeof books[0].loans[0].borrowedAt).toBe('string')
})

test('deleteBook con préstamos abiertos sin force → 409; con force borra libro y préstamos', async () => {
  const id = await createBook(db, { title: 'Camino', locationId: oratorio })
  await openLoans(id, 1)
  await expect(deleteBook(db, id)).rejects.toMatchObject({ statusCode: 409 })
  await deleteBook(db, id, { force: true })
  expect((await getCatalog(db)).books).toEqual([])
  expect(await db.query('SELECT * FROM loans')).toEqual([])
})

test('deleteBook de id inexistente → 404', async () => {
  await expect(deleteBook(db, 999)).rejects.toMatchObject({ statusCode: 404 })
})
