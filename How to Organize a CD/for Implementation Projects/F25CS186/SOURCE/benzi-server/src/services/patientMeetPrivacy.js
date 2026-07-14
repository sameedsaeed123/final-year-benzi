import { Patient } from '../models/Patient.js'

export async function getPatientMeetPrivacyContext(patientUserId) {
  const patient = await Patient.findOne({ userId: patientUserId })
    .select('anonymousModeEnabled anonymousAlias')
    .lean()

  const isAnonymous = Boolean(patient?.anonymousModeEnabled)
  const alias =
    patient?.anonymousAlias?.trim() ||
    `Patient #${String(patientUserId).slice(-4).toUpperCase()}`

  return {
    isAnonymous,
    displayName: isAnonymous ? alias : '',
    includePatientAsCalendarAttendee: !isAnonymous,
  }
}

export const ANONYMOUS_MEET_JOIN_STEPS = [
  'Do not sign in with your personal Google account — use “Join as guest” or a private/incognito window if asked.',
  'When prompted for your name, enter only your BENZI alias (shown below) — not your real name.',
  'Turn your camera OFF before joining (camera button in Meet pre-join screen).',
  'You may keep your microphone on or off — therapist can guide you in session.',
]
