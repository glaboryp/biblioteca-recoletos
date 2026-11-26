import { createBook } from '../../../services/books'

export default defineEventHandler(async (event) => {
  await requireEncargada(event)
  return { id: await createBook(await useDb(), await readBody(event)) }
})
