import { AiMessage } from '../models/AiMessage.js'
import { AiMoodLog } from '../models/AiMoodLog.js'
import { AiGoal } from '../models/AiGoal.js'
import { buildPatientContext } from '../services/aiContextBuilder.js'
import { getAiChatResponse, getGoalRecommendations, checkLlmHealth } from '../services/llmService.js'
import {
  buildContextWithStats,
  getPatientGoalInsight,
  getPatientGoalPreviewRecommendations,
} from '../services/aiInsightService.js'
import { analyzeSentiment } from '../services/sentimentService.js'
import {
  getPatientAiDashboard,
  getTherapistPatientAiSummary,
  upsertTodayMoodLog,
  upsertManualMoodLog,
  buildAiAnalytics,
} from '../services/aiStatsService.js'
import { syncStatsAndNotify } from '../services/aiActivityService.js'
import {
  assertPatientAiChatAllowed,
  assertTherapistAiRecommendationAllowed,
  applyContextLimits,
  getEffectiveSubscription,
  recordAiMessageUsage,
  recordAiRecommendationUsage,
} from '../services/subscriptionLimitsService.js'
import {
  assertTherapistCanAccessPatient,
  assertTherapistActivelyLinkedToPatient,
  resolvePatientUserId,
  resolveTherapistForPatient,
} from '../services/aiAccessService.js'
import { detectCrisis } from '../services/crisisDetectionService.js'
import {
  notifyTherapistOfCrisis,
  crisisPatientMessage,
  crisisInsightBlock,
  isMeaningfulGoalDraft,
} from '../services/crisisAlertService.js'
import { sendSuccess, sendError } from '../utils/responseUtils.js'
import { sanitizeAiText, sanitizeChatReply } from '../utils/textSanitize.js'

function mapGoalForResponse(g, viewerRole) {
  const base = {
    ...g,
    id: g._id ? String(g._id) : g.id,
    title: sanitizeAiText(g.title),
    description: sanitizeAiText(g.description),
    rejectionNote: g.rejectionNote ? sanitizeAiText(g.rejectionNote) : '',
  }
  if (g.crisisFlag && viewerRole === 'patient') {
    return {
      ...base,
      title: 'Safety alert',
      description: 'Your therapist has been notified. If you are in immediate danger, call emergency services now.',
      isCrisisAlert: true,
      crisisSeverity: g.crisisFlag,
    }
  }
  if (g.crisisFlag) {
    return { ...base, isCrisisAlert: true, crisisSeverity: g.crisisFlag }
  }
  return base
}

