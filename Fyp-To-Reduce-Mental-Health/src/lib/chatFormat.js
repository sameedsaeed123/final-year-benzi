export function formatChatTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export function formatChatDay(d) {
  if (!d) return ''
  const date = new Date(d)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

/** @param {Array<{ createdAt?: string|Date }>} messages */
export function groupMessagesByDay(messages) {
  const groups = []
  let currentDay = null
  for (const msg of messages) {
    const day = formatChatDay(msg.createdAt)
    if (day !== currentDay) {
      groups.push({ type: 'day', label: day })
      currentDay = day
    }
    groups.push({ type: 'message', ...msg })
  }
  return groups
}
