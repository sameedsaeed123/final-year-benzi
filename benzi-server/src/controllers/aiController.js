import { AiMessage } from '../models/AiMessage.js'
import { AiMoodLog } from '../models/AiMoodLog.js'
import { AiGoal } from '../models/AiGoal.js'
import { buildPatientContext } from '../services/aiContextBuilder.js'
import { getAiChatResponse, getGoalRecommendations } from '../services/llmService.js'
import {
  buildContextWithStats,
  getPatientGoalInsight,
  getPatientGoalPreviewRecommendations,
} from '../services/aiInsightService.js'
import { resolveTherapistForPatient } from '../services/aiAccessService.js'
import { analyzeSentiment } from '../services/sentimentService.js'
import {
  getPatientAiDashboard,
  getTherapistPatientAiSummary,
  upsertTodayMoodLog,
  syncPatientAiStats,
  buildAiAnalytics,
} from '../services/aiStatsService.js'
import {
  assertTherapistCanAccessPatient,
  resolvePatientUserId,
} from '../services/aiAccessService.js'
import { sendSuccess, sendError } from '../utils/responseUtils.js'
import { sanitizeAiText } from '../utils/textSanitize.js'

export async function patientAiChat(req, res, next) {
  try {
    const patientUserId = req.user.id
    const text = String(req.body?.text || '').trim()
    if (!text) return sendError(res, 'Message text is required', 400)

    const { score, label } = await analyzeSentiment(text)
    const context = await buildPatientContext(patientUserId)
    const aiResponse = await getAiChatResponse(patientUserId, text, context)

    const patientMsg = await AiMessage.create({
      patientUserId,
      sender: 'patient',
      text,
      sentimentScore: score,
      sentimentLabel: label,
    })

    await upsertTodayMoodLog(patientUserId, score, label)

    await AiMessage.create({
      patientUserId,
      sender: 'ai',
      text: aiResponse,
      sentimentScore: 0,
      sentimentLabel: 'neutral',
    })

    await syncPatientAiStats(patientUserId)

    return sendSuccess(res, { reply: aiResponse, sentiment: { score, label } }, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function getAiChatHistory(req, res, next) {
  try {
    const patientUserId = req.user.id
    const messages = await AiMessage.find({ patientUserId })
      .sort({ createdAt: 1 })
      .limit(50)
      .lean()

    return sendSuccess(res, { messages }, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function getPatientMoodStats(req, res, next) {
  try {
    let patientUserId = req.user.id
    if (req.params.patientUserId) {
      if (req.user.role !== 'therapist') {
        return sendError(res, 'Forbidden', 403)
      }
      patientUserId = req.params.patientUserId
      await assertTherapistCanAccessPatient(req.user.id, patientUserId)
    }

    const moodLogs = await AiMoodLog.find({ patientUserId })
      .sort({ date: 1 })
      .limit(14)
      .lean()

    return sendSuccess(res, { moodLogs }, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function getAiDashboard(req, res, next) {
  try {
    const patientUserId = resolvePatientUserId(req)
    if (req.user.role === 'therapist') {
      await assertTherapistCanAccessPatient(req.user.id, patientUserId)
    }
    const data = await getPatientAiDashboard(patientUserId)
    return sendSuccess(res, data, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function getTherapistPatientAiOverview(req, res, next) {
  try {
    const { patientUserId } = req.params
    await assertTherapistCanAccessPatient(req.user.id, patientUserId)
    const summary = await getTherapistPatientAiSummary(patientUserId)
    return sendSuccess(res, summary, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function recommendGoals(req, res, next) {
  try {
    const { patientUserId } = req.params
    await assertTherapistCanAccessPatient(req.user.id, patientUserId)
    const context = await buildContextWithStats(patientUserId)
    const recommendations = await getGoalRecommendations(patientUserId, context)
    return sendSuccess(
      res,
      { recommendations, stats: context.analyticsSummary },
      'OK',
      200
    )
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function assignGoal(req, res, next) {
  try {
    const therapistUserId = req.user.id
    const { patientUserId, title, description, priority, aiRecommended } = req.body || {}
    if (!patientUserId || !title) {
      return sendError(res, 'patientUserId and title are required', 400)
    }
    await assertTherapistCanAccessPatient(therapistUserId, patientUserId)

    const goal = await AiGoal.create({
      patientUserId,
      therapistUserId,
      title: sanitizeAiText(title),
      description: sanitizeAiText(description || ''),
      priority: ['high', 'medium', 'low'].includes(priority) ? priority : 'medium',
      aiRecommended: Boolean(aiRecommended),
      submittedBy: 'therapist',
    })

    await syncPatientAiStats(patientUserId)

    return sendSuccess(res, { goal }, 'Goal assigned', 201)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function getPatientGoals(req, res, next) {
  try {
    const patientUserId = resolvePatientUserId(req)
    if (req.user.role === 'therapist') {
      await assertTherapistCanAccessPatient(req.user.id, patientUserId)
    }

    const goals = (await AiGoal.find({ patientUserId }).sort({ createdAt: -1 }).lean()).map((g) => ({
      ...g,
      title: sanitizeAiText(g.title),
      description: sanitizeAiText(g.description),
    }))
    return sendSuccess(res, { goals }, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function updateGoalStatus(req, res, next) {
  try {
    const { goalId } = req.params
    const { status } = req.body || {}
    if (!['pending', 'in-progress', 'completed'].includes(status)) {
      return sendError(res, 'Invalid status', 400)
    }

    const goal = await AiGoal.findById(goalId)
    if (!goal) return sendError(res, 'Goal not found', 404)

    if (req.user.role === 'patient' && String(goal.patientUserId) !== String(req.user.id)) {
      return sendError(res, 'Forbidden', 403)
    }
    if (req.user.role === 'therapist') {
      await assertTherapistCanAccessPatient(req.user.id, goal.patientUserId)
    }

    goal.status = status
    await goal.save()
    await syncPatientAiStats(goal.patientUserId)

    return sendSuccess(res, { goal }, 'Updated', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function submitPatientGoalProposal(req, res, next) {
  try {
    const patientUserId = req.user.id
    const title = sanitizeAiText(req.body?.title)
    const description = sanitizeAiText(req.body?.description || title)
    if (!title) return sendError(res, 'Goal title is required', 400)

    const therapistUserId = await resolveTherapistForPatient(patientUserId)
    if (!therapistUserId) {
      return sendError(
        res,
        'No therapist linked yet. Book a session first so your therapist can review your goal.',
        400
      )
    }

    const goal = await AiGoal.create({
      patientUserId,
      therapistUserId,
      title,
      description,
      priority: 'medium',
      status: 'pending',
      submittedBy: 'patient',
    })

    await syncPatientAiStats(patientUserId)

    return sendSuccess(
      res,
      { goal, message: 'Goal sent to your therapist for review.' },
      'Submitted',
      201
    )
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function getPatientGoalInsightMe(req, res, next) {
  try {
    const patientUserId = req.user.id
    const draft = String(req.query?.draft || '').trim()
    const data = await getPatientGoalInsight(patientUserId, draft)
    return sendSuccess(res, data, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function previewPatientGoalRecommendations(req, res, next) {
  try {
    const patientUserId = req.user.id
    const draft = String(req.body?.draft || '').trim()
    const recommendations = await getPatientGoalPreviewRecommendations(patientUserId, draft)
    return sendSuccess(res, { recommendations }, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function getPatientAnalytics(req, res, next) {
  try {
    const patientUserId = resolvePatientUserId(req)
    if (req.user.role === 'therapist') {
      await assertTherapistCanAccessPatient(req.user.id, patientUserId)
    }
    const data = await buildAiAnalytics(patientUserId)
    return sendSuccess(res, data, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}
