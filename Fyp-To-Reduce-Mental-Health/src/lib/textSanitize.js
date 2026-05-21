/** Strip LLM wrapping quotes and markdown from displayed text */
export function sanitizeAiText(value) {
  if (value == null) return ''
  let s = String(value).trim()
  if (!s) return ''
  s = s.replace(/\*\*([^*]*)\*\*/g, '$1').replace(/\*([^*]*)\*/g, '$1')
  for (let i = 0; i < 4; i++) {
    const before = s
    if (
      (s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'"))
    ) {
      s = s.slice(1, -1).trim()
    }
    if (s === before) break
  }
  return s
}
