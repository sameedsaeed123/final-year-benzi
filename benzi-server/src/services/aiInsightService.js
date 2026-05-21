import { buildPatientContext } from './aiContextBuilder.js'
import { buildAiAnalytics } from './aiStatsService.js'
import { buildPatientInsightPrompt } from './aiPromptBuilder.js'
import { getGoalRecommendations } from './llmService.js'
import { runStructuredJson } from './llmService.js'
import { sanitizeAiText } from '../utils/textSanitize.js'

export async function buildContextWithStats(patientUserId) {
  const [context, analytics] = await Promise.all([
    buildPatientContext(patientUserId),
    buildAiAnalytics(patientUserId),
  ])

  const lastMood = analytics.moodLogs?.[analytics.moodLogs.length - 1]

  context.analyticsSummary = {
    taskScore: analytics.taskScore,
    goalProgressPct: analytics.progressCenterPct,
    dominantMood: lastMood?.dominantLabel || 'neutral',
    aiMessageCount: analytics.aiMessageCount,
    sentiment: analytics.sentimentCounts,
  }

  return context
}

export async function getPatientGoalInsight(patientUserId, patientDraft = '') {
  const context = await buildContextWithStats(patientUserId)

  try {
    const prompt = buildPatientInsightPrompt(context, patientDraft)
    const parsed = await runStructuredJson(prompt)
    if (parsed?.insight) {
      return {
        insight: sanitizeAiText(parsed.insight),
        tips: Array.isArray(parsed.tips)
          ? parsed.tips.slice(0, 3).map((t) => sanitizeAiText(t))
          : [],
        recommendations: [],
      }
    }
  } catch (err) {
    console.warn('[AiInsight] LLM insight failed:', err.message)
  }

  return fallbackInsight(context, patientDraft)
}

export async function getPatientGoalPreviewRecommendations(patientUserId, patientDraft) {
  const context = await buildContextWithStats(patientUserId)
  const recommendations = await getGoalRecommendations(patientUserId, context, patientDraft)
  return recommendations
}

function fallbackInsight(context, patientDraft) {
  const s = context.analyticsSummary || {}
  const mood = s.dominantMood || 'neutral'
  const goalPct = s.goalProgressPct ?? 0
  let insight = `Your recent check-ins suggest a ${mood} emotional tone. `
  if (goalPct > 0) {
    insight += `You're about ${goalPct}% through your current therapy goals — steady progress. `
  } else if ((context.goals || []).length === 0) {
    insight += `Your therapist has not assigned goals yet; sharing one below can help them support you. `
  }
  if (patientDraft) {
    insight += `The goal you're working on ("${patientDraft.slice(0, 60)}…") is a meaningful step — your therapist will review it.`
  } else {
    insight += `Keep using BENZI AI after sessions to track how you feel over time.`
  }

  const tips = []
  if (s.sentiment?.negative > 0) {
    tips.push('Try a 5-minute breathing break when stress spikes.')
  }
  if ((context.recordsWithPdfText || 0) > 0) {
    tips.push('Review your uploaded reports with BENZI AI for plain-language summaries.')
  }
  tips.push('Chat with BENZI AI after tough days — it updates your progress charts.')

  return { insight, tips: tips.slice(0, 3), recommendations: [] }
}
