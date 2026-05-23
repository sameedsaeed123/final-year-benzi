import { env } from '../config/environment.js'

function normalizeOrigin(value) {
  if (!value || typeof value !== 'string') return ''
  const trimmed = value.trim().replace(/\/$/, '')
  try {
    if (trimmed.startsWith('http://') || trimmed.startsWith('https://')) {
      return new URL(trimmed).origin
    }
  } catch {
    return ''
  }
  return trimmed
}

/** Origins allowed for Stripe return URLs and CORS-related redirects. */
export function getAllowedFrontendOrigins() {
  const list = [env.FRONTEND_URL, process.env.FRONTEND_URLS || '']
    .join(',')
    .split(',')
    .map(normalizeOrigin)
    .filter(Boolean)

  if (env.NODE_ENV !== 'production') {
    list.push(
      'http://localhost:5173',
      'http://127.0.0.1:5173',
      'http://localhost:3000',
      'http://benzi.mentalhealth:5173',
      'https://benzi.mentalhealth:5173'
    )
  }

  return [...new Set(list)]
}

/**
 * Pick frontend base URL for Stripe success/cancel redirects.
 * Prefers the tab the user actually used (localhost:5173), not a stale .env domain.
 */
export function resolveFrontendBaseUrl(req) {
  const allowed = getAllowedFrontendOrigins()
  const candidates = [
    req.body?.returnOrigin,
    req.headers?.origin,
    req.headers?.referer ? safeOriginFromReferer(req.headers.referer) : null,
  ]
    .map(normalizeOrigin)
    .filter(Boolean)

  for (const origin of candidates) {
    if (allowed.includes(origin)) return origin
    if (env.NODE_ENV !== 'production' && isLocalDevOrigin(origin)) {
      return origin
    }
  }

  return normalizeOrigin(env.FRONTEND_URL) || 'http://localhost:5173'
}

function safeOriginFromReferer(referer) {
  try {
    return new URL(referer).origin
  } catch {
    return ''
  }
}

function isLocalDevOrigin(origin) {
  try {
    const { hostname } = new URL(origin)
    return (
      hostname === 'localhost' ||
      hostname === '127.0.0.1' ||
      hostname.endsWith('.local') ||
      hostname === 'benzi.mentalhealth'
    )
  } catch {
    return false
  }
}
