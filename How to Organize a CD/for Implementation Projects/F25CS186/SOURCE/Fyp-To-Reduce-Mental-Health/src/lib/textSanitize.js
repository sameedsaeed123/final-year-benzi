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

const EXTERNAL_CRISIS_RESOURCE =
  /\b(suicide prevention|crisis text line|text home to|988\b|741741|1-800-|273-talk|lifeline|national suicide|immediate healthcare provider|local mental health resources|emergency services|many resources available|hotline|helpline)\b/i

function stripExternalCrisisResources(text) {
  let s = String(text || '').trim()
  if (!s) return s
  s = s.replace(/There are many resources available[^.]*including:?\s*/gi, '')
  return s
    .split('\n')
    .filter((line) => !EXTERNAL_CRISIS_RESOURCE.test(line.trim()))
    .join('\n')
    .replace(/\n{3,}/g, '\n\n')
    .trim()
}

export function sanitizeChatReply(value) {
  if (value == null) return ''
  let s = sanitizeAiText(value)
  const hadExternalResources = EXTERNAL_CRISIS_RESOURCE.test(s)
  s = s.replace(/^\s*[-*•]\s+/gm, '')
  s = s.replace(/^\s*\d+\.\s+/gm, '')
  s = stripExternalCrisisResources(s)
  if (hadExternalResources && s.length < 48) {
    s =
      "I'm glad you reached out. Your therapist has been notified — please message them in the app; they're the right person to support you now."
  }
  s = s.replace(/\n{3,}/g, '\n\n')
  return s.trim()
}
