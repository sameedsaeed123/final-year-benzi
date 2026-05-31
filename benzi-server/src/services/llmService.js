/**
 * Routes BENZI AI to OpenRouter (default), Google Gemini, or local Ollama.
 * Set LLM_PROVIDER=openrouter | google | gemini | ollama in .env
 */

import * as openRouter from './openRouterService.js'
import * as gemini from './geminiAiService.js'
import * as ollama from './ollamaService.js'
import { prepareContextForOllama } from './contextBriefService.js'
import { getRagHealth } from './vectorRagService.js'

function provider() {
  return (process.env.LLM_PROVIDER || 'openrouter').toLowerCase()
}

function useGoogle() {
  const p = provider()
  return p === 'google' || p === 'gemini'
}

function useOllama() {
  return provider() === 'ollama'
}

export function normalizeLlmError(err) {
  if (useGoogle()) return gemini.normalizeGeminiError(err)
  if (useOllama()) return ollama.normalizeOllamaError(err)
  return openRouter.normalizeOpenRouterError(err)
}

export async function getAiChatResponse(patientUserId, newUserMessage, context) {
  try {
    if (useOllama()) {
      const prepared = await prepareContextForOllama(patientUserId, context)
      return await ollama.getAiChatResponse(patientUserId, newUserMessage, prepared)
    }
    if (useGoogle()) {
      return await gemini.getAiChatResponse(patientUserId, newUserMessage, context)
    }
    return await openRouter.getAiChatResponse(patientUserId, newUserMessage, context)
  } catch (err) {
    throw normalizeLlmError(err)
  }
}

export async function getGoalRecommendations(patientUserId, context, patientDraft = '') {
  try {
    if (useOllama()) {
      return await ollama.getGoalRecommendations(patientUserId, context, patientDraft)
    }
    if (useGoogle()) {
      return await gemini.getGoalRecommendations(patientUserId, context, patientDraft)
    }
    return await openRouter.getGoalRecommendations(patientUserId, context, patientDraft)
  } catch (err) {
    throw normalizeLlmError(err)
  }
}

export async function runStructuredJson(userPrompt) {
  try {
    if (useOllama()) {
      return await ollama.runStructuredJson(userPrompt)
    }
    if (useGoogle()) {
      return await gemini.runStructuredJson(userPrompt)
    }
    return await openRouter.runOpenRouterJson(userPrompt)
  } catch (err) {
    throw normalizeLlmError(err)
  }
}

export async function checkLlmHealth() {
  const p = provider()
  if (useOllama()) {
    const health = await ollama.checkOllamaHealth()
    const helper = (process.env.LLM_HELPER || '').toLowerCase()
    const rag = await getRagHealth()
    return {
      provider: p,
      ...health,
      helper: helper === 'openrouter' && process.env.OPENROUTER_API_KEY ? 'openrouter' : 'none',
      helperRole: helper === 'openrouter' ? 'compresses large reports before local chat' : null,
      rag,
    }
  }
  if (useGoogle()) {
    return {
      provider: p,
      ok: Boolean(process.env.GEMINI_API_KEY),
      message: process.env.GEMINI_API_KEY ? 'GEMINI_API_KEY set' : 'GEMINI_API_KEY missing',
    }
  }
  return {
    provider: p,
    ok: Boolean(process.env.OPENROUTER_API_KEY),
    message: process.env.OPENROUTER_API_KEY ? 'OPENROUTER_API_KEY set' : 'OPENROUTER_API_KEY missing',
  }
}
