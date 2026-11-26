import { beforeEach, expect, test } from 'vitest'
import type { Db } from '../server/db/client'
import { addEncargada, isEncargada, listEncargadas, removeEncargada } from '../server/services/encargadas'
import { createTestDb } from './helpers/db'

const ADMIN = 'recoletosuniversitario@gmail.com'
let db: Db
beforeEach(async () => { db = await createTestDb() })

test('el admin global siempre es encargada aunque no esté en la tabla', async () => {
  expect(await isEncargada(db, ADMIN, ADMIN)).toBe(true)
})

test('isEncargada ignora mayúsculas y espacios', async () => {
  await addEncargada(db, 'maria@gmail.com ', ADMIN, ADMIN)
  expect(await isEncargada(db, 'MARIA@gmail.com', ADMIN)).toBe(true)
  expect(await isEncargada(db, ' Recoletosuniversitario@Gmail.com ', ADMIN)).toBe(true)
})

test('desconocido no es encargada', async () => {
  expect(await isEncargada(db, 'otra@gmail.com', ADMIN)).toBe(false)
})

test('sin adminEmail configurado, un email vacío no da acceso', async () => {
  expect(await isEncargada(db, '', '')).toBe(false)
})

test('addEncargada con email inválido → 400', async () => {
  await expect(addEncargada(db, 'maria', ADMIN, ADMIN)).rejects.toMatchObject({ statusCode: 400 })
  await expect(addEncargada(db, 'maria@', ADMIN, ADMIN)).rejects.toMatchObject({ statusCode: 400 })
})

test('addEncargada duplicada → 409', async () => {
  await addEncargada(db, 'maria@gmail.com', ADMIN, ADMIN)
  await expect(addEncargada(db, 'Maria@gmail.com', ADMIN, ADMIN)).rejects.toMatchObject({ statusCode: 409 })
})

test('añadir al admin global → 409 "Ya es administradora"', async () => {
  await expect(addEncargada(db, 'RecoletosUniversitario@gmail.com', ADMIN, ADMIN)).rejects.toMatchObject({ statusCode: 409, message: 'Ya es administradora' })
})

test('quitar al admin global → 403', async () => {
  await expect(removeEncargada(db, ADMIN, ADMIN)).rejects.toMatchObject({ statusCode: 403 })
})

test('quitar a quien no está → 404', async () => {
  await expect(removeEncargada(db, 'nadie@gmail.com', ADMIN)).rejects.toMatchObject({ statusCode: 404 })
})

test('tras removeEncargada deja de ser encargada', async () => {
  await addEncargada(db, 'maria@gmail.com', ADMIN, ADMIN)
  await removeEncargada(db, 'MARIA@gmail.com', ADMIN)
  expect(await isEncargada(db, 'maria@gmail.com', ADMIN)).toBe(false)
})

test('listEncargadas pone al admin primero con isAdmin', async () => {
  await addEncargada(db, 'zoe@gmail.com', ADMIN, ADMIN)
  await addEncargada(db, 'ana@gmail.com', 'zoe@gmail.com', ADMIN)
  expect(await listEncargadas(db, ADMIN)).toEqual([
    { email: ADMIN, addedBy: '', isAdmin: true },
    { email: 'ana@gmail.com', addedBy: 'zoe@gmail.com', isAdmin: false },
    { email: 'zoe@gmail.com', addedBy: ADMIN, isAdmin: false },
  ])
})
