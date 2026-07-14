export const CHAT_QUICK_REACTIONS = ['👍', '❤️', '😂', '😮', '😢', '🙏']

export const CHAT_EDIT_WINDOW_MS = 15 * 60 * 1000

export function canEditMessage(message, myUserId) {
  if (!message || message.isDeleted || String(message.id).startsWith('temp-')) return false
  if (String(message.senderUserId) !== String(myUserId)) return false
  if (!String(message.text || '').trim()) return false
  const age = Date.now() - new Date(message.createdAt).getTime()
  return age <= CHAT_EDIT_WINDOW_MS
}

export function canDeleteMessage(message, myUserId) {
  if (!message || message.isDeleted || String(message.id).startsWith('temp-')) return false
  return String(message.senderUserId) === String(myUserId)
}
