import { renameTerm } from '../../../services/taxonomy'

export default defineEventHandler(async (event) => {
  await requireEncargada(event)
  const body = await readBody(event)
  await renameTerm(await useDb(), kindParam(event), idParam(event), body?.name)
  return { ok: true }
})
