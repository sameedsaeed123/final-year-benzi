/**
 * Ollama embeddings for vector RAG (nomic-embed-text or similar).
 */

const DEFAULT_BASE = 'http://127.0.0.1:11434'
const DEFAULT_MODEL = 'nomic-embed-text'

function ollamaBase() {
  return (process.env.OLLAMA_BASE_URL || DEFAULT_BASE).replace(/\/$/, '')
}

function embedModel() {
  return process.env.OLLAMA_EMBED_MODEL || DEFAULT_MODEL
}

export async function embedText(text) {
  const prompt = String(text || '').trim().slice(0, 8000)
  if (!prompt) return null

  const res = await fetch(`${ollamaBase()}/api/embeddings`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ model: embedModel(), prompt }),
    signal: AbortSignal.timeout(60000),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    throw new Error(data?.error || `Ollama embeddings ${res.status}`)
  }

  const vec = data?.embedding
  if (!Array.isArray(vec) || vec.length < 8) {
    throw new Error('Ollama returned invalid embedding')
  }
  return vec
}

export async function checkEmbeddingHealth() {
  try {
    const vec = await embedText('health check')
    return { ok: Boolean(vec?.length), model: embedModel(), dimensions: vec?.length || 0 }
  } catch (err) {
    return { ok: false, model: embedModel(), message: err.message }
  }
}
