import { sendRedirect, useRuntimeConfig } from 'nuxt/server'
import { isEncargada } from '../../services/encargadas'

export default defineOAuthGoogleEventHandler({
  async onSuccess(event, { user }) {
    const allowed = user.email_verified
      && await isEncargada(await useDb(), user.email, useRuntimeConfig().adminEmail)
    if (!allowed) return sendRedirect(event, '/panel/login?error=acceso')
    await setUserSession(event, {
      user: { email: user.email.trim().toLowerCase(), name: user.name ?? user.email, picture: user.picture },
    })
    return sendRedirect(event, '/panel')
  },
  onError(event) {
    return sendRedirect(event, '/panel/login?error=google')
  },
})
