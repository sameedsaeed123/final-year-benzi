/**
 * Routes BENZI AI to OpenRouter (default) or direct Google Gemini.
 * Set LLM_PROVIDER=openrouter | google in .env
 */

import * as openRouter from './openRouterService.js'
import * as gemini from './geminiAiService.js'

function provider() {
  return (process.env.LLM_PROVIDER || 'openrouter').toLowerCase()
}

function useGoogle() {
  const p = provider()
  return p === 'google' || p === 'gemini'
}

export function normalizeLlmError(err) {
  if (useGoogle()) return gemini.normalizeGeminiError(err)
  return openRouter.normalizeOpenRouterError(err)
}

export async function getAiChatResponse(patientUserId, newUserMessage, context) {
  try {
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
    if (useGoogle()) {
      return await gemini.runStructuredJson(userPrompt)
    }
    return await openRouter.runOpenRouterJson(userPrompt)
  } catch (err) {
    throw normalizeLlmError(err)
  }
}
