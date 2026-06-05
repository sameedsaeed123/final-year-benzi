import { buildSystemInstruction, buildGoalRecommendationPrompt } from './aiPromptBuilder.js'
import { sanitizeGoalRecommendations } from '../utils/textSanitize.js'

import { getOpenRouterAttributionHeaders } from '../utils/appBranding.js'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

/** openai/gpt-4o-mini works on low credits; google/gemini on OR often needs paid credits */
const MODEL_FALLBACKS = [
  process.env.OPENROUTER_MODEL,
  'openai/gpt-4o-mini',
  'google/gemini-2.5-flash',
].filter(Boolean)

function uniqueModels() {
  return [...new Set(MODEL_FALLBACKS.map((m) => String(m).trim()).filter(Boolean))]
}

function getApiKey() {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) {
    const err = new Error('OPENROUTER_API_KEY is not configured')
    err.statusCode = 503
    throw err
  }
  return key
}

export function normalizeOpenRouterError(err) {
  const msg = String(err?.message || err || '')
  if (msg.includes('429') || msg.toLowerCase().includes('rate limit')) {
    const e = new Error('OpenRouter rate limit exceeded. Wait a moment and try again.')
    e.statusCode = 429
    return e
  }
  if (msg.includes('401') || msg.includes('403') || msg.toLowerCase().includes('invalid')) {
    const e = new Error('Invalid OpenRouter API key. Check OPENROUTER_API_KEY in benzi-server/.env')
    e.statusCode = 503
    return e
  }
  if (msg.includes('402') || msg.toLowerCase().includes('credit')) {
    const e = new Error('OpenRouter credits exhausted. Add credits at https://openrouter.ai/settings/credits')
    e.statusCode = 402
    return e
  }
  return err
}

function geminiHistoryToMessages(history) {
  return (history || []).map((h) => ({
    role: h.role === 'model' ? 'assistant' : 'user',
    content: h.parts?.[0]?.text || h.text || '',
  }))
}

async function chatCompletion(messages, model, options = {}) {
  const res = await fetch(OPENROUTER_URL, {
    method: 'POST',
    headers: {
      Authorization: `Bearer ${getApiKey()}`,
      'Content-Type': 'application/json',
      ...getOpenRouterAttributionHeaders(),
    },
    body: JSON.stringify({
      model,
      messages,
      max_tokens: options.max_tokens ?? 2048,
      temperature: options.temperature ?? 0.4,
    }),
  })

  const data = await res.json().catch(() => ({}))
  if (!res.ok) {
    const detail = data?.error?.message || data?.message || res.statusText
    const err = new Error(`OpenRouter ${res.status}: ${detail}`)
    err.statusCode = res.status >= 500 ? 503 : res.status
    throw err
  }

  const text = data?.choices?.[0]?.message?.content
  if (!text) {
    throw new Error('OpenRouter returned an empty response')
  }
  return text.trim()
}

async function runWithModelFallback(buildMessages, options = {}) {
  const models = uniqueModels()
  let lastErr = null

  for (const modelName of models) {
    try {
      const messages = buildMessages()
      return await chatCompletion(messages, modelName, options)
    } catch (err) {
      lastErr = err
      console.warn(`[OpenRouter] ${modelName} failed:`, err.message)
      if (models.indexOf(modelName) === models.length - 1) break
    }
  }

  throw normalizeOpenRouterError(lastErr)
}

export async function getAiChatResponse(_patientUserId, newUserMessage, context) {
  return runWithModelFallback(
    () => {
      const messages = [
        { role: 'system', content: buildSystemInstruction(context) },
        ...geminiHistoryToMessages(context.chatHistory),
        { role: 'user', content: newUserMessage },
      ]
      return messages
    },
    { max_tokens: 320, temperature: 0.72 }
  )
}

export async function runOpenRouterJson(userPrompt) {
  const raw = await runWithModelFallback(
    () => [{ role: 'user', content: userPrompt }],
    { max_tokens: 400, temperature: 0.35 }
  )
  const jsonStr = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim()
  return JSON.parse(jsonStr)
}

/** Factual brief of patient PDFs for Ollama (hybrid helper only). */
export async function summarizeRecordsBrief(records) {
  const block = (records || [])
    .slice(0, 6)
    .map(
      (r, i) =>
        `--- Document ${i + 1}: ${r.title || 'Report'} (${r.type || 'file'}) ---\n${String(r.extractedText || r.description || '').slice(0, 2200)}`
    )
    .join('\n\n')

  if (!block.trim()) return ''

  return runWithModelFallback(
    () => [
      {
        role: 'user',
        content: `You prepare context for BENZI, a between-session mental wellness companion (NOT a therapist).

Summarize the patient documents below in plain English for the companion AI.
Rules:
- Facts only from the text; do NOT diagnose or prescribe.
- Max 280 words, short paragraphs or bullets.
- Note medications, dates, and follow-ups if present.
- End with: "Therapist must confirm anything clinical."

DOCUMENTS:
${block}`,
      },
    ],
    { max_tokens: 450, temperature: 0.2 }
  )
}

export async function getGoalRecommendations(_patientUserId, context, patientDraft = '') {
  const raw = await runWithModelFallback(
    () => [{ role: 'user', content: buildGoalRecommendationPrompt(context, patientDraft) }],
    { max_tokens: 600, temperature: 0.35 }
  )

  const jsonStr = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim()
  try {
    const parsed = JSON.parse(jsonStr)
    return sanitizeGoalRecommendations(Array.isArray(parsed) ? parsed.slice(0, 3) : [])
  } catch {
    return []
  }
}
