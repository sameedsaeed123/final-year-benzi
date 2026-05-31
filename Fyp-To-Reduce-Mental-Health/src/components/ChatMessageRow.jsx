import { formatChatTime } from '../lib/chatFormat.js'

/**
 * Shared patient/therapist/AI message row — timestamps below bubble, max width capped.
 */
export default function ChatMessageRow({
  isMe,
  text,
  createdAt,
  avatar = null,
  className = '',
}) {
  return (
    <div className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${className}`}>
      {!isMe && avatar}
      <div className={`max-w-[min(72%,420px)] flex flex-col gap-1 ${isMe ? 'items-end' : 'items-start'}`}>
        <div
          className={`px-4 py-2.5 text-[13px] leading-relaxed shadow-sm whitespace-pre-wrap ${
            isMe
              ? 'bg-[#0f4e34] text-white rounded-[20px] rounded-br-[4px]'
              : 'bg-white text-[#1a2e22] border border-black/8 rounded-[20px] rounded-bl-[4px]'
          }`}
        >
          {text}
        </div>
        {createdAt && (
          <span className="text-[10px] text-[#9aaa9a] px-1">{formatChatTime(createdAt)}</span>
        )}
      </div>
    </div>
  )
}

export function ChatDayDivider({ label }) {
  return (
    <div className="flex items-center gap-3 py-2">
      <div className="flex-1 h-px bg-black/8" />
      <span className="text-[11px] text-[#7d8b7d] font-medium px-2">{label}</span>
      <div className="flex-1 h-px bg-black/8" />
    </div>
  )
}
