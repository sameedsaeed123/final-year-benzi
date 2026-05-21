const STORAGE_KEY = 'benzi_token'

export function getApiBase() {
  return import.meta.env.VITE_API_URL || ''
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

/**
 * @param {string} path - e.g. "/auth/login" (no /api prefix)
 * @param {RequestInit} options
 */
export async function api(path, options = {}) {
  const token = getStoredToken()
  const headers = new Headers(options.headers)
  if (!headers.has('Content-Type') && options.body && typeof options.body === 'string') {
    headers.set('Content-Type', 'application/json')
  }
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const url = `${getApiBase()}/api${path}`
  const res = await fetch(url, { ...options, headers, credentials: 'omit' })
  const text = await res.text()

  if (res.status === 502 || res.status === 503) {
    throw new Error(
      'Cannot reach the backend (502). Start the API on port 5000: cd benzi-server && npm run dev — or from repo root: npm install && npm run dev (starts API + website together).'
    )
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
}

/**
 * Multipart upload (no JSON Content-Type).
 * @param {string} path - e.g. "/auth/profile-photo"
 * @param {FormData} formData
 * @param {RequestInit} [options]
 */
export async function apiForm(path, formData, options = {}) {
  const token = getStoredToken()
  const headers = new Headers(options.headers)
  if (token) headers.set('Authorization', `Bearer ${token}`)

  const url = `${getApiBase()}/api${path}`
  const res = await fetch(url, {
    ...options,
    method: options.method || 'POST',
    body: formData,
    headers,
    credentials: 'omit',
  })
  const text = await res.text()

  if (res.status === 502 || res.status === 503) {
    throw new Error(
      'Cannot reach the backend (502). Start the API on port 5000: cd benzi-server && npm run dev — or from repo root: npm install && npm run dev (starts API + website together).'
    )
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
}
