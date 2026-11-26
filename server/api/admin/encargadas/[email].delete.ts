import { removeEncargada } from '../../../services/encargadas'

export default defineEventHandler(async (event) => {
  await requireEncargada(event)
  const email = decodeURIComponent(getRouterParam(event, 'email') ?? '')
  await removeEncargada(await useDb(), email, useRuntimeConfig(event).adminEmail)
  return { ok: true }
})
