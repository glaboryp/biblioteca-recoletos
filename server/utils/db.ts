import { mkdirSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { applySchema, createNeonDb, createPgliteDb, type Db } from '../db/client'

let db: Db | undefined
let ready: Promise<void> | undefined

export async function useDb(): Promise<Db> {
  if (!db) {
    const url = useRuntimeConfig().databaseUrl || process.env.DATABASE_URL
    if (url) {
      db = createNeonDb(url)
    }
    else {
      if (process.env.NODE_ENV === 'production') throw new Error('DATABASE_URL is required in production')
      mkdirSync('./.data', { recursive: true })
      db = createPgliteDb(new PGlite('./.data/dev-db'))
      ready = applySchema(db)
    }
  }
  await ready
  return db
}
