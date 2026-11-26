import { createError } from 'h3'

export function fail(statusCode: number, message: string): never {
  throw createError({ statusCode, statusMessage: message, message })
}

export function requiredText(value: unknown, max: number, label: string): string {
  const text = typeof value === 'string' ? value.trim() : ''
  if (!text) fail(400, `${label} es obligatorio`)
  if (text.length > max) fail(400, `${label} no puede superar ${max} caracteres`)
  return text
}

export function optionalText(value: unknown, max: number, label: string): string | null {
  return typeof value === 'string' && value.trim() ? requiredText(value, max, label) : null
}

export function isPgError(e: unknown, code: string): boolean {
  return (e as { code?: string })?.code === code
}
