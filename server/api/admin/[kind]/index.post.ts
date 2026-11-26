import { createTerm } from '../../../services/taxonomy'

export default defineEventHandler(async (event) => {
  await requireEncargada(event)
  const body = await readBody(event)
  return { id: await createTerm(await useDb(), kindParam(event), body?.name) }
})
