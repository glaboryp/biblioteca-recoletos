import type { Db } from '../db/client'
import { fail, isPgError } from './errors'

const normalize = (email: string) => (email ?? '').trim().toLowerCase()

export async function isEncargada(db: Db, email: string, adminEmail: string): Promise<boolean> {
  const e = normalize(email)
  if (!e) return false
  if (e === normalize(adminEmail)) return true
  return (await db.query('SELECT 1 FROM encargadas WHERE email = $1', [e])).length > 0
}

export async function listEncargadas(db: Db, adminEmail: string) {
  const rows = await db.query<{ email: string; added_by: string }>('SELECT email, added_by FROM encargadas ORDER BY email')
  return [
    { email: normalize(adminEmail), addedBy: '', isAdmin: true },
    ...rows.map(r => ({ email: r.email, addedBy: r.added_by, isAdmin: false })),
  ]
}

export async function addEncargada(db: Db, email: string, addedBy: string, adminEmail: string): Promise<void> {
  const e = normalize(email)
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e)) fail(400, 'El email no es válido')
  if (e === normalize(adminEmail)) fail(409, 'Ya es administradora')
  try {
    await db.query('INSERT INTO encargadas (email, added_by) VALUES ($1, $2)', [e, normalize(addedBy)])
  }
  catch (err) {
    if (isPgError(err, '23505')) fail(409, 'Ya es encargada')
    throw err
  }
}

export async function removeEncargada(db: Db, email: string, adminEmail: string): Promise<void> {
  const e = normalize(email)
  if (e === normalize(adminEmail)) fail(403, 'La administradora global no se puede quitar')
  const rows = await db.query('DELETE FROM encargadas WHERE email = $1 RETURNING email', [e])
  if (!rows.length) fail(404, 'No es encargada')
}
