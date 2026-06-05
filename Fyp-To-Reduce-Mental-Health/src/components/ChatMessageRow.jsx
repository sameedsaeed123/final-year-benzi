import { useRef, useState, useCallback } from 'react'
import { ChevronDown } from 'lucide-react'
import { formatChatTime } from '../lib/chatFormat.js'
import { resolveMediaUrl } from '../lib/api.js'
import { canEditMessage, canDeleteMessage } from '../lib/chatMessageActions.js'
import VoiceMessagePlayer from './VoiceMessagePlayer.jsx'
import ChatMessageMenu from './ChatMessageMenu.jsx'

function formatBytes(size) {
  if (!size) return ''
  if (size < 1024) return `${size} B`
  if (size < 1024 * 1024) return `${Math.round(size / 1024)} KB`
  return `${(size / (1024 * 1024)).toFixed(1)} MB`
}

function ChatAttachment({ attachment, isMe }) {
  if (!attachment?.type || !attachment?.url) return null

  const url = resolveMediaUrl(attachment.url)
  const name = attachment.name || 'Attachment'

  if (attachment.type === 'image') {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <img
          src={url}
          alt={name}
          className="max-w-full max-h-56 rounded-xl object-cover"
          loading="lazy"
        />
      </a>
    )
  }

  if (attachment.type === 'video') {
    return (
      <video
        src={url}
        controls
        playsInline
        className="max-w-full max-h-56 rounded-xl bg-black/5"
        preload="metadata"
      />
    )
  }

  if (attachment.type === 'audio') {
    return <VoiceMessagePlayer src={url} isMe={isMe} seed={url || name} />
  }

  if (attachment.type === 'pdf') {
    return (
      <a
        href={url}
        target="_blank"
        rel="noopener noreferrer"
        className={`flex items-center gap-2 rounded-xl px-3 py-2 text-[12px] ${
          isMe ? 'bg-white/15 hover:bg-white/20' : 'bg-[#f0f7f2] hover:bg-[#e6f0e8]'
        }`}
      >
        <span className="truncate flex-1">{name}</span>
      </a>
    )
  }

  return null
}

