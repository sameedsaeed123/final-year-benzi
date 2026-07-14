import mongoose from 'mongoose'

let connected = false


export function normalizeMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return uri
  const trimmed = uri.trim()

  const noSlashBeforeQuery = /^(mongodb(?:\+srv)?:\/\/[^/?]+)\?(.+)$/.exec(trimmed)
  if (noSlashBeforeQuery) {
    return `${noSlashBeforeQuery[1]}/benzi?${noSlashBeforeQuery[2]}`
  }

  const emptyDb = /^(mongodb(?:\+srv)?:\/\/[^/]+)\/(\?.*)?$/.exec(trimmed)
  if (emptyDb) {
    const rest = emptyDb[2] || ''
    return `${emptyDb[1]}/benzi${rest}`
  }
  return trimmed
}


export function ensureAuthSource(uri) {
  if (!uri || /[?&]authSource=/.test(uri)) return uri
  const authSrc = process.env.MONGODB_AUTH_SOURCE
  if (authSrc) {
    return uri + (uri.includes('?') ? '&' : '?') + `authSource=${encodeURIComponent(authSrc)}`
  }
  if (/mongodb(?:\+srv)?:\/\/root:/.test(uri)) {
    return uri + (uri.includes('?') ? '&' : '?') + 'authSource=admin'
  }
  return uri
}

export async function connectDB(uri) {
  if (connected) return mongoose.connection
  let u = uri || process.env.MONGODB_URI
  if (!u) throw new Error('MONGODB_URI is not set')
  u = ensureAuthSource(normalizeMongoUri(u))

  const opts = {
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_MS) || 25000,
    maxPoolSize: 10,
  }

  try {
    await mongoose.connect(u, opts)
    if (process.env.NODE_ENV !== 'production') {
      const safe = u.replace(/:([^:@/]+)@/, ':***@')
      console.log(`[MongoDB] Connected (${safe})`)
    }
  } catch (e) {
    const safe = u.replace(/:([^:@/]+)@/, ':***@')
    console.error('[MongoDB] Connection failed:', e.message)
    console.error('[MongoDB] URI used (password hidden):', safe)
    console.error('[MongoDB] Tip: use ...HOST:PORT/benzi?options (database name before ?), authSource=admin for user root, and allow your IP on the server firewall.')
    throw e
  }
  connected = true
  mongoose.connection.on('disconnected', () => {
    connected = false
  })
  return mongoose.connection
}
