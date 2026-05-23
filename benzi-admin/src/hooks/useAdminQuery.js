import { useCallback, useEffect, useState } from 'react'
import { api } from '../lib/api.js'

/**
 * Fetch admin API data with loading + error state.
 * @param {() => Promise<any>} fetcher - returns api() json
 * @param {unknown[]} deps - useEffect deps
 */
export function useAdminQuery(fetcher, deps = []) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const reload = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const json = await fetcher()
      setData(json?.data ?? json)
      return json
    } catch (e) {
      setError(e.message || 'Failed to load data')
      setData(null)
      throw e
    } finally {
      setLoading(false)
    }
  }, deps)

  useEffect(() => {
    void reload()
  }, [reload])

  return { data, loading, error, setError, reload }
}

/** Simple helper for one-off GET paths. */
export function useAdminGet(path, deps = []) {
  return useAdminQuery(() => api(path, { method: 'GET' }), [path, ...deps])
}
