/**
 * Comprehensive crisis / suicidal ideation / self-harm detection.
 * Used for BENZI AI chat, patient goals, and safety alerts.
 *
 * Returns { isCrisis, severity: 'high'|'medium'|null, matchedPhrases: string[], category?: string }
 */

/** Figurative / benign phrases — if the ONLY signal is inside these, do not flag */
const FALSE_POSITIVE_PHRASES = [
  'kill time',
  'killing time',
  'killing me softly',
  'this is killing me',
  'that is killing me',
  "you're killing me",
  'you are killing me',
  'die of laughter',
  'die laughing',
  'want to die laughing',
  'hang out',
  'hangout',
  'shoot me a',
  'shoot me an',
  'end of the day',
  'end of the week',
  'end of the month',
  'overdose of vitamin',
  'hurt myself at the gym',
  'harm myself financially',
  'go die', // gaming trash talk — still risky; keep medium only if isolated
]

const FALSE_POSITIVE_PATTERNS = [
  /\b(die|dying)\s+(of|from)\s+(laugh|boredom|embarrassment)\b/i,
  /\b(food|game|lag)\s+(is\s+)?kill(ing)?\s+me\b/i,
  /\bkill\s+(the|that)\s+(boss|enemy|time)\b/i,
  /\bhang\s+(out|with|at)\b/i,
  /\bend\s+of\s+(the\s+)?(day|week|month|year|semester)\b/i,
]

/** ——— HIGH severity: imminent risk, methods, explicit suicide ——— */
const HIGH_RISK_PHRASES = [
  // Direct suicide intent
  'kill myself',
  'killing myself',
  'killed myself',
  'kms',
  'kys',
  'commit suicide',
  'committed suicide',
  'suicide',
  'suicidal',
  'suicidle',
  'end my life',
  'ending my life',
  'ended my life',
  'take my life',
  'taking my life',
  'want to die',
  'wanna die',
  'wants to die',
  'going to die',
  'gonna die',
  'rather be dead',
  'rather die',
  'die tonight',
  'die today',
  'die now',
  'die soon',
  'plan to die',
  'planning to die',
  'planned to die',
  'going to kill myself',
  'gonna kill myself',

  // No reason to live
  'no reason to live',
  'no reason left to live',
  'not worth living',
  'life is not worth',
  'life isnt worth',
  "life isn't worth",
  'not worth it anymore',
  'better off dead',
  'better off without me',
  'world without me',
  'everyone better without me',
  'burden to everyone',
  'burden on everyone',

  // Self-harm / methods
  'hurt myself',
  'hurting myself',
  'harm myself',
  'harming myself',
  'injure myself',
  'cut myself',
  'cutting myself',
  'cut my wrists',
  'cut my arms',
  'cut my throat',
  'slit my',
  'slitting my',
  'bleed out',
  'bleeding out',
  'knife on throat',
  'knife to throat',
  'knife on my throat',
  'knife at my throat',
  'put knife on',
  'put a knife',
  'put the knife',
  'hang myself',
  'hanging myself',
  'hanged myself',
  'jump off',
  'jump from',
  'jumping off',
  'jump in front',
  'shoot myself',
  'shooting myself',
  'shot myself',
  'overdose',
  'over dose',
  'od on pills',
  'take all my pills',
  'take all the pills',
  'swallow all',
  'poison myself',
  'drown myself',
  'burn myself',
  'starve myself',
  'strangle myself',
  'suffocate myself',
  'carbon monoxide',
  'tie a noose',
  'make a noose',
  'noose around',

  // Disappear / end it
  'want to disappear forever',
  'disappear forever',
  'end it all',
  'ending it all',
  'want to end it',
  'going to end it',
  'end everything',
  'ending everything',
  'final goodbye',
  'last goodbye',
  'say goodbye forever',
  'never wake up',
  "won't wake up",
  'wont wake up',
  'go to sleep forever',
  'sleep forever and',

  // Explicit ask others
  'help me die',
  'help me kill',
  'want you to kill me',
  'kill me now',
  'just kill me',
  'please kill me',

  // Planning
  'suicide note',
  'suicide plan',
  'goodbye note',
  'goodbye letter',
  'last letter',
  'final letter',
  'affairs in order',
  'get affairs in order',
  'giving away my things',
  'giving everything away',
]

