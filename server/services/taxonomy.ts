import type { Db } from '../db/client'
import { fail, isPgError, requiredText } from './errors'

export type Kind = 'locations' | 'categories'

const labels: Record<Kind, { one: string; the: string }> = {
  locations: { one: 'una ubicación', the: 'La ubicación' },
  categories: { one: 'una categoría', the: 'La categoría' },
}

function check(kind: Kind) {
  if (!Object.hasOwn(labels, kind)) fail(404, 'No encontrado')
  return labels[kind]
}

async function write<T>(kind: Kind, run: () => Promise<T>): Promise<T> {
  try {
    return await run()
  }
  catch (e) {
    if (isPgError(e, '23505')) fail(409, `Ya existe ${labels[kind].one} con ese nombre`)
    throw e
  }
}

export async function createTerm(db: Db, kind: Kind, name: string): Promise<number> {
  check(kind)
  const clean = requiredText(name, 60, 'El nombre')
  return write(kind, async () =>
    (await db.query<{ id: number }>(`INSERT INTO ${kind} (name) VALUES ($1) RETURNING id`, [clean]))[0]!.id)
}

export async function renameTerm(db: Db, kind: Kind, id: number, name: string): Promise<void> {
  const label = check(kind)
  const clean = requiredText(name, 60, 'El nombre')
  const rows = await write(kind, () => db.query(`UPDATE ${kind} SET name = $2 WHERE id = $1 RETURNING id`, [id, clean]))
  if (!rows.length) fail(404, `${label.the} no existe`)
}

export async function deleteTerm(db: Db, kind: Kind, id: number): Promise<void> {
  const label = check(kind)
  let rows: unknown[]
  try {
    rows = await db.query(`DELETE FROM ${kind} WHERE id = $1 RETURNING id`, [id])
  }
  catch (e) {
    if (isPgError(e, '23503') || isPgError(e, '23001')) fail(409, 'Mueve primero los libros de esta ubicación')
    throw e
  }
  if (!rows.length) fail(404, `${label.the} no existe`)
}

export async function findOrCreateTerm(db: Db, kind: Kind, name: string): Promise<number> {
  check(kind)
  const clean = requiredText(name, 60, 'El nombre')
  const [found] = await db.query<{ id: number }>(`SELECT id FROM ${kind} WHERE lower(name) = lower($1)`, [clean])
  return found?.id ?? createTerm(db, kind, clean)
}
