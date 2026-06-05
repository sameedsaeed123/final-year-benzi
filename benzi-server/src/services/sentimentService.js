import * as ollama from './ollamaService.js'

const POSITIVE_WORDS = [
  'good', 'great', 'happy', 'better', 'calm', 'hopeful', 'grateful', 'motivated',
  'relaxed', 'peaceful', 'excited', 'improving', 'progress',
]

const NEGATIVE_WORDS = [
  'sad', 'anxious', 'depressed', 'worse', 'tired', 'hopeless', 'angry', 'frustrated',
  'overwhelmed', 'stressed', 'lonely', 'scared', 'panic', 'crying',
]

function clamp(n, min, max) {
  return Math.min(max, Math.max(min, n))
}

function keywordSentiment(text) {
  const lower = String(text || '').toLowerCase()
  const words = lower.split(/\s+/).filter(Boolean)
  let positiveCount = 0
  let negativeCount = 0

  for (const w of words) {
    if (POSITIVE_WORDS.some((p) => w.includes(p))) positiveCount += 1
    if (NEGATIVE_WORDS.some((n) => w.includes(n))) negativeCount += 1
  }

  const totalWords = Math.max(words.length, 1)
  const score = clamp((positiveCount - negativeCount) / totalWords, -1, 1)
  const label = score > 0.05 ? 'positive' : score < -0.05 ? 'negative' : 'neutral'
  return { score, label, source: 'keyword' }
}

async function pythonSentiment(text) {
  const base = (process.env.SENTIMENT_SERVICE_URL || '').replace(/\/$/, '')
  if (!base) return null

  const res = await fetch(`${base}/analyze`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text: String(text || '') }),
    signal: AbortSignal.timeout(8000),
  })
  if (!res.ok) return null
  const data = await res.json()
  if (typeof data.score !== 'number' || !data.label) return null
  return {
    score: clamp(data.score, -1, 1),
    label: data.label,
    source: data.source || 'distilbert',
  }
}

export async function analyzeSentiment(text) {
  const trimmed = String(text || '').trim()
  if (!trimmed) return { score: 0, label: 'neutral', source: 'empty' }

  try {
    const fromPython = await pythonSentiment(trimmed)
    if (fromPython) return fromPython
  } catch (err) {
    console.warn('[Sentiment] Python service unavailable:', err.message)
  }

  const useOllama = (process.env.LLM_PROVIDER || '').toLowerCase() === 'ollama' && trimmed.length > 8
  if (useOllama) {
    try {
      const fromOllama = await ollama.analyzeMessageSentiment(trimmed)
      if (fromOllama) return fromOllama
    } catch (err) {
      console.warn('[Sentiment] Ollama sentiment unavailable:', err.message)
    }
  }

  return keywordSentiment(trimmed)
}
