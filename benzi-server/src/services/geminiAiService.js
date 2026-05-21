import { GoogleGenerativeAI } from '@google/generative-ai'
import { buildSystemInstruction, buildGoalRecommendationPrompt } from './aiPromptBuilder.js'
import { sanitizeGoalRecommendations } from '../utils/textSanitize.js'

/**
 * gemini-1.5-flash → 404 (retired). gemini-2.0-flash → often 429 on free tier.
 * Override with GEMINI_MODEL; fallbacks run if the primary model fails.
 */
const MODEL_FALLBACKS = [
  process.env.GEMINI_MODEL,
  'gemini-2.5-flash',
  'gemini-2.0-flash-lite',
  'gemini-flash-latest',
].filter(Boolean)

function uniqueModels() {
  return [...new Set(MODEL_FALLBACKS.map((m) => String(m).trim()).filter(Boolean))]
}

function getGenAI() {
  const key = process.env.GEMINI_API_KEY
  if (!key) {
    const err = new Error('GEMINI_API_KEY is not configured')
    err.statusCode = 503
    throw err
  }
  return new GoogleGenerativeAI(key)
}

function isModelUnavailable(err) {
  const msg = String(err?.message || err || '')
  return msg.includes('404') || msg.includes('not found') || msg.includes('not supported')
}

function isQuotaExceeded(err) {
  const msg = String(err?.message || err || '')
  return msg.includes('429') || msg.toLowerCase().includes('quota')
}

export function normalizeGeminiError(err) {
  const msg = String(err?.message || err || '')
  if (isQuotaExceeded(err)) {
    const e = new Error(
      `Gemini quota exceeded. Wait a minute, enable billing at https://ai.google.dev, or set GEMINI_MODEL=gemini-2.0-flash-lite in benzi-server/.env and restart.`
    )
    e.statusCode = 429
    return e
  }
  if (isModelUnavailable(err)) {
    const e = new Error(
      `Gemini model not available. Set GEMINI_MODEL=gemini-2.5-flash in benzi-server/.env (gemini-1.5-flash is retired).`
    )
    e.statusCode = 503
    return e
  }
  if (msg.includes('API_KEY_INVALID') || msg.includes('API key not valid')) {
    const e = new Error('Invalid Gemini API key. Check GEMINI_API_KEY in benzi-server/.env')
    e.statusCode = 503
    return e
  }
  return err
}

async function runWithModelFallback(runForModel) {
  const models = uniqueModels()
  let lastErr = null

  for (const modelName of models) {
    try {
      return await runForModel(modelName)
    } catch (err) {
      lastErr = err
      const retry =
        isModelUnavailable(err) || isQuotaExceeded(err)
      if (!retry || models.indexOf(modelName) === models.length - 1) {
        break
      }
      console.warn(`[Gemini] ${modelName} failed, trying next model…`)
    }
  }

  throw normalizeGeminiError(lastErr)
}

export async function getAiChatResponse(patientUserId, newUserMessage, context) {
  return runWithModelFallback(async (modelName) => {
    const genAI = getGenAI()
    const systemInstruction = buildSystemInstruction(context)
    const model = genAI.getGenerativeModel({
      model: modelName,
      systemInstruction,
      generationConfig: { maxOutputTokens: 480, temperature: 0.72 },
    })

    const history = context.chatHistory || []
    const chat = model.startChat({ history })
    const result = await chat.sendMessage(newUserMessage)
    return result.response.text()
  })
}

export async function runStructuredJson(userPrompt) {
  return runWithModelFallback(async (modelName) => {
    const genAI = getGenAI()
    const model = genAI.getGenerativeModel({
      model: modelName,
      generationConfig: { maxOutputTokens: 400, temperature: 0.35 },
    })
    const result = await model.generateContent(userPrompt)
    const raw = result.response.text().trim()
    const jsonStr = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim()
    return JSON.parse(jsonStr)
  })
}

export async function getGoalRecommendations(patientUserId, context, patientDraft = '') {
  return runWithModelFallback(async (modelName) => {
    const genAI = getGenAI()
    const prompt = buildGoalRecommendationPrompt(context, patientDraft)
    const model = genAI.getGenerativeModel({ model: modelName })
    const result = await model.generateContent(prompt)
    const raw = result.response.text().trim()
    const jsonStr = raw.replace(/^```json?\s*/i, '').replace(/```\s*$/i, '').trim()

    try {
      const parsed = JSON.parse(jsonStr)
      return sanitizeGoalRecommendations(Array.isArray(parsed) ? parsed.slice(0, 3) : [])
    } catch {
      return []
    }
  })
}