/** ——— MEDIUM severity: ideation, hopelessness, passive death wish ——— */
const MEDIUM_RISK_PHRASES = [
  "don't want to be here",
  'dont want to be here',
  "don't want to be alive",
  'dont want to be alive',
  "don't want to live",
  'dont want to live',
  "don't want to exist",
  'dont want to exist',
  'do not want to live',
  'wish i was dead',
  'wish i were dead',
  'wish i could die',
  'wish i would die',
  'wish i was never born',
  'wish i were never born',
  'rather not exist',
  'should not exist',
  "shouldn't exist",
  'tired of living',
  'tired of life',
  'tired of being alive',
  'sick of living',
  'sick of life',
  "can't go on",
  'cant go on',
  "can't do this anymore",
  'cant do this anymore',
  "can't take it anymore",
  'cant take it anymore',
  "can't handle life",
  'cant handle life',
  'no point anymore',
  'no point in living',
  'no point to life',
  'what is the point of living',
  "what's the point of living",
  'nobody would miss me',
  'no one would miss me',
  'no one cares if i die',
  'nobody cares if i die',
  'everyone would be better off',
  'they would be better off',
  'thinking about ending it',
  'thought about ending it',
  'thought about suicide',
  'thinking about suicide',
  'considering suicide',
  'consider suicide',
  'self harm',
  'self-harm',
  'selfharm',
  'self injury',
  'self-injury',
  'want to hurt',
  'want to bleed',
  'want to cut',
  'urge to cut',
  'urge to hurt',
  'give up on life',
  'given up on life',
  'given up on living',
  'lost the will to live',
  'will to live',
  'no will to live',
  'hopeless',
  'no hope left',
  'nothing to live for',
  'nothing left to live for',
  'ready to die',
  'want it to stop',
  'make it stop forever',
  'make the pain stop forever',
  'end the pain forever',
  'permanent solution',
  'not afraid to die',
  'unafraid to die',
  'afraid of dying but',
  'life is pointless',
  'life feels pointless',
  'empty inside',
  'numb inside',
  'hate my life',
  'hate being alive',
  'hate living',
  'want out of this life',
  'escape this life',
  'escape life',
  'leave this world',
  'leave the world',
  'not here tomorrow',
  "won't be here tomorrow",
  'wont be here tomorrow',
  'goodbye world',
  'goodbye cruel world',
  'dark thoughts',
  'intrusive thoughts about death',
  'thoughts of death',
  'thoughts about dying',
  'thinking about dying',
  'thinking about death',
  'death would be',
  'death is better',
  'better if i died',
  'better if i was dead',
  'should just die',
  'might as well die',
  'might as well kill',
  'everyone wants me dead',
  'want to be dead',
  'wanna be dead',
  'rather be gone',
  'want to be gone',
  'gone forever',
]

