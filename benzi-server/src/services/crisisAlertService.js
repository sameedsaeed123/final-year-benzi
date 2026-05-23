import { User } from '../models/User.js'
import { sendEmail } from './emailService.js'
import { templateIds, emailCategory, emailPriority } from '../config/email.js'
import { resolveTherapistForPatient } from './aiAccessService.js'
import { emitActivityNotification } from './realtimeService.js'
import { detectCrisis } from './crisisDetectionService.js'

export function crisisPatientMessage(severity) {
  if (severity === 'high') {
    return "I'm really glad you reached out. What you're carrying sounds unbearably heavy — your therapist has been notified and they are the right person to support you now. If you're in immediate danger, call your local emergency number."
  }
  return "Thank you for trusting me with that. Your therapist has been alerted — please lean on them for your care; I'm only extra support between sessions. What feels most urgent right now?"
}

export function crisisInsightBlock(severity) {
  return {
    isCrisis: true,
    severity,
    insight: crisisPatientMessage(severity),
    tips: [
      'If you are in immediate danger, call emergency services now.',
      'Your therapist has been notified — they are your main support.',
      'Message your therapist in the app when you can.',
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

export async function notifyTherapistOfCrisis(patientUserId, crisis, source = 'app') {
  if (!crisis?.isCrisis) return { notified: false }

  try {
    const therapistUserId = await resolveTherapistForPatient(patientUserId)
    if (!therapistUserId) return { notified: false, reason: 'no_therapist' }

    const [therapistUser, patientUser] = await Promise.all([
      User.findById(therapistUserId).select('email firstName').lean(),
      User.findById(patientUserId).select('firstName lastName').lean(),
    ])

    if (!therapistUser?.email) return { notified: false, reason: 'no_email' }

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
      metadata: { patientUserId, crisis, source },
    })

    emitActivityNotification({
      patientUserId,
      therapistUserId,
      notifyUserIds: [String(therapistUserId)],
      type: 'crisis_alert',
      title: 'Crisis alert',
      message: 'A patient used concerning language — review immediately',
      data: { severity: crisis.severity, source, phrases: crisis.matchedPhrases?.slice(0, 5) },
    })

    return { notified: true, therapistUserId }
  } catch (err) {
    console.error('[CrisisAlert] Failed to send therapist alert:', err.message)
    return { notified: false, error: err.message }
  }
}
