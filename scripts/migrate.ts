import { applySchema, createNeonDb } from '../server/db/client'

const url = process.env.NUXT_DATABASE_URL
if (!url) throw new Error('Set NUXT_DATABASE_URL')
await applySchema(createNeonDb(url))
console.log('Schema applied')
process.exit(0)