function ReactionPills({ reactions = [], isMe, myUserId, onReact }) {
  if (!reactions.length) return null

  const grouped = reactions.reduce((acc, r) => {
    acc[r.emoji] = acc[r.emoji] || []
    acc[r.emoji].push(r)
    return acc
  }, {})

  return (
    <div className={`flex flex-wrap gap-1 mt-1 ${isMe ? 'justify-end' : 'justify-start'}`}>
      {Object.entries(grouped).map(([emoji, list]) => {
        const mine = list.some((r) => String(r.userId) === String(myUserId))
        return (
          <button
            key={emoji}
            type="button"
            onClick={() => onReact?.(mine ? '' : emoji)}
            className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[12px] border shadow-sm transition-all duration-150 hover:scale-105 active:scale-95 ${
              mine
                ? 'bg-[#e8f3ea] border-[#0f4e34]/20 text-[#0f4e34]'
                : 'bg-white border-black/8 text-[#4a5c4a]'
            }`}
          >
            <span>{emoji}</span>
            {list.length > 1 && <span className="text-[10px] font-medium">{list.length}</span>}
          </button>
        )
      })}
    </div>
  )
}

export default function ChatMessageRow({
  messageId,
  isMe,
  senderUserId,
  senderLabel = '',
  text,
  attachment = null,
  reactions = [],
  editedAt = null,
  isDeleted = false,
  createdAt,
  avatar = null,
  className = '',
  myUserId,
  onEdit,
  onDelete,
  onReact,
}) {
  const bubbleRef = useRef(null)
  const [menuOpen, setMenuOpen] = useState(false)
  const longPressRef = useRef(null)

  const hasAttachment = !!attachment?.type && !isDeleted
  const hasText = !!String(text || '').trim() && !isDeleted
  const isVoiceOnly = hasAttachment && attachment?.type === 'audio' && !hasText

  const myReaction = reactions.find((r) => String(r.userId) === String(myUserId))?.emoji || ''
  const showMenu = !!onReact && !!messageId && !isDeleted && !String(messageId).startsWith('temp-')
  const editable = canEditMessage(
    { id: messageId, senderUserId, text, isDeleted, createdAt },
    myUserId
  )
  const deletable = canDeleteMessage(
    { id: messageId, senderUserId, isDeleted },
    myUserId
  )

  const openMenu = useCallback(() => {
    if (showMenu) setMenuOpen(true)
  }, [showMenu])

  const onPointerDown = () => {
    clearTimeout(longPressRef.current)
    longPressRef.current = setTimeout(openMenu, 450)
  }

  const onPointerUp = () => clearTimeout(longPressRef.current)

  return (
    <div className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'} ${className}`}>
      {!isMe && avatar}
      <div className={`max-w-[min(72%,420px)] flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
        {senderLabel && !isMe && (
          <span className="text-[11px] font-semibold text-[#0f4e34] px-1 mb-0.5">{senderLabel}</span>
        )}
        <div className={`relative group flex items-end gap-1 ${isMe ? 'flex-row-reverse' : 'flex-row'}`}>
          <div
            ref={bubbleRef}
            onPointerDown={onPointerDown}
            onPointerUp={onPointerUp}
            onPointerLeave={onPointerUp}
            className={`text-[13px] leading-relaxed shadow-sm select-text ${
              hasText ? 'whitespace-pre-wrap px-4 py-2.5' : ''
            } ${
              isMe
                ? 'bg-[#0f4e34] text-white rounded-[20px] rounded-br-[4px]'
                : 'bg-white text-[#1a2e22] border border-black/8 rounded-[20px] rounded-bl-[4px]'
            } ${isVoiceOnly ? 'px-3 py-2.5' : hasAttachment && !hasText ? 'p-2' : ''} ${
              isDeleted ? 'px-4 py-2.5 italic opacity-80' : ''
            }`}
          >
            {isDeleted ? (
              <span className={isMe ? 'text-white/75' : 'text-[#7d8b7d]'}>This message was deleted</span>
            ) : (
              <>
                {hasAttachment && (
                  <div className={hasText ? 'mb-2' : ''}>
                    <ChatAttachment attachment={attachment} isMe={isMe} />
                    {attachment.size > 0 && !hasText && attachment.type !== 'audio' && (
                      <p className={`text-[10px] mt-1 ${isMe ? 'text-white/70' : 'text-[#7d8b7d]'}`}>
                        {formatBytes(attachment.size)}
                      </p>
                    )}
                  </div>
                )}
                {hasText && text}
              </>
            )}
          </div>

          {showMenu && (
            <button
              type="button"
              onClick={openMenu}
              className={`h-7 w-7 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 focus:opacity-100 transition-all duration-200 hover:bg-black/[0.05] flex-shrink-0 ${
                isMe ? 'text-[#7d8b7d]' : 'text-[#9aaa9a]'
              } ${menuOpen ? 'opacity-100 bg-black/[0.05]' : ''}`}
              aria-label="Message options"
            >
              <ChevronDown size={14} />
            </button>
          )}

          <ChatMessageMenu
            open={menuOpen}
            anchorRef={bubbleRef}
            isMe={isMe}
            canEdit={editable}
            canDelete={deletable}
            myReaction={myReaction}
            onReact={onReact}
            onEdit={onEdit}
            onDelete={onDelete}
            onClose={() => setMenuOpen(false)}
          />
        </div>

        <ReactionPills reactions={reactions} isMe={isMe} myUserId={myUserId} onReact={onReact} />

        {createdAt && (
          <span className="text-[10px] text-[#9aaa9a] px-1 flex items-center gap-1">
            {formatChatTime(createdAt)}
            {editedAt && !isDeleted && <span className="italic">· edited</span>}
          </span>
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
