import { syncPatientAiStats } from './aiStatsService.js'
import { resolveTherapistForPatient } from './aiAccessService.js'
import { emitActivityNotification, emitStatsUpdated } from './realtimeService.js'

/**
 * Recompute PatientAiStats in DB and notify therapist + patient in real time.
 */
export async function syncStatsAndNotify(patientUserId, activity = {}) {
  const analytics = await syncPatientAiStats(patientUserId)
  const therapistUserId =
    activity.therapistUserId || (await resolveTherapistForPatient(patientUserId))

  if (activity.type) {
    emitActivityNotification({
      patientUserId,
      therapistUserId,
      type: activity.type,
      title: activity.title,
      message: activity.message,
      data: { ...activity.data, stats: activity.includeStats ? analytics : undefined },
    })
  }

  emitStatsUpdated(patientUserId, therapistUserId, analytics)
  return analytics
}
