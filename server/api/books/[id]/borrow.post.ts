import { borrow } from '../../../services/loans'

export default defineEventHandler(async (event) => {
  const body = await readBody(event)
  return { id: await borrow(await useDb(), idParam(event), body?.name) }
})
