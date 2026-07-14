/**
 * Routes BENZI AI to local Ollama (default) or Google Gemini.
 * Set LLM_PROVIDER=ollama | google | gemini in .env
 *
 * Patient data stays on our own server: the default provider is local Ollama,
 * so clinical records and chats are never sent to a third-party cloud LLM.
 */

import * as gemini from './geminiAiService.js'
import * as ollama from './ollamaService.js'
import { prepareContextForOllama } from './contextBriefService.js'
import { getRagHealth } from './vectorRagService.js'

function provider() {
  return (process.env.LLM_PROVIDER || 'ollama').toLowerCase()
}

function useGoogle() {
  const p = provider()
  return p === 'google' || p === 'gemini'
}

export function normalizeLlmError(err) {
  if (useGoogle()) return gemini.normalizeGeminiError(err)
  return ollama.normalizeOllamaError(err)
}

export async function getAiChatResponse(patientUserId, newUserMessage, context) {
  try {
    if (useGoogle()) {
      return await gemini.getAiChatResponse(patientUserId, newUserMessage, context)
    }
    const prepared = await prepareContextForOllama(patientUserId, context)
    return await ollama.getAiChatResponse(patientUserId, newUserMessage, prepared)
  } catch (err) {
    throw normalizeLlmError(err)
  }
}

export async function getGoalRecommendations(patientUserId, context, patientDraft = '') {
  try {
    if (useGoogle()) {
      return await gemini.getGoalRecommendations(patientUserId, context, patientDraft)
    }
    return await ollama.getGoalRecommendations(patientUserId, context, patientDraft)
  } catch (err) {
    throw normalizeLlmError(err)
  }
}

export async function runStructuredJson(userPrompt) {
  try {
    if (useGoogle()) {
      return await gemini.runStructuredJson(userPrompt)
    }
    return await ollama.runStructuredJson(userPrompt)
  } catch (err) {
    throw normalizeLlmError(err)
  }
}

export async function checkLlmHealth() {
  const p = provider()
  if (useGoogle()) {
    return {
      provider: p,
      ok: Boolean(process.env.GEMINI_API_KEY),
      message: process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY set' : 'GEMINI_API_KEY missing',
    }
  }
  const health = await ollama.checkOllamaHealth()
  const rag = await getRagHealth()
  return {
    provider: p,
    ...health,
    rag,
  }
}
