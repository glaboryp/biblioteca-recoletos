import type { BookInput } from '../../shared/types'
import type { Db } from '../db/client'
import { fail, optionalText, requiredText } from './errors'

async function clean(db: Db, input: BookInput) {
  const title = requiredText(input?.title, 200, 'El título')
  const author = optionalText(input?.author, 120, 'El autor')
  const copies = input?.copies ?? 1
  if (!Number.isInteger(copies) || copies < 1) fail(400, 'Los ejemplares deben ser un número entero mayor que 0')
  const locationId = Number(input?.locationId)
  if (!(await db.query('SELECT 1 FROM locations WHERE id = $1', [locationId])).length) fail(400, 'La ubicación no existe')
  const categoryIds = [...new Set((input?.categoryIds ?? []).map(Number))]
  if (categoryIds.length) {
    const found = await db.query('SELECT id FROM categories WHERE id = ANY($1::int[])', [categoryIds])
    if (found.length !== categoryIds.length) fail(400, 'Alguna categoría no existe')
  }
  return { title, author, copies, locationId, categoryIds }
}

async function setCategories(db: Db, bookId: number, categoryIds: number[]) {
  await db.query('DELETE FROM book_categories WHERE book_id = $1', [bookId])
  if (categoryIds.length) {
    await db.query('INSERT INTO book_categories (book_id, category_id) SELECT $1, unnest($2::int[])', [bookId, categoryIds])
  }
}

const openLoanCount = async (db: Db, bookId: number) =>
  (await db.query<{ n: number }>('SELECT count(*)::int AS n FROM loans WHERE book_id = $1 AND returned_at IS NULL', [bookId]))[0].n

export function createBook(db: Db, input: BookInput): Promise<number> {
  return db.tx(async (t) => {
    const b = await clean(t, input)
    const [{ id }] = await t.query<{ id: number }>(
      'INSERT INTO books (title, author, location_id, copies) VALUES ($1, $2, $3, $4) RETURNING id',
      [b.title, b.author, b.locationId, b.copies])
    await setCategories(t, id, b.categoryIds)
    return id
  })
}

export function updateBook(db: Db, id: number, input: BookInput): Promise<void> {
  return db.tx(async (t) => {
    if (!(await t.query('SELECT 1 FROM books WHERE id = $1 FOR UPDATE', [id])).length) fail(404, 'El libro no existe')
    const b = await clean(t, input)
    const lent = await openLoanCount(t, id)
    if (b.copies < lent) fail(409, `Hay ${lent} ejemplares prestados; no puedes dejar menos`)
    await t.query('UPDATE books SET title = $2, author = $3, location_id = $4, copies = $5 WHERE id = $1',
      [id, b.title, b.author, b.locationId, b.copies])
    await setCategories(t, id, b.categoryIds)
  })
}

export function deleteBook(db: Db, id: number, opts: { force?: boolean } = {}): Promise<void> {
  return db.tx(async (t) => {
    if (!(await t.query('SELECT 1 FROM books WHERE id = $1 FOR UPDATE', [id])).length) fail(404, 'El libro no existe')
    if (!opts.force && await openLoanCount(t, id)) fail(409, 'Este libro tiene préstamos abiertos')
    await t.query('DELETE FROM books WHERE id = $1', [id])
  })
}
