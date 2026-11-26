import { updateBook } from '../../../services/books'

export default defineEventHandler(async (event) => {
  await requireEncargada(event)
  await updateBook(await useDb(), idParam(event), await readBody(event))
  return { ok: true }
})
