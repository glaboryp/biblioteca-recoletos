import type { PGlite, Transaction } from '@electric-sql/pglite'
import { Pool, type PoolClient } from '@neondatabase/serverless'
import { schema } from './schema'

export interface Db {
  query<T = any>(text: string, params?: unknown[]): Promise<T[]>
  tx<T>(fn: (db: Db) => Promise<T>): Promise<T>
  exec(sql: string): Promise<void>
}

function wrapPglite(pg: PGlite | Transaction): Db {
  const db: Db = {
    query: async (text, params) => (await pg.query<any>(text, params)).rows,
    exec: async (sql) => { await pg.exec(sql) },
    tx: (fn) => ('transaction' in pg ? pg.transaction((t) => fn(wrapPglite(t))) : fn(db)),
  }
  return db
}

export const createPgliteDb = (pg: PGlite): Db => wrapPglite(pg)

function wrapClient(client: PoolClient): Db {
  const db: Db = {
    query: async (text, params) => (await client.query(text, params)).rows,
    exec: async (sql) => { await client.query(sql) },
    tx: (fn) => fn(db),
  }
  return db
}

export function createNeonDb(connectionString: string): Db {
  const pool = new Pool({ connectionString })
  return {
    query: async (text, params) => (await pool.query(text, params)).rows,
    exec: async (sql) => { await pool.query(sql) },
    async tx(fn) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        const result = await fn(wrapClient(client))
        await client.query('COMMIT')
        return result
      }
      catch (e) {
        await client.query('ROLLBACK')
        throw e
      }
      finally {
        client.release()
      }
    },
  }
}

export const applySchema = (db: Db) => db.exec(schema)
