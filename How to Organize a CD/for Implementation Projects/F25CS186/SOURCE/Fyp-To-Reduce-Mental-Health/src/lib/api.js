const STORAGE_KEY = 'benzi_token'

export function getApiBase() {
  return import.meta.env.VITE_API_URL || ''
}

export function resolveMediaUrl(url) {
  if (!url || typeof url !== 'string') return ''
  const trimmed = url.trim()
  if (!trimmed) return ''
  if (/^(https?:|data:)/i.test(trimmed)) return trimmed
  if (trimmed.startsWith('/api/')) {
    const base = getApiBase()
    return base ? `${base}${trimmed}` : trimmed
  }
  return trimmed
}

export const DEFAULT_AVATAR = '/images/therapist-profile-image.png'

export function resolveAvatarUrl(url, fallback = DEFAULT_AVATAR) {
  const resolved = resolveMediaUrl(url)
  return resolved || fallback
}

export function getStoredToken() {
  return sessionStorage.getItem(STORAGE_KEY) || localStorage.getItem(STORAGE_KEY)
}

export function setStoredToken(token, remember) {
  sessionStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(STORAGE_KEY)
  if (!token) return
  if (remember) localStorage.setItem(STORAGE_KEY, token)
  else sessionStorage.setItem(STORAGE_KEY, token)
}

export function clearStoredToken() {
  sessionStorage.removeItem(STORAGE_KEY)
  localStorage.removeItem(STORAGE_KEY)
}

let activeRequests = 0

function startRequest() {
  activeRequests++
  if (activeRequests === 1) {
    window.dispatchEvent(new CustomEvent('api-loading-start'))
  }
}

function endRequest() {
  activeRequests = Math.max(0, activeRequests - 1)
  if (activeRequests === 0) {
    window.dispatchEvent(new CustomEvent('api-loading-end'))
  }
}

const BACKEND_UNREACHABLE_MSG =
  'Cannot reach the backend. Start the API on port 5000: cd benzi-server && npm run dev — or from repo root: npm run dev.'

export async function api(path, options = {}) {
  const { silent, ...fetchOptions } = options
  if (!silent) startRequest()
  try {
    const token = getStoredToken()
    const headers = new Headers(fetchOptions.headers)
    if (!headers.has('Content-Type') && fetchOptions.body && typeof fetchOptions.body === 'string') {
      headers.set('Content-Type', 'application/json')
    }
    if (token) headers.set('Authorization', `Bearer ${token}`)

    const url = `${getApiBase()}/api${path}`
    const res = await fetch(url, { ...fetchOptions, headers, credentials: 'omit' })
    const text = await res.text()

    if (res.status === 502) {
      throw new Error(BACKEND_UNREACHABLE_MSG)
    }

    let json
    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      if (res.status >= 500) throw new Error(BACKEND_UNREACHABLE_MSG)
      throw new Error('Invalid server response')
    }
    if (!res.ok) {
      const err = new Error(json.message || res.statusText || 'Request failed')
      err.statusCode = json.statusCode || res.status
      err.errors = json.errors
      err.body = json
      throw err
    }
    return json
  } catch (e) {
    if (e instanceof TypeError && String(e.message).includes('fetch')) {
      throw new Error(BACKEND_UNREACHABLE_MSG)
    }
    throw e
  } finally {
    if (!silent) endRequest()
  }
}

export async function apiForm(path, formData, options = {}) {
  const { silent, ...fetchOptions } = options
  if (!silent) startRequest()
  try {
    const token = getStoredToken()
    const headers = new Headers(fetchOptions.headers)
    if (token) headers.set('Authorization', `Bearer ${token}`)

    const url = `${getApiBase()}/api${path}`
    const res = await fetch(url, {
      ...fetchOptions,
      method: fetchOptions.method || 'POST',
      body: formData,
      headers,
      credentials: 'omit',
    })
    const text = await res.text()

    if (res.status === 502) {
      throw new Error(BACKEND_UNREACHABLE_MSG)
    }

    let json
    try {
      json = text ? JSON.parse(text) : {}
    } catch {
      throw new Error('Invalid server response')
    }
    if (!res.ok) {
      const err = new Error(json.message || res.statusText || 'Request failed')
      err.statusCode = json.statusCode || res.status
      err.errors = json.errors
      err.body = json
      throw err
    }
    return json
  } finally {
    if (!silent) endRequest()
  }
}

