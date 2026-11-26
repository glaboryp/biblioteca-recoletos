import { beforeEach, expect, test } from 'vitest'
import type { Db } from '../server/db/client'
import { createBook } from '../server/services/books'
import { getCatalog } from '../server/services/catalog'
import { applyImport, parseImport, previewImport } from '../server/services/import'
import { createTerm } from '../server/services/taxonomy'
import { createTestDb } from './helpers/db'

let db: Db
beforeEach(async () => { db = await createTestDb() })

test('CSV con comas y cabecera básica', () => {
  const { rows, errors } = parseImport('titulo,autor,ubicacion,categorias,ejemplares\nCamino,San Josemaría,Oratorio,Oración,1\n')
  expect(errors).toEqual([])
  expect(rows).toEqual([{ line: 2, title: 'Camino', author: 'San Josemaría', location: 'Oratorio', categories: ['Oración'], copies: 1 }])
})

test('punto y coma, BOM, cabecera con tildes y mayúsculas', () => {
  const { rows, errors } = parseImport('﻿Título;Autor;Ubicación;Categorías;Ejemplares\n"Camino";San Josemaría;Oratorio · Estantería 1;Oración | Clásicos;2\n\n')
  expect(errors).toEqual([])
  expect(rows).toEqual([{ line: 2, title: 'Camino', author: 'San Josemaría', location: 'Oratorio · Estantería 1', categories: ['Oración', 'Clásicos'], copies: 2 }])
})

test('tabuladores y comillas con comas dentro', () => {
  const { rows, errors } = parseImport('titulo\tubicacion\n"Dios, ¿quién eres?"\tSalón\n')
  expect(errors).toEqual([])
  expect(rows[0]).toMatchObject({ title: 'Dios, ¿quién eres?', location: 'Salón' })
})

test('solo titulo y ubicacion: autor null, categorías [], ejemplares 1', () => {
  const { rows } = parseImport('titulo,ubicacion\nCamino,Oratorio\n')
  expect(rows).toEqual([{ line: 2, title: 'Camino', author: null, location: 'Oratorio', categories: [], copies: 1 }])
})

test('falta columna titulo o ubicacion en la cabecera → error línea 1', () => {
  expect(parseImport('titulo,autor\nCamino,X\n').errors).toEqual([{ line: 1, message: expect.stringContaining('ubicacion') }])
  expect(parseImport('autor,ubicacion\nX,Oratorio\n').errors).toEqual([{ line: 1, message: expect.stringContaining('titulo') }])
})

test('texto vacío → error', () => {
  expect(parseImport('   ').errors).toHaveLength(1)
})

test('fila sin título o sin ubicación → error con su número de línea', () => {
  const { rows, errors } = parseImport('titulo,ubicacion\nCamino,Oratorio\n,Oratorio\nSurco,\n')
  expect(rows).toHaveLength(1)
  expect(errors.map(e => e.line)).toEqual([3, 4])
})

test('ejemplares "dos" o 0 → error de fila', () => {
  const { errors } = parseImport('titulo,ubicacion,ejemplares\nCamino,Oratorio,dos\nSurco,Oratorio,0\n')
  expect(errors.map(e => e.line)).toEqual([2, 3])
})

test('título demasiado largo → error de fila', () => {
  expect(parseImport(`titulo,ubicacion\n${'x'.repeat(201)},Oratorio\n`).errors.map(e => e.line)).toEqual([2])
})

test('previewImport marca ubicaciones/categorías nuevas sin duplicar por mayúsculas', async () => {
  await createTerm(db, 'locations', 'Oratorio')
  await createTerm(db, 'categories', 'Oración')
  const p = await previewImport(db, 'titulo;ubicacion;categorias\nA;oratorio ;oración|Santos\nB;Salón;santos\nC;salón;\n')
  expect(p.newLocations).toEqual(['Salón'])
  expect(p.newCategories).toEqual(['Santos'])
  expect(p.errors).toEqual([])
})

test('previewImport marca duplicado si título+autor+ubicación ya existe (sin distinguir mayúsculas)', async () => {
  const loc = await createTerm(db, 'locations', 'Oratorio')
  await createBook(db, { title: 'Camino', author: 'San Josemaría', locationId: loc })
  const p = await previewImport(db, 'titulo;autor;ubicacion\ncamino;san josemaría;ORATORIO\nCamino;;Oratorio\n')
  expect(p.rows.map(r => r.duplicate)).toEqual([true, false])
})

test('applyImport crea libros, ubicaciones y categorías y omite duplicados', async () => {
  const loc = await createTerm(db, 'locations', 'Oratorio')
  await createBook(db, { title: 'Camino', locationId: loc })
  const r = await applyImport(db, 'titulo;ubicacion;categorias;ejemplares\nCamino;Oratorio;;1\nSurco;oratorio;Oración|Santos;2\nForja;Salón;santos;\n')
  expect(r).toEqual({ created: 2, skipped: 1 })
  const { books, locations, categories } = await getCatalog(db)
  expect(books.map(b => [b.title, b.location.name, b.copies, b.categories.map(c => c.name)])).toEqual([
    ['Camino', 'Oratorio', 1, []],
    ['Forja', 'Salón', 1, ['Santos']],
    ['Surco', 'Oratorio', 2, ['Oración', 'Santos']],
  ])
  expect(locations.map(l => l.name)).toEqual(['Oratorio', 'Salón'])
  expect(categories.map(c => c.name)).toEqual(['Oración', 'Santos'])
})

test('applyImport con errores no importa nada → 400', async () => {
  await expect(applyImport(db, 'titulo,ubicacion\nCamino,Oratorio\n,Oratorio\n')).rejects.toMatchObject({ statusCode: 400 })
  expect((await getCatalog(db)).books).toEqual([])
  expect((await getCatalog(db)).locations).toEqual([])
})

test('duplicado dentro del mismo lote: la segunda fila se omite', async () => {
  const p = await previewImport(db, 'titulo,ubicacion\nCamino,Oratorio\ncamino,ORATORIO\n')
  expect(p.rows.map(r => r.duplicate)).toEqual([false, true])
  expect(await applyImport(db, 'titulo,ubicacion\nCamino,Oratorio\ncamino,ORATORIO\n')).toEqual({ created: 1, skipped: 1 })
})
