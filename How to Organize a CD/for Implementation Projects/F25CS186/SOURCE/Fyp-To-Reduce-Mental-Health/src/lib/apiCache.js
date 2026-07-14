import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from './api.js'

const mem = new Map()
const SS_PREFIX = 'benzi_cache:'
const DEFAULT_FRESH_MS = 20000

function readPersist(key) {
  try {
    const raw = sessionStorage.getItem(SS_PREFIX + key)
    return raw ? JSON.parse(raw) : undefined
  } catch {
    return undefined
  }
}

function writePersist(key, entry) {
  try {
    sessionStorage.setItem(SS_PREFIX + key, JSON.stringify(entry))
  } catch {
    /* quota / private mode — in-memory cache still works */
  }
}

export function getCached(key) {
  if (mem.has(key)) return mem.get(key)
  const persisted = readPersist(key)
  if (persisted) {
    mem.set(key, persisted)
    return persisted
  }
  return undefined
}

export function setCached(key, data) {
  const entry = { data, ts: Date.now() }
  mem.set(key, entry)
  writePersist(key, entry)
}

export function invalidateCache(prefix) {
  for (const key of [...mem.keys()]) {
    if (!prefix || key.startsWith(prefix)) mem.delete(key)
  }
  try {
    for (let i = sessionStorage.length - 1; i >= 0; i -= 1) {
      const raw = sessionStorage.key(i)
      if (!raw || !raw.startsWith(SS_PREFIX)) continue
      const key = raw.slice(SS_PREFIX.length)
      if (!prefix || key.startsWith(prefix)) sessionStorage.removeItem(raw)
    }
  } catch {
    /* ignore */
  }
}

export async function cachedFetch(path, { freshMs = DEFAULT_FRESH_MS, force = false, silent } = {}) {
  const cached = getCached(path)
  if (!force && cached && Date.now() - cached.ts < freshMs) return cached.data
  const useSilent = silent ?? Boolean(cached)
  const json = await api(path, { method: 'GET', silent: useSilent })
  const data = json?.data
  setCached(path, data)
  return data
}

export function useCachedGet(path, { enabled = true, freshMs = DEFAULT_FRESH_MS } = {}) {
  const initial = enabled && path ? getCached(path) : undefined
  const [data, setData] = useState(initial ? initial.data : null)
  const [loading, setLoading] = useState(!initial && enabled && Boolean(path))
  const [error, setError] = useState(null)
  const mounted = useRef(true)

  const run = useCallback(
    async (background) => {
      if (!enabled || !path) return
      try {
        const json = await api(path, { method: 'GET', silent: background })
        if (!mounted.current) return
        const payload = json?.data
        setCached(path, payload)
        setData(payload)
        setError(null)
      } catch (e) {
        if (mounted.current) setError(e)
      } finally {
        if (mounted.current) setLoading(false)
      }
    },
    [path, enabled]
  )

  useEffect(() => {
    mounted.current = true
    if (!enabled || !path) {
      setLoading(false)
      return () => {
        mounted.current = false
      }
    }
    const cached = getCached(path)
    if (cached) {
      setData(cached.data)
      setLoading(false)
      if (Date.now() - cached.ts >= freshMs) void run(true)
    } else {
      setLoading(true)
      void run(false)
    }
    return () => {
      mounted.current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [path, enabled])

  const refresh = useCallback(() => run(true), [run])

  return { data, loading, error, refresh, setData }
}
