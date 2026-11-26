import { beforeEach, expect, test } from 'vitest'
import type { Db } from '../server/db/client'
import { createBook } from '../server/services/books'
import { getCatalog } from '../server/services/catalog'
import { createTerm, deleteTerm, findOrCreateTerm, renameTerm } from '../server/services/taxonomy'
import { createTestDb } from './helpers/db'

let db: Db
beforeEach(async () => { db = await createTestDb() })

test('createTerm recorta espacios', async () => {
  await createTerm(db, 'locations', ' Oratorio ')
  expect((await getCatalog(db)).locations.map(l => l.name)).toEqual(['Oratorio'])
})

test('nombre duplicado sin distinguir mayúsculas → 409 "Ya existe"', async () => {
  await createTerm(db, 'categories', 'Oración')
  await expect(createTerm(db, 'categories', 'oración ')).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining('Ya existe') })
})

test('renameTerm cambia el nombre', async () => {
  const id = await createTerm(db, 'locations', 'Oratorio')
  await renameTerm(db, 'locations', id, 'Capilla')
  expect((await getCatalog(db)).locations).toEqual([{ id, name: 'Capilla' }])
})

test('renameTerm a un nombre ya usado → 409', async () => {
  await createTerm(db, 'locations', 'Oratorio')
  const id = await createTerm(db, 'locations', 'Salón')
  await expect(renameTerm(db, 'locations', id, 'ORATORIO')).rejects.toMatchObject({ statusCode: 409 })
})

test('renameTerm o deleteTerm de id inexistente → 404', async () => {
  await expect(renameTerm(db, 'locations', 999, 'X')).rejects.toMatchObject({ statusCode: 404 })
  await expect(deleteTerm(db, 'categories', 999)).rejects.toMatchObject({ statusCode: 404 })
})

test('borrar ubicación con libros → 409 con mensaje que pide moverlos', async () => {
  const loc = await createTerm(db, 'locations', 'Oratorio')
  await createBook(db, { title: 'Camino', locationId: loc })
  await expect(deleteTerm(db, 'locations', loc)).rejects.toMatchObject({ statusCode: 409, message: expect.stringContaining('Mueve') })
})

test('borrar ubicación vacía funciona', async () => {
  const loc = await createTerm(db, 'locations', 'Oratorio')
  await deleteTerm(db, 'locations', loc)
  expect((await getCatalog(db)).locations).toEqual([])
})

test('borrar categoría la quita de los libros', async () => {
  const loc = await createTerm(db, 'locations', 'Oratorio')
  const cat = await createTerm(db, 'categories', 'Oración')
  await createBook(db, { title: 'Camino', locationId: loc, categoryIds: [cat] })
  await deleteTerm(db, 'categories', cat)
  const { books } = await getCatalog(db)
  expect(books).toHaveLength(1)
  expect(books[0].categories).toEqual([])
})

test('findOrCreateTerm reutiliza existente ignorando mayúsculas', async () => {
  const id = await createTerm(db, 'locations', 'Oratorio')
  expect(await findOrCreateTerm(db, 'locations', 'ORATORIO ')).toBe(id)
  expect(await findOrCreateTerm(db, 'locations', 'Salón')).not.toBe(id)
})

test('nombre vacío o > 60 → 400', async () => {
  await expect(createTerm(db, 'locations', '  ')).rejects.toMatchObject({ statusCode: 400 })
  await expect(createTerm(db, 'locations', 'x'.repeat(61))).rejects.toMatchObject({ statusCode: 400 })
})

test('kind no válido → 404', async () => {
  await expect(createTerm(db, 'books; DROP TABLE books' as any, 'x')).rejects.toMatchObject({ statusCode: 404 })
})

test('espacios internos repetidos y tildes descompuestas cuentan como el mismo nombre', async () => {
  const id = await createTerm(db, 'locations', 'Oratorio · Estantería 1')
  await expect(createTerm(db, 'locations', 'Oratorio  ·  Estantería 1')).rejects.toMatchObject({ statusCode: 409 })
  expect(await findOrCreateTerm(db, 'locations', 'Oratorio · Estanteri\u0301a 1')).toBe(id)
})
