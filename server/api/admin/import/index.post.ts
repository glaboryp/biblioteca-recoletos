import { applyImport } from '../../../services/import'

export default defineEventHandler(async (event) => {
  await requireEncargada(event)
  const body = await readBody(event)
  return applyImport(await useDb(), String(body?.text ?? ''))
})
