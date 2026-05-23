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

const REPLACE_THERAPIST_PATTERNS = [
  /\binstead of (seeing |going to |talking to )?your therapist\b/gi,
  /\byou don'?t need (a )?therapist\b/gi,
  /\bi can be your therapist\b/gi,
  /\bskip your (therapy )?appointment\b/gi,
  /\bno need (for|to see) (a )?therapist\b/gi,
]

export function enforceTherapistBoundaries(text) {
  let s = String(text || '').trim()
  if (!s) return s
  for (const re of REPLACE_THERAPIST_PATTERNS) {
    if (re.test(s)) {
      s = s.replace(re, 'alongside your therapist')
      if (!/your therapist/i.test(s)) {
        s += ' Please bring this to your therapist — they guide your care.'
      }
      break
    }
  }
  return s
}

/** Strip markdown/bullets from AI chat replies for display */
export function sanitizeChatReply(text) {
  let s = sanitizeAiText(text)
  s = s.replace(/^\s*[-*•]\s+/gm, '')
  s = s.replace(/^\s*\d+\.\s+/gm, '')
  s = s.replace(/\n{3,}/g, '\n\n')
  return enforceTherapistBoundaries(s.trim())
}
