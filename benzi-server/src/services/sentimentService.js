// TODO: Replace with HuggingFace Python service on port 5001 for production

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

export async function analyzeSentiment(text) {
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

  return { score, label }
}
