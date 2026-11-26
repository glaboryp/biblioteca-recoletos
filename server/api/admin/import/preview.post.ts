import { previewImport } from '../../../services/import'

export default defineEventHandler(async (event) => {
  await requireEncargada(event)
  const body = await readBody(event)
  return previewImport(await useDb(), String(body?.text ?? ''))
})
