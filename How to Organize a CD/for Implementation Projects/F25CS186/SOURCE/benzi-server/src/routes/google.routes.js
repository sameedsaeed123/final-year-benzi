import { Router } from 'express'
import { verifyJWT, requireRoles } from '../middleware/verifyJWT.js'
import { therapistGoogleAuthUrl, therapistGoogleStatus, therapistGoogleBackfill, googleOAuthCallback } from '../controllers/googleController.js'

const router = Router()

// Therapist initiates OAuth (frontend fetches URL, then redirects user)
router.get('/api/google/auth-url', verifyJWT, requireRoles('therapist'), therapistGoogleAuthUrl)
router.get('/api/google/status', verifyJWT, requireRoles('therapist'), therapistGoogleStatus)
router.post('/api/google/backfill', verifyJWT, requireRoles('therapist'), therapistGoogleBackfill)

// OAuth callback (matches GOOGLE_REDIRECT_URI; not under /api so Google Console config can stay as provided)
router.get('/auth/google/callback', googleOAuthCallback)

export default router

