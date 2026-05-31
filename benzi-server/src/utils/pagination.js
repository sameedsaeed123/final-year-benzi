export const DEFAULT_LIST_PAGE_SIZE = 5
export const MAX_LIST_PAGE_SIZE = 50

/**
 * @param {Record<string, unknown>} query
 * @param {number} [defaultLimit]
 */
export function parsePaginationQuery(query = {}, defaultLimit = DEFAULT_LIST_PAGE_SIZE) {
  const page = Math.max(1, Number(query.page) || 1)
  const limit = Math.min(
    MAX_LIST_PAGE_SIZE,
    Math.max(1, Number(query.limit) || defaultLimit)
  )
  const skip = (page - 1) * limit
  const totalPages = (total) => Math.max(1, Math.ceil(total / limit) || 1)

  return {
    page,
    limit,
    skip,
    totalPages,
    meta(total) {
      return {
        page,
        limit,
        total,
        totalPages: totalPages(total),
      }
    },
  }
}
