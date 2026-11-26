import Papa from 'papaparse'
import type { Db } from '../db/client'
import { createBook } from './books'
import { fail } from './errors'
import { findOrCreateTerm } from './taxonomy'

export type ImportRow = { line: number; title: string; author: string | null; location: string; categories: string[]; copies: number }
export type ImportError = { line: number; message: string }
export type ImportPreview = { rows: (ImportRow & { duplicate: boolean })[]; errors: ImportError[]; newLocations: string[]; newCategories: string[] }

const COLUMNS = ['titulo', 'autor', 'ubicacion', 'categorias', 'ejemplares'] as const
const headerKey = (h: string) => h.normalize('NFD').replace(/\p{Diacritic}/gu, '').trim().toLowerCase()
const key = (s: string | null) => (s ?? '').trim().toLowerCase()

export function parseImport(text: string): { rows: ImportRow[]; errors: ImportError[] } {
  const { data } = Papa.parse<string[]>(text.replace(/^﻿/, '').trim(), { skipEmptyLines: false })
  const [header, ...lines] = data
  const headers = (header ?? []).map(headerKey)
  const missing = (['titulo', 'ubicacion'] as const).filter(c => !headers.includes(c))
  if (!text.trim() || missing.length) {
    return { rows: [], errors: [{ line: 1, message: `Falta la columna ${missing.join(' y ') || 'titulo'} en la cabecera` }] }
  }

  const rows: ImportRow[] = []
  const errors: ImportError[] = []
  lines.forEach((cells, i) => {
    const line = i + 2
    if (cells.every(c => !c.trim())) return
    const get = (col: typeof COLUMNS[number]) => (cells[headers.indexOf(col)] ?? '').trim()
    const title = get('titulo')
    const location = get('ubicacion')
    const rawCopies = get('ejemplares')
    const copies = rawCopies ? Number(rawCopies) : 1
    const problem = !title ? 'Falta el título'
      : title.length > 200 ? 'El título supera 200 caracteres'
      : !location ? 'Falta la ubicación'
      : location.length > 60 ? 'La ubicación supera 60 caracteres'
      : get('autor').length > 120 ? 'El autor supera 120 caracteres'
      : !Number.isInteger(copies) || copies < 1 ? 'Los ejemplares deben ser un número entero mayor que 0'
      : null
    const categories = get('categorias').split('|').map(c => c.trim()).filter(Boolean)
    if (!problem && categories.some(c => c.length > 60)) errors.push({ line, message: 'Alguna categoría supera 60 caracteres' })
    else if (problem) errors.push({ line, message: problem })
    else rows.push({ line, title, author: get('autor') || null, location, categories, copies })
  })
  return { rows, errors }
}

export async function previewImport(db: Db, text: string): Promise<ImportPreview> {
  const { rows, errors } = parseImport(text)
  const [locations, categories, books] = await Promise.all([
    db.query<{ name: string }>('SELECT name FROM locations'),
    db.query<{ name: string }>('SELECT name FROM categories'),
    db.query<{ title: string; author: string | null; location: string }>(
      'SELECT b.title, b.author, l.name AS location FROM books b JOIN locations l ON l.id = b.location_id'),
  ])
  const bookKey = (b: { title: string; author: string | null; location: string }) => `${key(b.title)}|${key(b.author)}|${key(b.location)}`
  const seen = new Set(books.map(bookKey))
  const knownLocations = new Set(locations.map(l => key(l.name)))
  const knownCategories = new Set(categories.map(c => key(c.name)))
  const newLocations: string[] = []
  const newCategories: string[] = []

  const preview = rows.map((r) => {
    const k = bookKey(r)
    const duplicate = seen.has(k)
    seen.add(k)
    if (!duplicate) {
      if (!knownLocations.has(key(r.location))) { knownLocations.add(key(r.location)); newLocations.push(r.location) }
      for (const c of r.categories) {
        if (!knownCategories.has(key(c))) { knownCategories.add(key(c)); newCategories.push(c) }
      }
    }
    return { ...r, duplicate }
  })
  return { rows: preview, errors, newLocations, newCategories }
}

export function applyImport(db: Db, text: string): Promise<{ created: number; skipped: number }> {
  return db.tx(async (t) => {
    const { rows, errors } = await previewImport(t, text)
    if (errors.length) fail(400, `La lista tiene ${errors.length} ${errors.length === 1 ? 'error' : 'errores'}; corrígelos antes de importar`)
    let created = 0
    for (const r of rows.filter(r => !r.duplicate)) {
      const locationId = await findOrCreateTerm(t, 'locations', r.location)
      const categoryIds = []
      for (const c of r.categories) categoryIds.push(await findOrCreateTerm(t, 'categories', c))
      await createBook(t, { title: r.title, author: r.author, locationId, categoryIds, copies: r.copies })
      created++
    }
    return { created, skipped: rows.length - created }
  })
}
