/**
 * Clean LLM output for UI: no wrapping quotes, no markdown bold markers.
 */
export function sanitizeAiText(value) {
  if (value == null) return ''
  let s = String(value).trim()
  if (!s) return ''

  s = s.replace(/\*\*([^*]*)\*\*/g, '$1').replace(/\*([^*]*)\*/g, '$1')
  s = s.replace(/^#+\s*/, '')

  for (let i = 0; i < 4; i++) {
    const before = s
    if (
      (s.startsWith('"') && s.endsWith('"')) ||
      (s.startsWith("'") && s.endsWith("'")) ||
      (s.startsWith('“') && s.endsWith('”')) ||
      (s.startsWith('‘') && s.endsWith('’'))
    ) {
      s = s.slice(1, -1).trim()
    }
    if (s === before) break
  }

  return s
}

export function sanitizeGoalRecommendation(rec) {
  if (!rec || typeof rec !== 'object') return rec
  return {
    ...rec,
    title: sanitizeAiText(rec.title),
    description: sanitizeAiText(rec.description),
  }
}

export function sanitizeGoalRecommendations(list) {
  return (Array.isArray(list) ? list : []).map(sanitizeGoalRecommendation)
}