/** Regex patterns (high) */
const HIGH_RISK_PATTERNS = [
  { re: /\bkill\s+me\b/i, label: 'kill me' },
  { re: /\b(kms|kys)\b/i, label: 'kms/kys' },
  { re: /\bcut\s+my\s+(wrist|throat|neck|arm|leg|vein)s?\b/i, label: 'cut my body' },
  { re: /\b(throat|neck|wrist|arm).{0,25}knife\b/i, label: 'knife + body' },
  { re: /\bknife.{0,25}(throat|neck|wrist)\b/i, label: 'knife + body' },
  { re: /\bhang\s+my\s*self\b/i, label: 'hang myself' },
  { re: /\b(i|im|i'm)\s+(will|gonna|going\s+to)\s+(die|kill\s+myself|end\s+it)\b/i, label: 'intent to die' },
  { re: /\b(want|wanna|need)\s+to\s+(die|end\s+it|disappear)\b/i, label: 'want to die/end' },
  { re: /\b(plan|planning|planned)\s+to\s+(die|kill\s+myself|end\s+my\s+life)\b/i, label: 'planned suicide' },
  { re: /\b\d+\s*pills?\s+(at\s+once|tonight|today)\b/i, label: 'pills quantity' },
  { re: /\b(jump|jumped)\s+(off|from|in\s+front)\b/i, label: 'jump' },
  { re: /\b(shoot|shot)\s+my\s*self\b/i, label: 'shoot myself' },
  { re: /\b(over\s*dose|od)\s+(tonight|today|now)\b/i, label: 'overdose intent' },
  { re: /\bno\s+reason\s+to\s+(live|go\s+on)\b/i, label: 'no reason to live' },
  { re: /\bbetter\s+off\s+(dead|without\s+me)\b/i, label: 'better off dead' },
  { re: /\b(self[\s-]?harm|self[\s-]?injur)\b/i, label: 'self-harm' },
  { re: /\bsuicid[a-z]*\b/i, label: 'suicide stem' },
]

const MEDIUM_RISK_PATTERNS = [
  { re: /\b(don't|dont|do\s+not)\s+want\s+to\s+(live|be\s+here|exist)\b/i, label: 'dont want to live' },
  { re: /\bwish\s+(i|to)\s+(was|were)\s+dead\b/i, label: 'wish dead' },
  { re: /\b(can't|cant)\s+(go\s+on|live|do\s+this|take\s+it)\b/i, label: 'cant go on' },
  { re: /\bno\s+point\s+(in\s+)?(living|life|anymore)\b/i, label: 'no point' },
  { re: /\b(thought|thinking)\s+about\s+(dying|death|suicide|ending)\b/i, label: 'thoughts of death' },
  { re: /\b(tired|sick)\s+of\s+(living|life|being\s+alive)\b/i, label: 'tired of living' },
  { re: /\b(hate|hating)\s+(my\s+)?life\b/i, label: 'hate life' },
  { re: /\bnothing\s+to\s+live\s+for\b/i, label: 'nothing to live for' },
  { re: /\b(give|gave)\s+up\s+on\s+(life|living)\b/i, label: 'give up on life' },
]

/** Multi-keyword: 2+ from different groups → high */
const KEYWORD_CLUSTERS = [
  ['die', 'death', 'dead', 'dying', 'suicide', 'suicidal', 'kms', 'kys'],
  ['kill', 'end', 'harm', 'hurt', 'cut', 'hang', 'jump', 'overdose', 'noose', 'knife', 'pills', 'bleed'],
  ['myself', 'my life', 'my wrist', 'my throat', 'me'],
  ['want', 'wanna', 'going', 'gonna', 'plan', 'tonight', 'today', 'forever', 'stop'],
]

function normalizeForDetection(text) {
  let s = String(text || '').toLowerCase()
  s = s.replace(/[''`]/g, "'")
  s = s.replace(/[""]/g, '"')
  // Basic leetspeak / obfuscation
  const leet = { '0': 'o', '1': 'i', '3': 'e', '4': 'a', '5': 's', '7': 't', '@': 'a', '$': 's' }
  s = s.split('').map((c) => leet[c] || c).join('')
  // Collapse repeated letters (suuuicide → suicide)
  s = s.replace(/(.)\1{2,}/g, '$1$1')
  // Remove zero-width and extra spaces
  s = s.replace(/[\u200b-\u200d\ufeff]/g, '').replace(/\s+/g, ' ').trim()
  return s
}

function isFalsePositive(text) {
  const lower = normalizeForDetection(text)
  for (const fp of FALSE_POSITIVE_PHRASES) {
    if (lower.includes(fp)) return true
  }
  for (const re of FALSE_POSITIVE_PATTERNS) {
    if (re.test(lower)) return true
  }
  return false
}

function countKeywordClusters(text) {
  const lower = normalizeForDetection(text)
  let clustersHit = 0
  const words = []
  for (const cluster of KEYWORD_CLUSTERS) {
    if (cluster.some((kw) => lower.includes(kw))) {
      clustersHit += 1
      words.push(cluster.find((kw) => lower.includes(kw)))
    }
  }
  return { clustersHit, words }
}

function matchPhrases(list, severity, text) {
  const out = []
  for (const phrase of list) {
    if (text.includes(phrase)) out.push({ phrase, severity })
  }
  return out
}

function matchPatterns(list, text) {
  const out = []
  for (const { re, label } of list) {
    if (re.test(text)) out.push({ phrase: label, severity: 'high' })
  }
  return out
}

function matchPatternsMedium(list, text) {
  const out = []
  for (const { re, label } of list) {
    if (re.test(text)) out.push({ phrase: label, severity: 'medium' })
  }
  return out
}

/**
 * Main detector — run on any user-authored text (chat, goals, etc.)
 */
export function detectCrisis(text) {
  const raw = String(text || '').trim()
  if (!raw || raw.length < 2) {
    return { isCrisis: false, severity: null, matchedPhrases: [] }
  }

  const normalized = normalizeForDetection(raw)
  const matched = []

  matched.push(...matchPhrases(HIGH_RISK_PHRASES, 'high', normalized))
  matched.push(...matchPatterns(HIGH_RISK_PATTERNS, normalized))
  matched.push(...matchPhrases(MEDIUM_RISK_PHRASES, 'medium', normalized))
  matched.push(...matchPatternsMedium(MEDIUM_RISK_PATTERNS, normalized))

  // Cluster: 3+ keyword groups → treat as high (e.g. "want" + "die" + "tonight")
  const { clustersHit, words } = countKeywordClusters(normalized)
  if (clustersHit >= 3) {
    matched.push({ phrase: `keyword cluster (${words.filter(Boolean).join(', ')})`, severity: 'high' })
  } else if (clustersHit >= 2 && /\b(die|suicide|kill|end|cut|hang|overdose|knife|noose)\b/.test(normalized)) {
    matched.push({ phrase: `keyword cluster (${words.filter(Boolean).join(', ')})`, severity: 'medium' })
  }

  if (!matched.length) {
    return { isCrisis: false, severity: null, matchedPhrases: [] }
  }

  const hasHigh = matched.some((m) => m.severity === 'high')
  let severity = hasHigh ? 'high' : 'medium'

  // If only medium matches but text is very short aggressive gaming trash, soften
  if (!hasHigh && isFalsePositive(normalized) && matched.length <= 2) {
    const onlyMedium = matched.every((m) => m.severity === 'medium')
    if (onlyMedium && /\bgo\s+die\b/.test(normalized)) {
      return { isCrisis: false, severity: null, matchedPhrases: [] }
    }
  }

  // Strong high phrases override false positive
  const strongHigh = [
    'kill myself',
    'suicide',
    'want to die',
    'end my life',
    'cut myself',
    'knife on throat',
    'knife to throat',
    'hang myself',
    'overdose',
  ]
  const hasStrong = strongHigh.some((p) => normalized.includes(p))

  if (!hasStrong && isFalsePositive(normalized)) {
    const fpOnly = matched.every((m) =>
      ['kill me', 'want to die'].some((x) => m.phrase.includes(x))
    )
    if (fpOnly && /\b(kill\s+time|die\s+of|hang\s+out|end\s+of)\b/.test(normalized)) {
      return { isCrisis: false, severity: null, matchedPhrases: [] }
    }
  }

  const unique = [...new Set(matched.map((m) => m.phrase))]

  return {
    isCrisis: true,
    severity,
    matchedPhrases: unique.slice(0, 8),
  }
}

/** Export counts for tests / admin docs */
export function getCrisisDetectionStats() {
  return {
    highPhrases: HIGH_RISK_PHRASES.length,
    mediumPhrases: MEDIUM_RISK_PHRASES.length,
    highPatterns: HIGH_RISK_PATTERNS.length,
    mediumPatterns: MEDIUM_RISK_PATTERNS.length,
    falsePositiveGuards: FALSE_POSITIVE_PHRASES.length + FALSE_POSITIVE_PATTERNS.length,
  }
}
