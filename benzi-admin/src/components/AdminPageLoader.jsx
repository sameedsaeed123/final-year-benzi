import { Loader2 } from 'lucide-react'

export default function AdminPageLoader({ label = 'Loading…', className = '' }) {
  return (
    <div
      className={`flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-black/5 bg-white shadow-sm ${className}`}
    >
      <Loader2 className="h-9 w-9 animate-spin text-brand mb-3" />
      <p className="text-sm font-semibold text-brand">{label}</p>
      <p className="text-[11px] text-[#7d8b7d] mt-1">Please wait</p>
    </div>
  )
}
