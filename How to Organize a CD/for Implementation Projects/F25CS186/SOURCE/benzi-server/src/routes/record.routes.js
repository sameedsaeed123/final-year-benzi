import { Router } from 'express'
import { verifyJWT, requireRoles } from '../middleware/verifyJWT.js'
import { recordUploadMiddleware } from '../middleware/recordUpload.js'
import {
  patientListRecords,
  therapistListPatientRecords,
  uploadRecordHandler,
  therapistUpdateReview,
  patientAddFeedback,
  deleteRecordHandler,
  patientToggleAnonymous,
  patientGetAnonymousStatus,
  therapistListPatients,
  patientRetryRedaction,
} from '../controllers/recordController.js'

const router = Router()

// ─── Patient routes ───────────────────────────────────────────────────────────
// NOTE: specific named routes MUST come before wildcard /:id routes
router.get('/patient/me', verifyJWT, requireRoles('patient'), patientListRecords)
router.get('/anonymous/status', verifyJWT, requireRoles('patient'), patientGetAnonymousStatus)
router.post('/anonymous/toggle', verifyJWT, requireRoles('patient'), patientToggleAnonymous)
router.post('/anonymous/retry-redaction', verifyJWT, requireRoles('patient'), patientRetryRedaction)

// ─── Therapist routes ─────────────────────────────────────────────────────────
router.get('/therapist/patients', verifyJWT, requireRoles('therapist'), therapistListPatients)
router.get('/therapist/patient/:patientUserId', verifyJWT, requireRoles('therapist'), therapistListPatientRecords)
router.patch('/therapist/:id/review', verifyJWT, requireRoles('therapist'), therapistUpdateReview)

// ─── Shared: upload ───────────────────────────────────────────────────────────
router.post(
  '/upload',
  verifyJWT,
  requireRoles('patient', 'therapist'),
  (req, res, next) => {
    recordUploadMiddleware.single('file')(req, res, (err) => {
      if (err) {
        err.statusCode = 400
        return next(err)
      }
      next()
    })
  },
  uploadRecordHandler
)

// ─── Wildcard /:id routes — must be last ──────────────────────────────────────
router.post('/:id/feedback', verifyJWT, requireRoles('patient'), patientAddFeedback)
router.delete('/:id', verifyJWT, requireRoles('patient', 'therapist'), deleteRecordHandler)

export default router
