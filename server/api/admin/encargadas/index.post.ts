import { addEncargada } from '../../../services/encargadas'

export default defineEventHandler(async (event) => {
  const me = await requireEncargada(event)
  const body = await readBody(event)
  await addEncargada(await useDb(), body?.email, me, useRuntimeConfig(event).adminEmail)
  return { ok: true }
})
