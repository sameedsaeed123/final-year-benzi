import { Send } from 'lucide-react'

export default function ChatComposer({
  value,
  onChange,
  onSend,
  placeholder = 'Type a message…',
  disabled = false,
  multiline = false,
}) {
  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      onSend?.()
    }
  }

  const inputClass =
    'flex-1 rounded-full border border-black/10 bg-[#f5f9f5] px-5 py-2.5 text-[13px] text-[#1a2e22] outline-none focus:border-[#0f4e34] focus:ring-2 focus:ring-[#0f4e34]/15 transition disabled:opacity-60'

  return (
    <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-black/8">
      <div className="flex items-center gap-2">
        {multiline ? (
          <textarea
            rows={1}
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={`${inputClass} resize-none rounded-2xl max-h-28`}
          />
        ) : (
          <input
            type="text"
            value={value}
            onChange={onChange}
            onKeyDown={handleKeyDown}
            placeholder={placeholder}
            disabled={disabled}
            className={inputClass}
          />
        )}
        <button
          type="button"
          onClick={() => onSend?.()}
          disabled={disabled || !String(value).trim()}
          className="h-10 w-10 rounded-full bg-[#0f4e34] text-white flex items-center justify-center shadow-sm hover:bg-[#0d4530] transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          aria-label="Send message"
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  )
}
