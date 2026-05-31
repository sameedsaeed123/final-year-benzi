import { useCallback, useEffect, useRef, useState } from 'react'
import { api } from '../lib/api.js'

/**
 * Fetch admin API data with loading + error state.
 * @param {() => Promise<any>} fetcher
 * @param {unknown[]} deps
 * @param {{ keepPrevious?: boolean }} options
 */
export function useAdminQuery(fetcher, deps = [], options = {}) {
  const { keepPrevious = false } = options
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [error, setError] = useState('')
  const dataRef = useRef(null)

  useEffect(() => {
    dataRef.current = data
  }, [data])

  const reload = useCallback(async () => {
    const showFullLoader = !(keepPrevious && dataRef.current)
    if (showFullLoader) setLoading(true)
    else setRefreshing(true)
    setError('')
    try {
      const json = await fetcher()
      const next = json?.data ?? json
      setData(next)
      dataRef.current = next
      return json
    } catch (e) {
      setError(e.message || 'Failed to load data')
      if (!keepPrevious) setData(null)
      throw e
    } finally {
      setLoading(false)
      setRefreshing(false)
    }
  }, deps)

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, loading, refreshing, error, setError, reload }
}

/** GET with optional query string (include page & limit for lists). */
export function useAdminGet(path, deps = [], options = {}) {
  return useAdminQuery(() => api(path, { method: 'GET' }), [path, ...deps], options)
}

const DEFAULT_LIMIT = 5

/** Paginated list from backend (?page=&limit=5). Keeps previous rows visible while changing page. */
export function useAdminPagedGet(pathBase, deps = []) {
  const [page, setPage] = useState(1)
  const path = `${pathBase}${pathBase.includes('?') ? '&' : '?'}page=${page}&limit=${DEFAULT_LIMIT}`
  const { data, loading, refreshing, error, setError, reload } = useAdminGet(path, deps, {
    keepPrevious: true,
  })

  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? Math.max(1, Math.ceil(total / DEFAULT_LIMIT) || 1)

  return {
    data,
    loading,
    refreshing,
    error,
    setError,
    reload,
    page,
    setPage,
    total,
    totalPages,
    limit: data?.limit ?? DEFAULT_LIMIT,
  }
}
