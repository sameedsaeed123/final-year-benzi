import fs from 'fs'
import jwt from 'jsonwebtoken'
import { google } from 'googleapis'
import { Therapist } from '../models/Therapist.js'
import { Appointment } from '../models/Appointment.js'
import { User } from '../models/User.js'
import { env } from '../config/environment.js'
import { getPatientMeetPrivacyContext } from './patientMeetPrivacy.js'
import {
  buildJitsiPatientLink,
  buildJitsiTherapistLink,
  isGoogleMeetUrl,
  isJitsiUrl,
} from './videoMeetService.js'

const CALENDAR_TZ = process.env.GOOGLE_CALENDAR_TIMEZONE || 'Asia/Karachi'

const CALENDAR_SCOPES = ['https://www.googleapis.com/auth/calendar.events']

function readGoogleCredentialsFromJson() {
  const jsonPath = process.env.GOOGLE_CREDENTIALS_JSON
  if (!jsonPath || !fs.existsSync(jsonPath)) return null
  try {
    const raw = JSON.parse(fs.readFileSync(jsonPath, 'utf8'))
    const web = raw.web || raw.installed
    if (!web?.client_id || !web?.client_secret) return null
    const redirectUri =
      process.env.GOOGLE_REDIRECT_URI ||
      web.redirect_uris?.find((u) => u.includes('/auth/google/callback')) ||
      'http://localhost:5000/auth/google/callback'
    return {
      clientId: String(web.client_id).trim(),
      clientSecret: String(web.client_secret).trim(),
      redirectUri: String(redirectUri).trim(),
    }
  } catch (e) {
    console.error('[GoogleCalendar] Failed to read GOOGLE_CREDENTIALS_JSON:', e.message)
    return null
  }
}

function resolveGoogleOAuthConfig() {
  const fromJson = readGoogleCredentialsFromJson()
  if (fromJson) return fromJson

  const clientId = String(process.env.GOOGLE_CLIENT_ID || '').trim()
  const clientSecret = String(process.env.GOOGLE_CLIENT_SECRET || '').trim()
  const redirectUri = String(process.env.GOOGLE_REDIRECT_URI || 'http://localhost:5000/auth/google/callback').trim()

  if (!clientId || !clientSecret) {
    const err = new Error(
      'Google OAuth not configured. Set GOOGLE_CLIENT_ID + GOOGLE_CLIENT_SECRET in .env, or set GOOGLE_CREDENTIALS_JSON to your downloaded client_secret JSON file path.'
    )
    err.statusCode = 500
    throw err
  }
  return { clientId, clientSecret, redirectUri }
}

function getOAuthClient() {
  const { clientId, clientSecret, redirectUri } = resolveGoogleOAuthConfig()
  return new google.auth.OAuth2(clientId, clientSecret, redirectUri)
}

function formatGoogleOAuthError(err) {
  const data = err?.response?.data
  if (data?.error_description) return String(data.error_description)
  if (data?.error) return String(data.error)
  return err?.message || 'Google OAuth failed'
}

export function buildTherapistGoogleState(therapistUserId) {
  return jwt.sign(
    {
      therapistUserId: String(therapistUserId),
      nonce: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
    },
    env.JWT_SECRET,
    { expiresIn: '10m' }
  )
}

export function verifyTherapistGoogleState(state) {
  const payload = jwt.verify(state, env.JWT_SECRET)
  if (!payload?.therapistUserId) {
    const err = new Error('Invalid OAuth state')
    err.statusCode = 400
    throw err
  }
  return { therapistUserId: String(payload.therapistUserId) }
}

export function getTherapistGoogleAuthUrl(therapistUserId) {
  const oauth2Client = getOAuthClient()
  const state = buildTherapistGoogleState(therapistUserId)
  return oauth2Client.generateAuthUrl({
    access_type: 'offline',
    prompt: 'consent',
    scope: CALENDAR_SCOPES,
    state,
  })
}

