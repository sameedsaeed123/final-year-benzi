import { buildSystemInstruction, buildGoalRecommendationPrompt } from './aiPromptBuilder.js'
import { sanitizeGoalRecommendations } from '../utils/textSanitize.js'
import { historyToChatMessages, parseLlmJson } from '../utils/llmJson.js'

const DEFAULT_BASE = 'http://127.0.0.1:11434'

function baseUrl() {
  return (process.env.OLLAMA_BASE_URL || DEFAULT_BASE).replace(/\/$/, '')
}

function defaultModel() {
  return process.env.OLLAMA_MODEL || 'llama3.2:3b'
}

function numCtx() {
  const n = Number(process.env.OLLAMA_NUM_CTX || 2048)
  return Number.isFinite(n) && n > 0 ? Math.min(n, 4096) : 2048
}

function maxPredict() {
  const n = Number(process.env.OLLAMA_MAX_TOKENS || 200)
  return Number.isFinite(n) && n > 0 ? Math.min(n, 400) : 200
}

export function normalizeOllamaError(err) {
  const msg = String(err?.message || err || '')
  if (
    msg.includes('ECONNREFUSED') ||
    msg.includes('fetch failed') ||
    msg.toLowerCase().includes('connect')
  ) {
    const e = new Error(
      'Ollama is not running. Install from https://ollama.com, run `ollama serve`, then `ollama pull ' +
        defaultModel() +
        '`. See benzi-server/docs/OLLAMA_SETUP.md'
    )
    e.statusCode = 503
    return e
  }
  if (msg.includes('404') && msg.toLowerCase().includes('model')) {
    const e = new Error(
      `Ollama model "${defaultModel()}" not found. Run: ollama pull ${defaultModel()}`
    )
    e.statusCode = 503
    return e
  }
  return err
}

/** Ping Ollama and verify the configured model is pulled. */
export async function checkOllamaHealth() {
  const model = defaultModel()
  const out = {
    ok: false,
    baseUrl: baseUrl(),
    model,
    ollamaReachable: false,
    modelAvailable: false,
    models: [],
    message: '',
  }

  try {
    const tagsRes = await fetch(`${baseUrl()}/api/tags`, { signal: AbortSignal.timeout(5000) })
    if (!tagsRes.ok) {
      out.message = `Ollama tags API returned ${tagsRes.status}`
      return out
    }
    out.ollamaReachable = true
    const tags = await tagsRes.json()
    const names = (tags?.models || []).map((m) => m.name)
    out.models = names
    out.modelAvailable = names.some(
      (n) => n === model || n.startsWith(`${model}:`) || model.startsWith(n.split(':')[0])
    )
    if (!out.modelAvailable) {
      out.message = `Model "${model}" not pulled. Run: ollama pull ${model}`
      return out
    }
    out.ok = true
    out.message = 'Ollama ready'
    return out
  } catch (err) {
    out.message = err.message || 'Cannot reach Ollama'
    return out
  }
}

async function chatCompletion(messages, options = {}) {
  const model = options.model || defaultModel()
  const res = await fetch(`${baseUrl()}/api/chat`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      model,
      messages,
      stream: false,
      options: {
        num_ctx: numCtx(),
        temperature: options.temperature ?? 0.4,
        num_predict: options.max_tokens ?? maxPredict(),
      },
    }),
    signal: AbortSignal.timeout(options.timeoutMs ?? 120000),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = data?.error || data?.message || res.statusText
    const err = new Error(`Ollama ${res.status}: ${detail}`)
    err.statusCode = res.status >= 500 ? 503 : res.status
    throw err
  }

  const text = data?.message?.content
  if (!text) {
    throw new Error('Ollama returned an empty response')
  }
  return text.trim()
}

function envInt(name, fallback, max) {
  const n = Number(process.env[name])
  if (!Number.isFinite(n) || n <= 0) return fallback
  return Math.min(n, max)
}

function trimContextForOllama(context) {
  // When RAG already picked chunks, keep them; else allow more records for context
  const ragActive = (context.records || []).some((r) => r.ragScore != null)
  const historyLimit = envInt('OLLAMA_HISTORY_MESSAGES', 10, 14)
  const recordLimit = ragActive
    ? envInt('OLLAMA_MAX_RECORDS', 6, 8)
    : envInt('OLLAMA_MAX_RECORDS', 5, 7)
  const charsPerRecord = envInt('OLLAMA_RECORD_CHARS', 2400, 3500)

  const chatHistory = (context.chatHistory || []).slice(-historyLimit)
  const records = (context.records || []).slice(0, recordLimit).map((r) => ({
    ...r,
    extractedText: String(r.extractedText || '').slice(0, charsPerRecord),
  }))
  return { ...context, chatHistory, records }
}

export async function getAiChatResponse(_patientUserId, newUserMessage, context) {
  try {
    const slim = trimContextForOllama(context)
    const messages = [
      { role: 'system', content: buildSystemInstruction(slim) },
      ...historyToChatMessages(slim.chatHistory),
      { role: 'user', content: newUserMessage },
    ]
    return await chatCompletion(messages, {
      max_tokens: maxPredict(),
      temperature: 0.55,
      timeoutMs: 90000,
    })
  } catch (err) {
    throw normalizeOllamaError(err)
  }
}

export async function runStructuredJson(userPrompt) {
  try {
    const raw = await chatCompletion([{ role: 'user', content: userPrompt }], {
      max_tokens: 400,
      temperature: 0.35,
    })
    return parseLlmJson(raw)
  } catch (err) {
    throw normalizeOllamaError(err)
  }
}

export async function getGoalRecommendations(_patientUserId, context, patientDraft = '') {
  try {
    const raw = await chatCompletion(
      [{ role: 'user', content: buildGoalRecommendationPrompt(context, patientDraft) }],
      { max_tokens: 600, temperature: 0.35 }
    )
    const parsed = parseLlmJson(raw)
    return sanitizeGoalRecommendations(Array.isArray(parsed) ? parsed.slice(0, 3) : [])
  } catch (err) {
    if (err instanceof SyntaxError) return []
    throw normalizeOllamaError(err)
  }
}
