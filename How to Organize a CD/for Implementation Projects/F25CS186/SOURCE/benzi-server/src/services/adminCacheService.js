import Redis from 'ioredis'
import { redisConfig } from '../config/email.js'

const PREFIX = 'benzi:admin:'
const DEFAULT_TTL = 60

let client = null
let clientFailed = false

function getRedis() {
  if (clientFailed) return null
  if (client) return client
  try {
    client = new Redis({
      host: redisConfig.host,
      port: redisConfig.port,
      password: redisConfig.password,
      db: redisConfig.db,
      maxRetriesPerRequest: 1,
      lazyConnect: true,
      enableOfflineQueue: false,
    })
    client.on('error', () => {})
    return client
  } catch {
    clientFailed = true
    return null
  }
}

async function ensureConnected(redis) {
  if (redis.status === 'ready') return true
  try {
    await redis.connect()
    await redis.ping()
    return true
  } catch {
    clientFailed = true
    client = null
    return false
  }
}

export function adminCacheKey(req) {
  const q = req.query && Object.keys(req.query).length ? JSON.stringify(req.query) : ''
  return `${PREFIX}${req.method}:${req.path}${q}`
}

export async function getAdminCache(key) {
  const redis = getRedis()
  if (!redis || !(await ensureConnected(redis))) return null
  try {
    const raw = await redis.get(key)
    return raw ? JSON.parse(raw) : null
  } catch {
    return null
  }
}

export async function setAdminCache(key, value, ttlSeconds = DEFAULT_TTL) {
  const redis = getRedis()
  if (!redis || !(await ensureConnected(redis))) return
  try {
    await redis.set(key, JSON.stringify(value), 'EX', ttlSeconds)
  } catch {
    /* no-op */
  }
}

export async function invalidateAdminCache() {
  const redis = getRedis()
  if (!redis || !(await ensureConnected(redis))) return
  try {
    const keys = await redis.keys(`${PREFIX}*`)
    if (keys.length) await redis.del(...keys)
  } catch {
    /* no-op */
  }
}

/**
 * Cache GET admin JSON responses in Redis (graceful fallback if Redis down).
 */
export function adminCacheMiddleware(ttlSeconds = DEFAULT_TTL) {
  return async (req, res, next) => {
    if (req.method !== 'GET') return next()

    const key = adminCacheKey(req)
    const cached = await getAdminCache(key)
    if (cached) {
      res.setHeader('X-Admin-Cache', 'HIT')
      return res.status(200).json(cached)
    }

    const originalJson = res.json.bind(res)
    res.json = (body) => {
      if (res.statusCode >= 200 && res.statusCode < 300 && body?.success) {
        void setAdminCache(key, body, ttlSeconds)
      }
      res.setHeader('X-Admin-Cache', 'MISS')
      return originalJson(body)
    }
    next()
  }
}
