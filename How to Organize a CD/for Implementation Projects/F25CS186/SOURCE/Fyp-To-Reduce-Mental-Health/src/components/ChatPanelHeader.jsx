import { ArrowLeft } from 'lucide-react'

export default function ChatPanelHeader({
  avatar,
  title,
  subtitle,
  status,
  onBack,
  action = null,
}) {
  return (
    <div className="flex items-center gap-3 px-4 py-3 border-b border-black/8 bg-white flex-shrink-0">
      {onBack && (
        <button
          type="button"
          onClick={onBack}
          className="p-2 -ml-1 rounded-full hover:bg-[#f0f4ee] transition text-[#1f5f4a] md:hidden"
          aria-label="Back"
        >
          <ArrowLeft size={18} />
        </button>
      )}
      {avatar}
      <div className="min-w-0 flex-1">
        <p className="text-[14px] font-semibold text-[#111] truncate">{title}</p>
        <p className="text-[11px] text-[#7d8b7d] truncate">
          {status || subtitle}
        </p>
      </div>
      {action}
    </div>
  )
}
