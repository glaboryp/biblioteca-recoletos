import { PGlite } from '@electric-sql/pglite'
import { applySchema, createPgliteDb } from '../../server/db/client'

let template: Promise<PGlite> | undefined

export async function createTestDb() {
  template ??= (async () => {
    const pg = new PGlite()
    await applySchema(createPgliteDb(pg))
    return pg
  })()
  return createPgliteDb(await (await template).clone())
}
