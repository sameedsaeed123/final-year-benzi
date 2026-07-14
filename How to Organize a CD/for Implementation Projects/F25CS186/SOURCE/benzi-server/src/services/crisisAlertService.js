import { User } from '../models/User.js'
import { sendEmail } from './emailService.js'
import { templateIds, emailCategory, emailPriority } from '../config/email.js'
import { resolveTherapistForPatient } from './aiAccessService.js'
import { emitActivityNotification } from './realtimeService.js'
import { detectCrisis } from './crisisDetectionService.js'

export function crisisPatientMessage(severity) {
  if (severity === 'high') {
    return "I'm really glad you told me. What you're carrying sounds unbearably heavy — your therapist has been notified. Please open Messages and reach them now; they're the right person to support you."
  }
  return "Thank you for trusting me with that. Your therapist has been alerted — message them in the app when you can. What feels most urgent right now?"
}

export function crisisInsightBlock(severity) {
  return {
    isCrisis: true,
    severity,
    insight: crisisPatientMessage(severity),
    tips: [
      'Your therapist has been notified.',
      'Open Messages in the app and reach your therapist.',
      'They are your main support for this.',
    ],
    recommendations: [],
  }
}

/** Skip AI goal chips for nonsense / too-short drafts */
export function isMeaningfulGoalDraft(text) {
  const t = String(text || '').trim()
  if (t.length < 5) return false
  if (detectCrisis(t).isCrisis) return false
  const letters = t.replace(/[^a-zA-Z]/g, '')
  if (letters.length < 4) return false
  if (/^(.)\1{2,}$/i.test(letters)) return false
  if (!/\s/.test(t) && t.length < 12) return false
  return true
}

export async function notifyTherapistOfCrisis(patientUserId, crisis, source = 'app', therapistUserId = null) {
  if (!crisis?.isCrisis) return { notified: false }

  try {
    const resolvedTherapistId =
      therapistUserId || (await resolveTherapistForPatient(patientUserId))
    if (!resolvedTherapistId) {
      console.warn('[CrisisAlert] No therapist to notify for patient', patientUserId)
      return { notified: false, reason: 'no_therapist' }
    }

    const [therapistUser, patientUser] = await Promise.all([
      User.findById(resolvedTherapistId).select('email firstName').lean(),
      User.findById(patientUserId).select('firstName lastName').lean(),
    ])

    if (!therapistUser?.email) {
      console.warn('[CrisisAlert] Therapist has no email:', resolvedTherapistId)
      return { notified: false, reason: 'no_email' }
    }

    await sendEmail({
      to: therapistUser.email,
      templateId: templateIds.CRISIS_ALERT,
      data: {
        patientName:
          `${patientUser?.firstName || ''} ${patientUser?.lastName || ''}`.trim() || 'Your patient',
        severity: crisis.severity.toUpperCase(),
        matchedPhrases: crisis.matchedPhrases.join(', ') || 'concerning language',
        timestamp: new Date().toLocaleString('en-PK', { timeZone: 'Asia/Karachi' }),
        source: source || 'benzi_app',
      },
      category: emailCategory.TRANSACTIONAL,
      priority: emailPriority.HIGH,
      metadata: { patientUserId, crisis, source, therapistUserId: resolvedTherapistId },
    })

    console.log(
      `[CrisisAlert] Email queued/sent to ${therapistUser.email} (${crisis.severity}) source=${source}`
    )

    emitActivityNotification({
      patientUserId,
      therapistUserId: resolvedTherapistId,
      notifyUserIds: [String(resolvedTherapistId)],
      type: 'crisis_alert',
      title: 'Crisis alert',
      message: 'A patient used concerning language — review immediately',
      data: { severity: crisis.severity, source, phrases: crisis.matchedPhrases?.slice(0, 5) },
    })

    return { notified: true, therapistUserId: resolvedTherapistId }
  } catch (err) {
    console.error('[CrisisAlert] Failed to send therapist alert:', err.message)
    return { notified: false, error: err.message }
  }
}
