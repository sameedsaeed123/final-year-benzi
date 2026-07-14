/** Consistent white content panel used across admin sections. */
export default function AdminPanel({ title, subtitle, children, className = '' }) {
  return (
    <div className={`rounded-2xl border border-black/5 bg-white shadow-sm overflow-hidden ${className}`}>
      {(title || subtitle) && (
        <div className="px-5 py-4 border-b border-black/5">
          {title && <p className="text-[15px] font-semibold text-[#0f3a2b]">{title}</p>}
          {subtitle && <p className="text-[12px] text-[#7d8b7d] mt-0.5">{subtitle}</p>}
        </div>
      )}
      <div className="p-5">{children}</div>
    </div>
  )
}
