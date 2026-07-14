import { Patient } from '../models/Patient.js'
import { TherapistUsage } from '../models/TherapistUsage.js'
import { TherapistSubscription } from '../models/TherapistSubscription.js'
import { getPlanBySlug, applySubscriptionToTherapist } from './subscriptionService.js'
import { countActiveLinkedPatients, isPatientLinkedToTherapist } from './patientService.js'

const DEFAULT_LIMITS = {
  maxPatients: 5,
  aiMessageLimitMonthly: 50,
  aiRecommendationLimitMonthly: 20,
  aiContextMultiplier: 1,
  contextAwareAi: false,
  digitalContextAi: false,
}

function currentPeriodKey() {
  const d = new Date()
  return `${d.getUTCFullYear()}-${String(d.getUTCMonth() + 1).padStart(2, '0')}`
}

export function subscriptionError(message, code = 'SUBSCRIPTION_LIMIT', statusCode = 403) {
  const err = new Error(message)
  err.statusCode = statusCode
  err.code = code
  return err
}

export async function getEffectiveSubscription(therapistUserId) {
  let sub = await TherapistSubscription.findOne({ therapistUserId }).lean()
  if (!sub) {
    const plan = await getPlanBySlug('try-free')
    if (plan) {
      await applySubscriptionToTherapist(therapistUserId, plan, {
        billingInterval: 'free',
        status: 'active',
      })
      sub = await TherapistSubscription.findOne({ therapistUserId }).lean()
    }
  }

  if (!sub) {
    return { limits: { ...DEFAULT_LIMITS }, planSlug: 'try-free', status: 'active' }
  }

  const active =
    sub.status === 'active' ||
    sub.status === 'trialing' ||
    (sub.status === 'canceled' &&
      sub.currentPeriodEnd &&
      new Date(sub.currentPeriodEnd) > new Date())

  if (!active) {
    return {
      limits: { ...DEFAULT_LIMITS },
      planSlug: sub.planSlug,
      status: sub.status,
      expired: true,
    }
  }

  return {
    limits: { ...DEFAULT_LIMITS, ...(sub.limits || {}) },
    planSlug: sub.planSlug,
    planName: sub.planName,
    status: sub.status,
    billingInterval: sub.billingInterval,
    currentPeriodEnd: sub.currentPeriodEnd,
  }
}

async function getUsage(therapistUserId) {
  const periodKey = currentPeriodKey()
  let usage = await TherapistUsage.findOne({ therapistUserId, periodKey }).lean()
  if (!usage) {
    usage = { aiMessagesUsed: 0, aiRecommendationsUsed: 0, periodKey }
  }
  return usage
}

export async function getUsageSummary(therapistUserId) {
  const sub = await getEffectiveSubscription(therapistUserId)
  const usage = await getUsage(therapistUserId)
  const patientCount = await countActiveLinkedPatients(therapistUserId)

  return {
    planSlug: sub.planSlug,
    planName: sub.planName,
    status: sub.status,
    limits: sub.limits,
    usage: {
      periodKey: usage.periodKey || currentPeriodKey(),
      patients: patientCount,
      aiMessagesUsed: usage.aiMessagesUsed || 0,
      aiRecommendationsUsed: usage.aiRecommendationsUsed || 0,
    },
    remaining: {
      patients: Math.max(0, sub.limits.maxPatients - patientCount),
      aiMessages: Math.max(0, sub.limits.aiMessageLimitMonthly - (usage.aiMessagesUsed || 0)),
      aiRecommendations: Math.max(
        0,
        sub.limits.aiRecommendationLimitMonthly - (usage.aiRecommendationsUsed || 0)
      ),
    },
  }
}

export async function assertCanAddPatient(therapistUserId) {
  const sub = await getEffectiveSubscription(therapistUserId)
  if (sub.expired) {
    throw subscriptionError('Your subscription is inactive. Renew or choose a plan to add patients.')
  }
  const count = await countActiveLinkedPatients(therapistUserId)
  if (count >= sub.limits.maxPatients) {
    throw subscriptionError(
      `Patient limit reached (${sub.limits.maxPatients}). Upgrade your plan to add more patients.`
    )
  }
  return sub
}

