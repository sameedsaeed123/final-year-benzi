import { useEffect, useRef, useState } from 'react'
import { Pencil, Trash2, Plus } from 'lucide-react'
import { CHAT_QUICK_REACTIONS } from '../lib/chatMessageActions.js'
import ChatEmojiPicker from './ChatEmojiPicker.jsx'

export default function ChatMessageMenu({
  open,
  anchorRef,
  isMe,
  canEdit,
  canDelete,
  myReaction,
  onReact,
  onEdit,
  onDelete,
  onClose,
}) {
  const menuRef = useRef(null)
  const [pickerOpen, setPickerOpen] = useState(false)
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    if (!open) {
      setVisible(false)
      setPickerOpen(false)
      return undefined
    }
    const frame = requestAnimationFrame(() => setVisible(true))
    return () => cancelAnimationFrame(frame)
  }, [open])

  useEffect(() => {
    if (!open) return undefined

    const onPointer = (e) => {
      if (menuRef.current?.contains(e.target)) return
      if (anchorRef?.current?.contains(e.target)) return
      onClose?.()
    }
    const onKey = (e) => {
      if (e.key === 'Escape') {
        if (pickerOpen) setPickerOpen(false)
        else onClose?.()
      }
    }

    document.addEventListener('mousedown', onPointer)
    document.addEventListener('touchstart', onPointer)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onPointer)
      document.removeEventListener('touchstart', onPointer)
      document.removeEventListener('keydown', onKey)
    }
  }, [open, anchorRef, onClose, pickerOpen])

  if (!open) return null

  const rect = anchorRef?.current?.getBoundingClientRect()
  const menuWidth = pickerOpen ? 300 : 280
  const top = rect ? rect.top - 10 : 0
  const left = rect
    ? isMe
      ? Math.max(12, rect.right - menuWidth)
      : Math.min(window.innerWidth - menuWidth - 12, rect.left)
    : 0

  const pickReaction = (emoji) => {
    onReact?.(myReaction === emoji ? '' : emoji)
    onClose?.()
  }

  const hasActions = canEdit || canDelete

  return (
    <div
      ref={menuRef}
      className={`fixed z-50 origin-bottom overflow-hidden rounded-[22px] border border-black/[0.06] bg-white/95 backdrop-blur-md transition-opacity duration-200 ease-[cubic-bezier(0.22,1,0.36,1)] ${
        visible ? 'opacity-100' : 'opacity-0'
      }`}
      style={{
        top,
        left,
        width: menuWidth,
        transform: visible ? 'translateY(-100%) scale(1)' : 'translateY(calc(-100% + 8px)) scale(0.94)',
        transition: 'transform 0.2s cubic-bezier(0.22, 1, 0.36, 1), opacity 0.2s ease-out',
        boxShadow: '0 12px 40px rgba(0,0,0,0.12), 0 2px 10px rgba(0,0,0,0.06)',
      }}
      role="menu"
    >
      <div className="flex items-center justify-center gap-0.5 px-3 py-2.5">
        {CHAT_QUICK_REACTIONS.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => pickReaction(emoji)}
            className={`h-10 w-10 rounded-full text-[22px] flex items-center justify-center transition-all duration-150 ease-out hover:scale-110 active:scale-95 ${
              myReaction === emoji
                ? 'bg-[#e8f3ea] ring-2 ring-[#0f4e34]/25 shadow-sm'
                : 'hover:bg-[#f0f7f2]'
            }`}
            aria-label={`React ${emoji}`}
          >
            {emoji}
          </button>
        ))}
        <button
          type="button"
          onClick={() => setPickerOpen((v) => !v)}
          className={`ml-0.5 h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-150 ease-out hover:scale-105 active:scale-95 ${
            pickerOpen
              ? 'bg-[#0f4e34] text-white shadow-md'
              : 'bg-[#eef1ee] text-[#5c6b5e] hover:bg-[#e4ebe4]'
          }`}
          aria-label="More reactions"
          aria-expanded={pickerOpen}
        >
          <Plus size={17} strokeWidth={2.25} />
        </button>
      </div>

      {pickerOpen && (
        <div className="overflow-hidden transition-all duration-200 ease-out">
          <ChatEmojiPicker onPick={pickReaction} />
        </div>
      )}

      {hasActions && (
        <>
          <div className="mx-3 h-px bg-black/[0.07]" />
          <div className="flex flex-col gap-0.5 p-1.5">
            {canEdit && (
              <button
                type="button"
                onClick={() => {
                  onEdit?.()
                  onClose?.()
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium text-[#1a2e22] hover:bg-[#f5f9f5] active:bg-[#eef3ee] transition-colors duration-150"
                role="menuitem"
              >
                <Pencil size={15} className="text-[#1f5f4a]" />
                Edit
              </button>
            )}
            {canDelete && (
              <button
                type="button"
                onClick={() => {
                  onDelete?.()
                  onClose?.()
                }}
                className="w-full flex items-center justify-center gap-2 rounded-xl px-4 py-2.5 text-[13px] font-medium text-red-600 hover:bg-red-50 active:bg-red-100/70 transition-colors duration-150"
                role="menuitem"
              >
                <Trash2 size={15} />
                Delete
              </button>
            )}
          </div>
        </>
      )}
    </div>
  )
}
