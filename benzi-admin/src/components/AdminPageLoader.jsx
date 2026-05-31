import { Loader2 } from 'lucide-react'

/** Full-panel first load */
export default function AdminPageLoader({ label = 'Loading…', className = '' }) {
  return (
    <div
      className={`flex min-h-[180px] flex-col items-center justify-center rounded-2xl border border-black/5 bg-white shadow-sm ${className}`}
      role="status"
      aria-live="polite"
    >
      <Loader2 className="h-8 w-8 animate-spin text-brand mb-2" />
      <p className="text-sm font-semibold text-brand">{label}</p>
    </div>
  )
}

/** Inline skeleton while paginating — keeps layout stable */
export function AdminTableSkeleton({ rows = 5, cols = 5 }) {
  return (
    <div className="animate-pulse space-y-2" aria-hidden>
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="flex gap-3">
          {Array.from({ length: cols }).map((__, j) => (
            <div key={j} className="h-10 flex-1 rounded-lg bg-[#eef2ee]" />
          ))}
        </div>
      ))}
    </div>
  )
}