export async function resolveTherapistForPatientLimits(patientUserId) {
  const patient = await Patient.findOne({ userId: patientUserId })
    .select('assignedTherapistUserId therapistLinks')
    .lean()
  if (patient?.assignedTherapistUserId && isPatientLinkedToTherapist(patient, patient.assignedTherapistUserId)) {
    return String(patient.assignedTherapistUserId)
  }
  const active = (patient?.therapistLinks || []).find((l) => !l.unlinkedAt)
  return active?.therapistUserId ? String(active.therapistUserId) : null
}

export async function assertPatientAiChatAllowed(patientUserId) {
  const therapistUserId = await resolveTherapistForPatientLimits(patientUserId)
  if (!therapistUserId) {
    return null
  }
  const sub = await getEffectiveSubscription(therapistUserId)
  if (sub.expired) {
    throw subscriptionError('Your therapist must renew their BENZI subscription to use AI chat.')
  }
  const usage = await getUsage(therapistUserId)
  if (usage.aiMessagesUsed >= sub.limits.aiMessageLimitMonthly) {
    throw subscriptionError(
      'Monthly BENZI AI message limit reached for your clinic. Your therapist can upgrade the plan.'
    )
  }
  return { therapistUserId, limits: sub.limits }
}

export async function assertTherapistAiRecommendationAllowed(therapistUserId) {
  const sub = await getEffectiveSubscription(therapistUserId)
  if (sub.expired) {
    throw subscriptionError('Renew your subscription to use AI recommendations.')
  }
  const usage = await getUsage(therapistUserId)
  if (usage.aiRecommendationsUsed >= sub.limits.aiRecommendationLimitMonthly) {
    throw subscriptionError(
      `Monthly AI recommendation limit reached (${sub.limits.aiRecommendationLimitMonthly}). Upgrade to continue.`
    )
  }
  return sub
}

export async function recordAiMessageUsage(therapistUserId) {
  if (!therapistUserId) return
  const periodKey = currentPeriodKey()
  await TherapistUsage.findOneAndUpdate(
    { therapistUserId, periodKey },
    { $inc: { aiMessagesUsed: 1 } },
    { upsert: true }
  )
}

export async function recordAiRecommendationUsage(therapistUserId, count = 1) {
  if (!therapistUserId) return
  const periodKey = currentPeriodKey()
  await TherapistUsage.findOneAndUpdate(
    { therapistUserId, periodKey },
    { $inc: { aiRecommendationsUsed: count } },
    { upsert: true }
  )
}

/** Scale PDF/context depth by plan */
export function applyContextLimits(context, limits) {
  if (!limits) return context
  const mult = Math.max(1, limits.aiContextMultiplier || 1)
  const maxRecords = limits.digitalContextAi
    ? 10
    : limits.contextAwareAi
      ? Math.min(10, Math.ceil(3 + mult / 2))
      : Math.min(5, Math.ceil(2 + mult / 5))
  const maxChars = limits.digitalContextAi
    ? 3500
    : limits.contextAwareAi
      ? Math.min(3500, 800 + mult * 200)
      : 600

  const records = (context.records || []).slice(0, maxRecords).map((r) => ({
    ...r,
    extractedText: String(r.extractedText || '').slice(0, maxChars),
  }))

  const chatLimit = limits.digitalContextAi ? 20 : limits.contextAwareAi ? 15 : 8
  const chatHistory = (context.chatHistory || []).slice(-chatLimit)

  return {
    ...context,
    records,
    chatHistory,
    subscriptionContextTier: limits.digitalContextAi
      ? 'digital'
      : limits.contextAwareAi
        ? 'context'
        : 'basic',
  }
}

export async function ensureTherapistDefaultPlan(therapistUserId) {
  const existing = await TherapistSubscription.findOne({ therapistUserId }).lean()
  if (existing) return existing
  const plan = await getPlanBySlug('try-free')
  if (!plan) return null
  return applySubscriptionToTherapist(therapistUserId, plan, {
    billingInterval: 'free',
    status: 'active',
  })
}
