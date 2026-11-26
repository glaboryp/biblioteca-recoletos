import { deleteBook } from '../../../services/books'

export default defineEventHandler(async (event) => {
  await requireEncargada(event)
  await deleteBook(await useDb(), idParam(event), { force: getQuery(event).force === '1' })
  return { ok: true }
})
