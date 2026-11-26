import type { H3Event } from 'h3'
import { isEncargada } from '../services/encargadas'

export async function requireEncargada(event: H3Event): Promise<string> {
  const { user } = await requireUserSession(event)
  if (!(await isEncargada(await useDb(), user.email, useRuntimeConfig(event).adminEmail))) {
    await clearUserSession(event)
    throw createError({ statusCode: 403, statusMessage: 'Ya no tienes acceso al panel' })
  }
  return user.email
}
