/** Socket.IO helpers for therapist/patient activity notifications */

let ioInstance = null

export function setSocketServer(io) {
  ioInstance = io
}

export function userRoom(userId) {
  return `user:${userId}`
}

export function emitActivityNotification({
  patientUserId,
  therapistUserId,
  type,
  title,
  message,
  data = {},
  /** If set, only these user ids receive the event (e.g. chat recipient) */
  notifyUserIds = null,
  excludeUserId = null,
}) {
  if (!ioInstance) return

  const payload = {
    type,
    title: title || 'Update',
    message: message || '',
    patientUserId: patientUserId ? String(patientUserId) : null,
    therapistUserId: therapistUserId ? String(therapistUserId) : null,
    data,
    at: new Date().toISOString(),
  }

  const targets = new Set()
  if (Array.isArray(notifyUserIds) && notifyUserIds.length) {
    notifyUserIds.forEach((id) => targets.add(String(id)))
  } else {
    if (patientUserId) targets.add(String(patientUserId))
    if (therapistUserId) targets.add(String(therapistUserId))
  }
  if (excludeUserId) targets.delete(String(excludeUserId))

  for (const uid of targets) {
    ioInstance.to(userRoom(uid)).emit('activity_notification', payload)
  }
}

/** Push refreshed analytics snapshot to both parties */
export function emitStatsUpdated(patientUserId, therapistUserId, analytics) {
  emitActivityNotification({
    patientUserId,
    therapistUserId,
    type: 'stats_updated',
    title: 'Stats updated',
    message: 'Patient wellness stats were refreshed.',
    data: {
      taskScore: analytics?.taskScore,
      progressCenterPct: analytics?.progressCenterPct,
      dominantMood: analytics?.moodLogs?.[analytics.moodLogs?.length - 1]?.dominantLabel,
      aiMessageCount: analytics?.aiMessageCount,
    },
  })
}
