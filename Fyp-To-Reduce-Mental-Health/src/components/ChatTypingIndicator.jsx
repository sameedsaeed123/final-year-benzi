import { Sparkles, User } from 'lucide-react'

/** Inline typing dots — use inside chat panels, not full-page loader */
export default function ChatTypingIndicator({ variant = 'therapist', label }) {
  const isAi = variant === 'ai'

  return (
    <div className="flex items-end gap-2 justify-start">
      <div
        className={`h-7 w-7 rounded-full flex items-center justify-center flex-shrink-0 ${
          isAi ? 'bg-[#0f4e34] text-white' : 'bg-[#e8f3ea] text-[#1f5f4a]'
        }`}
      >
        {isAi ? <Sparkles size={12} /> : <User size={12} />}
      </div>
      <div className="bg-white border border-black/8 rounded-[20px] rounded-bl-[4px] px-4 py-3 shadow-sm">
        {label && <p className="text-[10px] text-[#9aaa9a] mb-1.5">{label}</p>}
        <div className="flex items-center gap-1 h-4">
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#1f5f4a]/60 animate-bounce"
            style={{ animationDelay: '0ms' }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#1f5f4a]/60 animate-bounce"
            style={{ animationDelay: '150ms' }}
          />
          <span
            className="w-1.5 h-1.5 rounded-full bg-[#1f5f4a]/60 animate-bounce"
            style={{ animationDelay: '300ms' }}
          />
        </div>
      </div>
    </div>
  )
}
