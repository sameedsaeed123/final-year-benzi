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

const EXTERNAL_CRISIS_RESOURCE =
  /\b(suicide prevention|crisis text line|text home to|988\b|741741|1-800-|273-talk|lifeline|national suicide|immediate healthcare provider|local mental health resources|emergency services|many resources available|hotline|helpline)\b/i

const APP_CRISIS_FALLBACK =
  "I'm glad you reached out. Your therapist has been notified — please message them in the app; they're the right person to support you now."

/** Remove US hotlines and external resource lists from LLM output. */
export function stripExternalCrisisResources(text) {
  let s = String(text || '').trim()
  if (!s) return s

  s = s.replace(/There are many resources available[^.]*including:?\s*/gi, '')
  s = s.replace(
    /(?:National Suicide[^.]*\.|Crisis Text Line[^.]*\.|Text HOME to \d+[^.]*\.|Your immediate healthcare provider[^.]*\.|Local mental health resources[^.]*\.)/gi,
    ''
  )

  s = s
    .split('\n')
    .filter((line) => {
      const t = line.trim()
      if (!t) return true
      return !EXTERNAL_CRISIS_RESOURCE.test(t)
    })
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()

  return s
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
  const hadExternalResources = EXTERNAL_CRISIS_RESOURCE.test(s)
  s = s.replace(/^\s*[-*•]\s+/gm, '')
  s = s.replace(/^\s*\d+\.\s+/gm, '')
  s = stripExternalCrisisResources(s)
  if (hadExternalResources && s.length < 48) {
    s = APP_CRISIS_FALLBACK
  }
  s = s.replace(/\n{3,}/g, '\n\n')
  return enforceTherapistBoundaries(s.trim())
}
