import { getCatalog } from '../services/catalog'

export default defineEventHandler(async () => getCatalog(await useDb()))
