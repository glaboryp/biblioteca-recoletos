import { deleteTerm } from '../../../services/taxonomy'

export default defineEventHandler(async (event) => {
  await requireEncargada(event)
  await deleteTerm(await useDb(), kindParam(event), idParam(event))
  return { ok: true }
})
