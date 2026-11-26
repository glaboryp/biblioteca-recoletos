import { listEncargadas } from '../../../services/encargadas'

export default defineEventHandler(async (event) => {
  await requireEncargada(event)
  return listEncargadas(await useDb(), useRuntimeConfig(event).adminEmail)
})
