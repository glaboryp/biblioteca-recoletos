import { PGlite } from '@electric-sql/pglite'
import { applySchema, createPgliteDb } from '../../server/db/client'

export async function createTestDb() {
  const db = createPgliteDb(new PGlite())
  await applySchema(db)
  return db
}
