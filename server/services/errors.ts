import { createError } from 'h3'

export function fail(statusCode: number, message: string): never {
  throw createError({ statusCode, statusMessage: message, message })
}
