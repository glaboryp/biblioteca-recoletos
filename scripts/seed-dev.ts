import { mkdirSync } from 'node:fs'
import { PGlite } from '@electric-sql/pglite'
import { applySchema, createPgliteDb } from '../server/db/client'
import { applyImport } from '../server/services/import'
import { borrow } from '../server/services/loans'

// Sample data for local development only; stop `pnpm dev` before running.
mkdirSync('./.data', { recursive: true })
const db = createPgliteDb(new PGlite('./.data/dev-db'))
await applySchema(db)
await applyImport(db, `titulo;autor;ubicacion;categorias;ejemplares
Camino;San Josemaría Escrivá;Oratorio · Estantería 1;Oración|Clásicos;3
Surco;San Josemaría Escrivá;Oratorio · Estantería 1;Oración;1
Forja;San Josemaría Escrivá;Oratorio · Estantería 1;Oración;2
Historia de un alma;Santa Teresa de Lisieux;Oratorio · Estantería 2;Santos|Clásicos;2
Libro de la vida;Santa Teresa de Jesús;Oratorio · Estantería 2;Santos|Clásicos;1
Las Confesiones;San Agustín;Sala de estudio · Balda alta;Clásicos;1
Introducción a la vida devota;San Francisco de Sales;Sala de estudio · Balda alta;Vida interior;1
Hablar con Dios. Tomo I;Francisco Fernández-Carvajal;Oratorio · Estantería 1;Oración;4
La imitación de Cristo;Tomás de Kempis;Salón · Mueble bajo;Clásicos|Vida interior;2
Dios y el mundo;Joseph Ratzinger;Salón · Mueble bajo;Teología;1
`)
const [{ id: camino }] = await db.query<{ id: number }>(`SELECT id FROM books WHERE title = 'Camino'`)
const [{ id: libro }] = await db.query<{ id: number }>(`SELECT id FROM books WHERE title = 'Libro de la vida'`)
const [{ id: historia }] = await db.query<{ id: number }>(`SELECT id FROM books WHERE title = 'Historia de un alma'`)
await borrow(db, camino!, 'María')
await borrow(db, camino!, 'Lucía Fernández')
await borrow(db, libro!, 'Carmen')
await borrow(db, historia!, 'Ana')
console.log('Sample data loaded into .data/dev-db')
process.exit(0)
