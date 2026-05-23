i/**
 * Anonymous sessions use Jitsi (not Google Meet):
 * - Patient link: mic only, camera button hidden, display name "Anonymous"
 * - Therapist link: full camera + mic (join first to moderate the room)
 * Google Meet always shows the signed-in Google account name.
 */

const JITSI_BASE = (process.env.JITSI_BASE_URL || 'https://meet.jit.si').replace(/\/$/, '')

/** Shown to therapist in Jitsi participant list — never the patient's real name or alias */
export const ANONYMOUS_JITSI_PARTICIPANT_LABEL = 'Anonymous'

export function jitsiRoomName(appointmentId) {
  const id = String(appointmentId).replace(/[^a-zA-Z0-9]/g, '')
  return `benzi${id.slice(-16) || 'session'}`
}

function jitsiHashParams(entries) {
  return entries
    .filter(([, v]) => v !== undefined && v !== null && v !== '')
    .map(([k, v]) => `${k}=${encodeURIComponent(String(v))}`)
    .join('&')
}

/** Patient / joiner: microphone only, no camera control (classroom-style) */
export function buildJitsiPatientLink(appointmentId) {
  const room = jitsiRoomName(appointmentId)
  const hash = jitsiHashParams([
    ['config.prejoinPageEnabled', 'true'],
    ['config.startWithVideoMuted', 'true'],
    ['config.startWithAudioMuted', 'false'],
    ['config.disableCameraButton', 'true'],
    ['config.disableGrantModerator', 'true'],
    ['config.requireDisplayName', 'false'],
    ['userInfo.displayName', ANONYMOUS_JITSI_PARTICIPANT_LABEL],
  ])
  return `${JITSI_BASE}/${room}#${hash}`
}

/** Therapist / host: camera + mic; should join before the patient when possible */
export function buildJitsiTherapistLink(appointmentId, therapistLabel) {
  const room = jitsiRoomName(appointmentId)
  const name = String(therapistLabel || 'Therapist').trim()
  const hash = jitsiHashParams([
    ['config.prejoinPageEnabled', 'true'],
    ['config.startWithVideoMuted', 'false'],
    ['config.startWithAudioMuted', 'false'],
    ['userInfo.displayName', name],
  ])
  return `${JITSI_BASE}/${room}#${hash}`
}

/** @deprecated use buildJitsiPatientLink */
export function buildJitsiAnonymousLink(appointmentId, _displayName) {
  return buildJitsiPatientLink(appointmentId)
}

export function isGoogleMeetUrl(url) {
  return typeof url === 'string' && url.includes('meet.google.com')
}

export function isJitsiUrl(url) {
  return typeof url === 'string' && (url.includes('meet.jit.si') || url.includes('jitsi'))
}
th