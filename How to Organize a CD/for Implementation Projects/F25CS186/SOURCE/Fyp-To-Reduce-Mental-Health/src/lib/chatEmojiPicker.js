export const CHAT_EMOJI_CATEGORIES = [
  {
    id: 'smileys',
    label: '😀',
    emojis: [
      '😀', '😃', '😄', '😁', '😅', '😂', '🤣', '😊', '🙂', '😉', '😍', '🥰', '😘', '😗', '😋', '😛',
      '😜', '🤪', '🤗', '🤭', '🤔', '😐', '😑', '😶', '🙄', '😏', '😣', '😥', '😮', '🤐', '😯', '😪',
      '😴', '😌', '😔', '😢', '😭', '😤', '😡', '🤬', '😱', '😨', '😰', '😓', '🥺', '😇', '🤩', '🥳',
    ],
  },
  {
    id: 'gestures',
    label: '👍',
    emojis: [
      '👍', '👎', '👏', '🙌', '🤝', '🙏', '💪', '🤞', '✌️', '🤟', '🤘', '👌', '🫶', '❤️', '🧡', '💛',
      '💚', '💙', '💜', '🖤', '🤍', '🤎', '💔', '❣️', '💕', '💞', '💓', '💗', '💖', '💘', '💝', '🔥',
    ],
  },
  {
    id: 'nature',
    label: '🌸',
    emojis: [
      '⭐', '🌟', '✨', '💫', '🌈', '☀️', '🌤️', '🌸', '🌺', '🌻', '🌷', '🍀', '🌿', '🌙', '⚡', '❄️',
      '🐶', '🐱', '🐻', '🦋', '🐝', '🌊', '🎉', '🎊', '🎈', '🎁', '🏆', '🥇', '🎯', '💯', '✅', '❌',
    ],
  },
]

export function isValidChatReaction(emoji) {
  const trimmed = String(emoji || '').trim()
  if (!trimmed || [...trimmed].length > 4) return false
  try {
    return /^(\p{Extended_Pictographic}\uFE0F?([\u200D]\p{Extended_Pictographic}\uFE0F?)*)+$/u.test(trimmed)
  } catch {
    return trimmed.length <= 8
  }
}
