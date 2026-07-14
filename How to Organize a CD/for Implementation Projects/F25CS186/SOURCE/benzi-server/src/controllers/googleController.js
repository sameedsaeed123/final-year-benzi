import { sendSuccess, sendError } from '../utils/responseUtils.js'
import { getTherapistGoogleAuthUrl, saveTherapistGoogleTokensFromCode, backfillMeetLinksForTherapist } from '../services/googleCalendarService.js'
import { Therapist } from '../models/Therapist.js'

export async function therapistGoogleAuthUrl(req, res, next) {
  try {
    const url = getTherapistGoogleAuthUrl(req.user.id)
    return sendSuccess(res, { url }, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function therapistGoogleBackfill(req, res, next) {
  try {
    const result = await backfillMeetLinksForTherapist(req.user.id)
    return sendSuccess(res, result, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function therapistGoogleStatus(req, res, next) {
  try {
    const therapist = await Therapist.findOne({ userId: req.user.id })
      .select('+googleCalendar.refreshToken googleCalendar.connectedAt')
      .lean()
    const connected = Boolean(therapist?.googleCalendar?.refreshToken)
    const connectedAt = therapist?.googleCalendar?.connectedAt || null
    return sendSuccess(res, { connected, connectedAt }, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function googleOAuthCallback(req, res) {
  try {
    const code = String(req.query.code || '')
    const state = String(req.query.state || '')
    if (!code || !state) {
      return res.status(400).send('Missing code/state')
    }

    await saveTherapistGoogleTokensFromCode({ code, state })

    // Minimal UX: close popup + notify opener; fallback to redirect.
    const frontendUrl =
      process.env.THERAPIST_PORTAL_URL || process.env.FRONTEND_URL || 'http://localhost:5173'
    const redirectPath = '/therapist-appointments'
    return res
      .status(200)
      .type('html')
      .send(`<!doctype html>
<html>
  <head><meta charset="utf-8" /><title>Google Connected</title></head>
  <body>
    <p style="font-family:sans-serif;padding:24px;">Google Calendar connected. Meet links will be created for your online appointments.</p>
    <script>
      try {
        if (window.opener) {
          window.opener.postMessage({ type: "BENZI_GOOGLE_CONNECTED" }, "*");
          window.close();
        } else {
          window.location.href = ${JSON.stringify(frontendUrl + redirectPath)};
        }
      } catch (e) {
        window.location.href = ${JSON.stringify(frontendUrl + redirectPath)};
      }
    </script>
  </body>
</html>`)
  } catch (e) {
    const message = e?.message || 'Google connection failed'
    console.error('[GoogleOAuth] Callback error:', message)
    return res.status(400).type('html').send(`<!doctype html>
<html><head><meta charset="utf-8"/><title>Google connect failed</title></head>
<body style="font-family:sans-serif;padding:24px;max-width:520px;">
  <h2>Google Calendar connection failed</h2>
  <p>${message.replace(/</g, '&lt;')}</p>
  <p><strong>Checklist:</strong></p>
  <ul>
    <li>Credentials → <strong>OAuth 2.0 Client ID</strong> type must be <strong>Web application</strong></li>
    <li>Authorized redirect URI: <code>http://localhost:5000/auth/google/callback</code></li>
    <li>OAuth consent screen → add your Gmail under <strong>Test users</strong></li>
    <li>Copy fresh Client ID + Secret from the <em>same</em> client into <code>benzi-server/.env</code> and restart API</li>
  </ul>
</body></html>`)
  }
}

