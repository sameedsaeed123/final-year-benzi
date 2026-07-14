/** Standard page size for all admin tables and lists. */
export const ADMIN_LIST_PAGE_SIZE = 5

/**
 * @param {Array} items
 * @param {number} page - 1-based
 * @param {number} [pageSize]
 */
export function paginateList(items, page, pageSize = ADMIN_LIST_PAGE_SIZE) {
  const list = items || []
  const totalItems = list.length
  const totalPages = Math.max(1, Math.ceil(totalItems / pageSize) || 1)
  const currentPage = Math.min(Math.max(1, page), totalPages)
  const start = (currentPage - 1) * pageSize

  return {
    items: list.slice(start, start + pageSize),
    totalPages,
    currentPage,
    totalItems,
    pageSize,
    startIndex: start,
  }
}