export async function saveTherapistGoogleTokensFromCode({ code, state }) {
  const { therapistUserId } = verifyTherapistGoogleState(state)
  const { redirectUri } = resolveGoogleOAuthConfig()
  const oauth2Client = getOAuthClient()

  let tokens
  try {
    const result = await oauth2Client.getToken({
      code,
      redirect_uri: redirectUri,
    })
    tokens = result.tokens
  } catch (err) {
    const msg = formatGoogleOAuthError(err)
    console.error('[GoogleOAuth] getToken failed:', msg, err?.response?.data || '')
    if (msg.includes('invalid_client') || msg === 'invalid_client') {
      throw new Error(
        'Invalid Google OAuth client. In Google Cloud Console → Credentials → your Web OAuth client: copy Client ID and Client secret again into benzi-server/.env (must be the same client), then restart the server. Or set GOOGLE_CREDENTIALS_JSON=/full/path/to/client_secret_....json'
      )
    }
    throw new Error(msg)
  }

  const refreshToken = tokens.refresh_token || ''
  if (!refreshToken) {
    const err = new Error(
      'Google did not return a refresh_token. Remove the app access from your Google account and reconnect (or ensure prompt=consent).'
    )
    err.statusCode = 400
    throw err
  }

  await Therapist.updateOne(
    { userId: therapistUserId },
    {
      $set: {
        'googleCalendar.refreshToken': refreshToken,
        'googleCalendar.scope': Array.isArray(tokens.scope) ? tokens.scope.join(' ') : String(tokens.scope || ''),
        'googleCalendar.connectedAt': new Date(),
      },
    }
  )

  await backfillMeetLinksForTherapist(therapistUserId)

  return { therapistUserId }
}

function extractMeetLinkFromEvent(data) {
  if (!data) return ''
  if (data.hangoutLink) return data.hangoutLink
  const entryPoints = data.conferenceData?.entryPoints || []
  const video = entryPoints.find((e) => e.entryPointType === 'video')
  return video?.uri || ''
}

/** Create video link for an online appointment. Anonymous → Jitsi (alias + camera off). Else → Google Meet. */
export async function ensureMeetLinkForAppointment(doc) {
  if (!doc || doc.location !== 'online') {
    return doc?.meetLink || ''
  }

  const [patientUser, therapistUser, privacy] = await Promise.all([
    User.findById(doc.patientUserId).select('email firstName lastName').lean(),
    User.findById(doc.therapistUserId).select('email firstName lastName').lean(),
    getPatientMeetPrivacyContext(doc.patientUserId),
  ])

  const isAnonymous = Boolean(doc.bookedAsAnonymous || privacy.isAnonymous)
  const displayName = doc.patientMeetDisplayName || privacy.displayName || 'Patient'

  const mustReplaceGoogle =
    doc.meetLink && isAnonymous && (doc.videoProvider !== 'jitsi' || isGoogleMeetUrl(doc.meetLink))

  const needsJitsiPair =
    isAnonymous &&
    (!doc.meetLink || !doc.therapistMeetLink || mustReplaceGoogle || !isJitsiUrl(doc.meetLink))

  if (doc.meetLink && !needsJitsiPair && !mustReplaceGoogle) {
    return doc.meetLink
  }

  const start = new Date(doc.date)
  const end = new Date(start.getTime() + (doc.durationMinutes || 60) * 60 * 1000)

  if (isAnonymous) {
    const therapistLabel =
      therapistUser
        ? `Dr. ${therapistUser.firstName || ''} ${therapistUser.lastName || ''}`.trim()
        : 'Therapist'
    const patientLink = buildJitsiPatientLink(doc._id)
    const hostLink = buildJitsiTherapistLink(doc._id, therapistLabel)
    doc.meetLink = patientLink
    doc.therapistMeetLink = hostLink
    doc.videoProvider = 'jitsi'

    if (therapistUser?.email) {
      try {
        const { eventId } = await createGoogleCalendarBlockForAppointment({
          therapistUserId: doc.therapistUserId,
          therapistEmail: therapistUser.email,
          summary: 'BENZI Session — Anonymous patient',
          description: [
            'Anonymous BENZI video session. Patient name is hidden.',
            'Join with your therapist (host) link from the BENZI therapist portal — not the patient link.',
            `Therapist video room: ${hostLink}`,
            `Service: ${doc.serviceName || 'Therapy Session'}`,
            `Appointment ID: ${String(doc._id)}`,
          ].join('\n'),
          startDate: start,
          endDate: end,
        })
        doc.googleCalendarEventId = eventId || doc.googleCalendarEventId || ''
      } catch (err) {
        console.error('[GoogleCalendar] Calendar block for anonymous session failed:', err.message)
      }
    }

    await doc.save()
    console.log(`[VideoMeet] Jitsi anonymous links saved for appointment ${doc._id}`)
    return patientLink
  }

  if (!therapistUser?.email) {
    console.warn('[GoogleCalendar] Missing therapist email for appointment', doc._id)
    return ''
  }

  const { meetLink, eventId } = await createGoogleMeetForAppointment({
    therapistUserId: doc.therapistUserId,
    therapistEmail: therapistUser.email,
    patientEmail: patientUser?.email || '',
    isAnonymous: false,
    patientDisplayName: displayName,
    summary: `BENZI Session — ${doc.serviceName || 'Therapy Session'}`,
    description: `BENZI online appointment.\nAppointment ID: ${String(doc._id)}`,
    startDate: start,
    endDate: end,
  })

  if (meetLink) {
    doc.meetLink = meetLink
    doc.videoProvider = 'google'
    doc.googleCalendarEventId = eventId || ''
    await doc.save()
    console.log(`[GoogleCalendar] Meet link saved for appointment ${doc._id}`)
  }
  return doc.meetLink || ''
}

