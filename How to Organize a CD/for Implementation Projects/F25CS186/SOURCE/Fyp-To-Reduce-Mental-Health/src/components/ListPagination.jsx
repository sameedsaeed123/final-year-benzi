const PAGE_SIZE = 5

export { PAGE_SIZE }

export default function ListPagination({
  currentPage,
  totalPages,
  onPageChange,
  totalItems = 0,
  pageSize = PAGE_SIZE,
}) {
  if (!totalItems) return null

  const start = (currentPage - 1) * pageSize + 1
  const end = Math.min(currentPage * pageSize, totalItems)

  return (
    <div className="mt-6 flex flex-col sm:flex-row items-center justify-between gap-3 border-t border-black/10 pt-4 text-sm text-[#556b5b]">
      <span>
        Showing {start}–{end} of {totalItems}
        {totalPages > 1 && (
          <span className="text-[#9aa89a]"> · Page {currentPage} of {totalPages}</span>
        )}
      </span>

      {totalPages > 1 && (
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => onPageChange(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="rounded-full border border-black/10 bg-white px-3 py-2 hover:bg-[#f0f4ee] disabled:opacity-40"
            aria-label="Previous page"
          >
            &lt;
          </button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              type="button"
              onClick={() => onPageChange(page)}
              className={`min-w-[36px] rounded-full px-3 py-2 text-[13px] font-semibold ${
                currentPage === page
                  ? 'bg-[#0f4e34] text-white'
                  : 'border border-black/10 bg-white hover:bg-[#f0f4ee]'
              }`}
            >
              {page}
            </button>
          ))}
          <button
            type="button"
            onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="rounded-full border border-black/10 bg-white px-3 py-2 hover:bg-[#f0f4ee] disabled:opacity-40"
            aria-label="Next page"
          >
            &gt;
          </button>
        </div>
      )}
    </div>
  )
}
