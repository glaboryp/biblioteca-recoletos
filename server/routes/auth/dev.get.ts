export default defineEventHandler(async (event) => {
  if (!import.meta.dev) throw createError({ statusCode: 404, statusMessage: 'Not Found' })
  await setUserSession(event, { user: { email: useRuntimeConfig(event).adminEmail, name: 'Desarrollo' } })
  return sendRedirect(event, '/panel')
})
