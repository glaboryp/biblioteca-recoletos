import type { Catalog, CatalogBook, Named, OpenLoan } from '../../shared/types'
import type { Db } from '../db/client'

export async function getCatalog(db: Db): Promise<Catalog> {
  const [books, links, loans, locations, categories] = await Promise.all([
    db.query(`SELECT b.id, b.title, b.author, b.copies, l.id AS location_id, l.name AS location_name
              FROM books b JOIN locations l ON l.id = b.location_id ORDER BY lower(b.title), b.id`),
    db.query(`SELECT bc.book_id, c.id, c.name FROM book_categories bc
              JOIN categories c ON c.id = bc.category_id ORDER BY lower(c.name)`),
    db.query(`SELECT id, book_id, borrower_name, borrowed_at FROM loans
              WHERE returned_at IS NULL ORDER BY borrowed_at, id`),
    db.query<Named>(`SELECT id, name FROM locations ORDER BY lower(name)`),
    db.query<Named>(`SELECT id, name FROM categories ORDER BY lower(name)`),
  ])

  const byId = new Map<number, CatalogBook>(books.map(b => [b.id, {
    id: b.id,
    title: b.title,
    author: b.author,
    copies: b.copies,
    location: { id: b.location_id, name: b.location_name },
    categories: [],
    loans: [],
  }]))
  for (const c of links) byId.get(c.book_id)?.categories.push({ id: c.id, name: c.name })
  for (const l of loans) {
    const loan: OpenLoan = { id: l.id, borrowerName: l.borrower_name, borrowedAt: new Date(l.borrowed_at).toISOString() }
    byId.get(l.book_id)?.loans.push(loan)
  }
  return { books: [...byId.values()], locations, categories }
}
