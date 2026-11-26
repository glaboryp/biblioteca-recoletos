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

export function createNeonDb(connectionString: string, pool: Pool = new Pool({ connectionString })): Db {
  // Idle connections dropped by Neon while the function is frozen must not crash the process.
  pool.on('error', (e: Error) => console.error('Postgres pool error', e))
  return {
    query: async (text, params) => (await pool.query(text, params)).rows,
    exec: async (sql) => { await pool.query(sql) },
    async tx(fn) {
      const client = await pool.connect()
      try {
        await client.query('BEGIN')
        const result = await fn(wrapClient(client))
        await client.query('COMMIT')
        client.release()
        return result
      }
      catch (e) {
        try {
          await client.query('ROLLBACK')
          client.release()
        }
        catch (rollbackError) {
          client.release(rollbackError as Error)
        }
        throw e
      }
    },
  }
}

export const applySchema = (db: Db) => db.exec(schema)
