/** Public app name shown in OpenRouter / external API attribution (not localhost). */
export const APP_NAME = process.env.APP_NAME || 'Benzi'

/** Site URL for API referer headers — avoids "localhost:5173" in provider dashboards. */
export function getAppPublicUrl() {
  const explicit = String(process.env.APP_PUBLIC_URL || '').trim()
  if (explicit) return explicit.replace(/\/$/, '')

  const frontend = String(process.env.FRONTEND_URL || '').trim()
  if (frontend && !/localhost|127\.0\.0\.1/i.test(frontend)) {
    return frontend.replace(/\/$/, '')
  }

  return 'https://benzi.app'
}

export function getOpenRouterAttributionHeaders() {
  return {
    'HTTP-Referer': getAppPublicUrl(),
    'X-Title': APP_NAME,
  }
}
