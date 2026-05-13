import mongoose from 'mongoose'

let connected = false

/**
 * Ensures a database name in the path (e.g. ...:5432/?x -> ...:5432/benzi?x).
 * Empty path defaults MongoDB to "test"; we use "benzi" for this app.
 */
export function normalizeMongoUri(uri) {
  if (!uri || typeof uri !== 'string') return uri
  const trimmed = uri.trim()
  // mongodb://user:pass@host:port?query  (no slash before ?)
  const noSlashBeforeQuery = /^(mongodb(?:\+srv)?:\/\/[^/?]+)\?(.+)$/.exec(trimmed)
  if (noSlashBeforeQuery) {
    return `${noSlashBeforeQuery[1]}/benzi?${noSlashBeforeQuery[2]}`
  }
  // mongodb://user:pass@host:port/?query  (empty database)
  const emptyDb = /^(mongodb(?:\+srv)?:\/\/[^/]+)\/(\?.*)?$/.exec(trimmed)
  if (emptyDb) {
    const rest = emptyDb[2] || ''
    return `${emptyDb[1]}/benzi${rest}`
  }
  return trimmed
}

/**
 * Appends authSource=admin when connecting as user "root" (common Docker image)
 * and authSource is not already set.
 */
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
  } catch (e) {
    console.error('[MongoDB] Connection failed. Check URI, port (Mongo default is 27017), authSource, and network/firewall.')
    throw e
  }
  connected = true
  mongoose.connection.on('disconnected', () => {
    connected = false
  })
  return mongoose.connection
}