/** After OAuth connect, generate links for future online appointments missing a link. */
export async function backfillMeetLinksForTherapist(therapistUserId) {
  const appts = await Appointment.find({
    therapistUserId,
    location: 'online',
    $or: [{ meetLink: '' }, { meetLink: { $exists: false } }],
    status: { $in: ['PENDING', 'CONFIRMED'] },
    date: { $gte: new Date() },
  })

  let updated = 0
  for (const doc of appts) {
    if (doc.bookedAsAnonymous && doc.meetLink && isGoogleMeetUrl(doc.meetLink)) {
      doc.meetLink = ''
      doc.therapistMeetLink = ''
      await doc.save()
    }
    const link = await ensureMeetLinkForAppointment(doc)
    if (link) updated++
  }
  if (updated > 0) {
    console.log(`[GoogleCalendar] Backfilled ${updated} Meet link(s) for therapist ${therapistUserId}`)
  }
  return { updated, total: appts.length }
}

/** Calendar time block only (no Google Meet) — used for anonymous Jitsi sessions. */
export async function createGoogleCalendarBlockForAppointment({
  therapistUserId,
  therapistEmail,
  summary,
  description,
  startDate,
  endDate,
}) {
  const therapist = await Therapist.findOne({ userId: therapistUserId })
    .select('+googleCalendar.refreshToken')
    .lean()
  const refreshToken = therapist?.googleCalendar?.refreshToken || ''
  if (!refreshToken) return { eventId: '' }

  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({ refresh_token: refreshToken })
  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const resp = await calendar.events.insert({
    calendarId: 'primary',
    resource: {
      summary: summary || 'BENZI Session',
      description: description || '',
      start: { dateTime: new Date(startDate).toISOString(), timeZone: CALENDAR_TZ },
      end: { dateTime: new Date(endDate).toISOString(), timeZone: CALENDAR_TZ },
      attendees: therapistEmail ? [{ email: therapistEmail }] : [],
    },
    sendUpdates: 'none',
  })

  return { eventId: resp?.data?.id || '' }
}

export async function createGoogleMeetForAppointment({
  therapistUserId,
  therapistEmail,
  patientEmail = '',
  isAnonymous = false,
  patientDisplayName = '',
  summary,
  description,
  startDate,
  endDate,
}) {
  const therapist = await Therapist.findOne({ userId: therapistUserId })
    .select('+googleCalendar.refreshToken googleCalendar.connectedAt')
    .lean()
  const refreshToken = therapist?.googleCalendar?.refreshToken || ''
  if (!refreshToken) {
    console.warn(`[GoogleCalendar] Therapist ${therapistUserId} has no Google refresh token — connect via GET /api/google/auth-url`)
    return { meetLink: '', eventId: '' }
  }

  const oauth2Client = getOAuthClient()
  oauth2Client.setCredentials({ refresh_token: refreshToken })

  const calendar = google.calendar({ version: 'v3', auth: oauth2Client })

  const startIso = new Date(startDate).toISOString()
  const endIso = new Date(endDate).toISOString()

  const attendees = []
  if (therapistEmail) attendees.push({ email: therapistEmail })
  if (!isAnonymous && patientEmail) attendees.push({ email: patientEmail })

  const event = {
    summary: summary || (isAnonymous ? `BENZI — ${patientDisplayName || 'Anonymous Patient'}` : 'BENZI Session'),
    description: description || 'Online appointment via BENZI',
    start: { dateTime: startIso, timeZone: CALENDAR_TZ },
    end: { dateTime: endIso, timeZone: CALENDAR_TZ },
    attendees,
    conferenceData: {
      createRequest: {
        requestId: `${Date.now()}_${Math.random().toString(16).slice(2)}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
  }

  const resp = await calendar.events.insert({
    calendarId: 'primary',
    resource: event,
    conferenceDataVersion: 1,
    sendUpdates: isAnonymous ? 'none' : 'all',
  })

  const meetLink = extractMeetLinkFromEvent(resp?.data)
  const eventId = resp?.data?.id || ''
  if (!meetLink) {
    console.warn('[GoogleCalendar] Event created but no Meet link in response:', resp?.data?.id)
  }
  return { meetLink, eventId }
}

