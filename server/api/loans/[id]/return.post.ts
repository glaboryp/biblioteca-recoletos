import { returnLoan } from '../../../services/loans'

export default defineEventHandler(async (event) => {
  await returnLoan(await useDb(), idParam(event))
  return { ok: true }
})