export async function patientAiChat(req, res, next) {
  try {
    const patientUserId = req.user.id
    const text = String(req.body?.text || '').trim()
    if (!text) return sendError(res, 'Message text is required', 400)

    const { score, label } = await analyzeSentiment(text)
    const crisis = detectCrisis(text)

    if (crisis.isCrisis) {
      await notifyTherapistOfCrisis(patientUserId, crisis, 'benzi_ai_chat')
    }

    let therapistForUsage = null
    if (!crisis.isCrisis) {
      const allowance = await assertPatientAiChatAllowed(patientUserId)
      therapistForUsage = allowance?.therapistUserId
    }

    let context = await buildPatientContext(patientUserId, { ragQuery: text })
    if (therapistForUsage) {
      const sub = await getEffectiveSubscription(therapistForUsage)
      context = applyContextLimits(context, sub.limits)
    }

    let aiResponse
    if (crisis.isCrisis) {
      aiResponse = crisisPatientMessage(crisis.severity)
    } else {
      const rawReply = await getAiChatResponse(patientUserId, text, context)
      aiResponse = sanitizeChatReply(rawReply)
      if (!context.records?.length && /\b(diagnos|medication|dosage|prescri|disorder)\b/i.test(text)) {
        aiResponse = `${aiResponse} I don't have enough in your records to advise on that — please ask your therapist.`.trim()
      }
    }

    const patientMsg = await AiMessage.create({
      patientUserId,
      sender: 'patient',
      text,
      sentimentScore: score,
      sentimentLabel: label,
      crisisFlag: crisis.isCrisis ? crisis.severity : null,
    })

    await upsertTodayMoodLog(patientUserId, score, label)

    await AiMessage.create({
      patientUserId,
      sender: 'ai',
      text: sanitizeChatReply(aiResponse),
      sentimentScore: 0,
      sentimentLabel: 'neutral',
    })

    if (therapistForUsage && !crisis.isCrisis) {
      await recordAiMessageUsage(therapistForUsage)
    }

    await syncStatsAndNotify(patientUserId, {
      type: crisis.isCrisis ? 'crisis_alert' : 'ai_chat',
      title: crisis.isCrisis ? 'Crisis alert' : 'BENZI AI activity',
      message: crisis.isCrisis
        ? 'Patient used crisis language in BENZI AI chat'
        : 'Patient checked in with BENZI AI',
      data: { preview: text.slice(0, 80) },
    })

    return sendSuccess(
      res,
      {
        reply: aiResponse,
        sentiment: { score, label },
        crisis: crisis.isCrisis ? { isCrisis: true, severity: crisis.severity } : null,
        rag: context.ragUsed
          ? { used: true, chunks: context.ragChunkCount }
          : { used: false },
      },
      'OK',
      200
    )
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function getAiChatHistory(req, res, next) {
  try {
    const patientUserId = req.user.id
    const messages = await AiMessage.find({
      patientUserId,
      clearedFromHistoryAt: null,
    })
      .sort({ createdAt: 1 })
      .limit(50)
      .lean()

    return sendSuccess(res, { messages }, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function clearAiChatHistory(req, res, next) {
  try {
    const patientUserId = req.user.id
    const result = await AiMessage.updateMany(
      { patientUserId, clearedFromHistoryAt: null },
      { $set: { clearedFromHistoryAt: new Date() } }
    )

    return sendSuccess(
      res,
      { cleared: result.modifiedCount || 0 },
      'Chat cleared',
      200
    )
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

export async function logPatientMood(req, res, next) {
  try {
    const patientUserId = req.user.id
    const mood = String(req.body?.mood || '').trim()
    if (!mood) return sendError(res, 'Mood label is required', 400)

    await upsertManualMoodLog(patientUserId, mood)
    await syncStatsAndNotify(patientUserId)

    const dashboard = await getPatientAiDashboard(patientUserId)
    return sendSuccess(res, { todayMood: dashboard.todayMood, taskScore: dashboard.taskScore }, 'Mood logged', 200)
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
    await assertTherapistAiRecommendationAllowed(req.user.id)
    let context = await buildContextWithStats(patientUserId)
    const sub = await getEffectiveSubscription(req.user.id)
    context = applyContextLimits(context, sub.limits)
    const recommendations = await getGoalRecommendations(patientUserId, context)
    await recordAiRecommendationUsage(req.user.id, Math.max(1, recommendations.length))
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
    await assertTherapistActivelyLinkedToPatient(therapistUserId, patientUserId)

    const goal = await AiGoal.create({
      patientUserId,
      therapistUserId,
      title: sanitizeAiText(title),
      description: sanitizeAiText(description || ''),
      priority: ['high', 'medium', 'low'].includes(priority) ? priority : 'medium',
      aiRecommended: Boolean(aiRecommended),
      submittedBy: 'therapist',
    })

    await syncStatsAndNotify(patientUserId, {
      therapistUserId,
      type: 'goal_assigned',
      title: 'New goal from therapist',
      message: `Your therapist assigned: ${goal.title}`,
      data: { goalId: String(goal._id) },
    })

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

    const role = req.user.role
    const goals = (await AiGoal.find({ patientUserId }).sort({ createdAt: -1 }).lean()).map((g) =>
      mapGoalForResponse(g, role)
    )
    return sendSuccess(res, { goals }, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function updateGoalStatus(req, res, next) {
  try {
    const { goalId } = req.params
    const { status, rejectionNote } = req.body || {}
    const allowed = ['pending', 'in-progress', 'completed', 'rejected']
    if (!allowed.includes(status)) {
      return sendError(res, 'Invalid status', 400)
    }

    const goal = await AiGoal.findById(goalId)
    if (!goal) return sendError(res, 'Goal not found', 404)

    if (req.user.role === 'patient' && String(goal.patientUserId) !== String(req.user.id)) {
      return sendError(res, 'Forbidden', 403)
    }
    if (req.user.role === 'therapist') {
      await assertTherapistCanAccessPatient(req.user.id, goal.patientUserId)
      if (status === 'rejected' && goal.submittedBy !== 'patient') {
        return sendError(res, 'Only patient-submitted goals can be rejected', 400)
      }
    }
    if (req.user.role === 'patient' && status === 'rejected') {
      return sendError(res, 'Patients cannot reject goals', 403)
    }

    const prevStatus = goal.status
    goal.status = status
    if (status === 'rejected' && rejectionNote != null) {
      goal.rejectionNote = sanitizeAiText(String(rejectionNote).slice(0, 300))
    }
    if (status === 'in-progress' && goal.submittedBy === 'patient' && prevStatus === 'pending') {
      goal.rejectionNote = ''
    }
    await goal.save()

    const activityType =
      status === 'rejected'
        ? 'goal_rejected'
        : status === 'completed'
          ? 'goal_completed'
          : status === 'in-progress' && goal.submittedBy === 'patient'
            ? 'goal_approved'
            : 'goal_updated'

    const activityMessage =
      status === 'rejected'
        ? `Your therapist declined the goal "${goal.title}"`
        : status === 'in-progress' && goal.submittedBy === 'patient'
          ? `Your therapist approved: ${goal.title}`
          : `Goal "${goal.title}" is now ${status.replace('-', ' ')}`

    await syncStatsAndNotify(goal.patientUserId, {
      therapistUserId: goal.therapistUserId,
      type: activityType,
      title:
        status === 'rejected'
          ? 'Goal not accepted'
          : status === 'in-progress' && goal.submittedBy === 'patient'
            ? 'Goal approved'
            : 'Goal updated',
      message: activityMessage,
      data: { goalId: String(goal._id), status },
    })

    return sendSuccess(res, { goal: mapGoalForResponse(goal.toObject(), req.user.role) }, 'Updated', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function submitPatientGoalProposal(req, res, next) {
  try {
    const patientUserId = req.user.id
    const rawTitle = String(req.body?.title || '').trim()
    const rawDescription = String(req.body?.description || rawTitle).trim()
    if (!rawTitle) return sendError(res, 'Goal title is required', 400)

    const crisis = detectCrisis(`${rawTitle} ${rawDescription}`)
    const therapistUserId = await resolveTherapistForPatient(patientUserId)
    if (!therapistUserId) {
      return sendError(
        res,
        'No therapist linked yet. Book a session first so your therapist can review your goal.',
        400
      )
    }

    if (crisis.isCrisis) {
      await notifyTherapistOfCrisis(patientUserId, crisis, 'patient_goals')

      const goal = await AiGoal.create({
        patientUserId,
        therapistUserId,
        title: rawTitle.slice(0, 200),
        description: rawDescription.slice(0, 500),
        priority: 'high',
        status: 'pending',
        submittedBy: 'patient',
        crisisFlag: crisis.severity,
      })

      await syncStatsAndNotify(patientUserId, {
        therapistUserId,
        type: 'crisis_alert',
        title: 'Crisis — patient goal',
        message: 'Patient submitted a goal flagged for crisis review',
        data: { goalId: String(goal._id), severity: crisis.severity },
      })

      return sendSuccess(
        res,
        {
          crisis: true,
          severity: crisis.severity,
          goal: mapGoalForResponse(goal.toObject(), 'patient'),
          message: crisisPatientMessage(crisis.severity),
          therapistNotified: true,
        },
        'Crisis support activated',
        200
      )
    }

    const title = sanitizeAiText(rawTitle)
    const description = sanitizeAiText(rawDescription)

    const goal = await AiGoal.create({
      patientUserId,
      therapistUserId,
      title,
      description,
      priority: 'medium',
      status: 'pending',
      submittedBy: 'patient',
    })

    await syncStatsAndNotify(patientUserId, {
      therapistUserId,
      type: 'goal_submitted',
      title: 'Patient submitted a goal',
      message: `Review goal: ${title}`,
      data: { goalId: String(goal._id) },
    })

    return sendSuccess(
      res,
      { goal: mapGoalForResponse(goal.toObject(), 'patient'), message: 'Goal sent to your therapist for review.' },
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

    const crisis = detectCrisis(draft)
    if (crisis.isCrisis) {
      return sendSuccess(res, crisisInsightBlock(crisis.severity), 'OK', 200)
    }

    if (draft && !isMeaningfulGoalDraft(draft)) {
      return sendSuccess(
        res,
        {
          insight: 'Write a clear goal in a few words (for example: sleep better, manage stress at work).',
          tips: [],
          recommendations: [],
          isCrisis: false,
        },
        'OK',
        200
      )
    }

    const data = await getPatientGoalInsight(patientUserId, draft)
    return sendSuccess(res, { ...data, isCrisis: false }, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function previewTherapistGoalRecommendations(req, res, next) {
  try {
    const { patientUserId } = req.params
    await assertTherapistActivelyLinkedToPatient(req.user.id, patientUserId)
    const draft = String(req.body?.draft || '').trim()
    if (draft.length < 2) {
      return sendSuccess(res, { recommendations: [] }, 'OK', 200)
    }
    await assertTherapistAiRecommendationAllowed(req.user.id)
    const recommendations = await getPatientGoalPreviewRecommendations(patientUserId, draft)
    await recordAiRecommendationUsage(req.user.id, 1)
    return sendSuccess(res, { recommendations }, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function previewPatientGoalRecommendations(req, res, next) {
  try {
    const patientUserId = req.user.id
    const draft = String(req.body?.draft || '').trim()

    const draftCrisis = detectCrisis(draft)
    if (draftCrisis.isCrisis || !isMeaningfulGoalDraft(draft)) {
      return sendSuccess(
        res,
        { recommendations: [], isCrisis: draftCrisis.isCrisis, severity: draftCrisis.severity },
        'OK',
        200
      )
    }

    const therapistUserId = await resolveTherapistForPatient(patientUserId)
    if (therapistUserId) {
      await assertTherapistAiRecommendationAllowed(therapistUserId)
    }
    const recommendations = await getPatientGoalPreviewRecommendations(patientUserId, draft)
    if (therapistUserId) {
      await recordAiRecommendationUsage(therapistUserId, 1)
    }
    return sendSuccess(res, { recommendations, isCrisis: false }, 'OK', 200)
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

export async function getLlmHealth(req, res, next) {
  try {
    const health = await checkLlmHealth()
    const status = health.ok ? 200 : 503
    return sendSuccess(res, health, health.message || 'LLM health', status)
  } catch (e) {
    next(e)
  }
}
