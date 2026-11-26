import type { Db } from '../db/client'
import { fail, requiredText } from './errors'

export async function borrow(db: Db, bookId: number, borrowerName: string): Promise<number> {
  const name = requiredText(borrowerName, 80, 'Tu nombre')
  return db.tx(async (t) => {
    const [book] = await t.query<{ copies: number }>('SELECT copies FROM books WHERE id = $1 FOR UPDATE', [bookId])
    if (!book) fail(404, 'El libro no existe')
    const [{ n }] = await t.query<{ n: number }>(
      'SELECT count(*)::int AS n FROM loans WHERE book_id = $1 AND returned_at IS NULL', [bookId])
    if (n >= book.copies) fail(409, 'No quedan ejemplares libres')
    const [{ id }] = await t.query<{ id: number }>(
      'INSERT INTO loans (book_id, borrower_name) VALUES ($1, $2) RETURNING id', [bookId, name])
    return id
  })
}

export async function returnLoan(db: Db, loanId: number): Promise<void> {
  const rows = await db.query('UPDATE loans SET returned_at = now() WHERE id = $1 AND returned_at IS NULL RETURNING id', [loanId])
  if (rows.length) return
  if (!(await db.query('SELECT 1 FROM loans WHERE id = $1', [loanId])).length) fail(404, 'El préstamo no existe')
  fail(409, 'Este préstamo ya estaba devuelto')
}
