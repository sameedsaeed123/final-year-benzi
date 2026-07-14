import { ADMIN_LIST_PAGE_SIZE } from '../lib/adminPagination.js'

export default function AdminPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems = 0,
  pageSize = ADMIN_LIST_PAGE_SIZE,
}) {
  if (!totalItems) return null

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="mt-4 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-black/5 pt-4">
      <p className="text-[12px] text-[#7d8b7d]">
        Showing {start}–{end} of {totalItems}
        {totalPages > 1 && (
          <span className="text-[#9aa89a]">
            {' '}
            · Page {currentPage} of {totalPages}
          </span>
        )}
      </p>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-1.5 text-sm text-[#556b5b]">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="rounded-full border border-black/10 bg-white px-3 py-2 hover:bg-black/5 disabled:opacity-40"
            aria-label="Previous page"
          >
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`min-w-[36px] rounded-full px-3 py-2 ${
                currentPage === page
                  ? 'bg-brand text-white'
                  : 'border border-black/10 bg-white hover:bg-black/5'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="rounded-full border border-black/10 bg-white px-3 py-2 hover:bg-black/5 disabled:opacity-40"
            aria-label="Next page"
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  )
}
