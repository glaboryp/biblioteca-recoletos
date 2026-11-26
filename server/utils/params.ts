import type { H3Event } from 'h3'
import type { Kind } from '../services/taxonomy'

export function idParam(event: H3Event): number {
  const id = Number(getRouterParam(event, 'id'))
  if (!Number.isInteger(id) || id < 1) throw createError({ statusCode: 400, statusMessage: 'Identificador no válido' })
  return id
}

export function kindParam(event: H3Event): Kind {
  const kind = getRouterParam(event, 'kind')
  if (kind !== 'locations' && kind !== 'categories') throw createError({ statusCode: 404, statusMessage: 'No encontrado' })
  return kind
}
