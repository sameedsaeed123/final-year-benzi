import { useState } from 'react'
import { CHAT_EMOJI_CATEGORIES } from '../lib/chatEmojiPicker.js'

export default function ChatEmojiPicker({ onPick, className = '' }) {
  const [category, setCategory] = useState(CHAT_EMOJI_CATEGORIES[0].id)

  const active = CHAT_EMOJI_CATEGORIES.find((c) => c.id === category) || CHAT_EMOJI_CATEGORIES[0]

  return (
    <div className={`border-t border-black/[0.07] ${className}`}>
      <div className="flex items-center justify-center gap-1.5 px-3 pt-2.5 pb-2">
        {CHAT_EMOJI_CATEGORIES.map((cat) => (
          <button
            key={cat.id}
            type="button"
            onClick={() => setCategory(cat.id)}
            className={`h-9 w-9 rounded-xl text-[18px] flex items-center justify-center transition-all duration-150 ${
              category === cat.id
                ? 'bg-[#e8f3ea] shadow-sm scale-105'
                : 'hover:bg-[#f5f9f5] hover:scale-105 active:scale-95'
            }`}
            aria-label={`${cat.id} emojis`}
          >
            {cat.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-8 gap-px px-2 pb-2.5 max-h-[160px] overflow-y-auto overscroll-contain scroll-smooth">
        {active.emojis.map((emoji) => (
          <button
            key={emoji}
            type="button"
            onClick={() => onPick?.(emoji)}
            className="h-9 w-full rounded-xl text-[21px] flex items-center justify-center hover:bg-[#f0f7f2] active:scale-90 transition-all duration-100"
            aria-label={`React ${emoji}`}
          >
            {emoji}
          </button>
        ))}
      </div>
    </div>
  )
}
