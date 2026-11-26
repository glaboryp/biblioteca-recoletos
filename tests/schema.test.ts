import { expect, test } from 'vitest'
import { applySchema } from '../server/db/client'
import { createTestDb } from './helpers/db'

test('applySchema es idempotente', async () => {
  const db = await createTestDb()
  await applySchema(db)
  expect(await db.query('SELECT count(*)::int AS n FROM books')).toEqual([{ n: 0 }])
})

test('nombres de ubicación únicos sin distinguir mayúsculas', async () => {
  const db = await createTestDb()
  await db.query(`INSERT INTO locations (name) VALUES ('Oratorio')`)
  await expect(db.query(`INSERT INTO locations (name) VALUES ('ORATORIO')`)).rejects.toThrow()
})

test('tx hace rollback si falla', async () => {
  const db = await createTestDb()
  await expect(db.tx(async (t) => {
    await t.query(`INSERT INTO locations (name) VALUES ('A')`)
    throw new Error('boom')
  })).rejects.toThrow('boom')
  expect(await db.query('SELECT * FROM locations')).toEqual([])
})
