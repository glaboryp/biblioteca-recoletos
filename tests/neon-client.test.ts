import { expect, test, vi } from 'vitest'
import { createNeonDb } from '../server/db/client'

function fakePool(opts: { failRollback?: boolean } = {}) {
  const release = vi.fn()
  const client = {
    query: vi.fn(async (sql: string) => {
      if (sql === 'ROLLBACK' && opts.failRollback) throw new Error('connection lost')
      return { rows: [] }
    }),
    release,
  }
  const pool = { on: vi.fn(), query: vi.fn(), connect: vi.fn(async () => client) }
  return { pool, client, release }
}

test('el pool registra un manejador de errores para conexiones inactivas', () => {
  const { pool } = fakePool()
  createNeonDb('postgres://x', pool as any)
  expect(pool.on).toHaveBeenCalledWith('error', expect.any(Function))
})

test('si la transacción falla y el ROLLBACK también, se conserva el error original y se descarta la conexión', async () => {
  const { pool, release } = fakePool({ failRollback: true })
  const db = createNeonDb('postgres://x', pool as any)
  await expect(db.tx(async () => { throw new Error('boom') })).rejects.toThrow('boom')
  expect(release).toHaveBeenCalledWith(expect.any(Error))
})

test('una transacción correcta libera la conexión normalmente', async () => {
  const { pool, release } = fakePool()
  const db = createNeonDb('postgres://x', pool as any)
  await expect(db.tx(async () => 42)).resolves.toBe(42)
  expect(release).toHaveBeenCalledWith()
})
