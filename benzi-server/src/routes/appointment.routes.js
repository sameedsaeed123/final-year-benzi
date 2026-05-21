import { Router } from 'express'
import { verifyJWT, requireRoles } from '../middleware/verifyJWT.js'
import { uploadPaymentScreenshotMiddleware } from '../middleware/paymentUpload.js'
import {
  patientAppointments,
  therapistAppointments,
  patientCreateAppointment,
  therapistPatchAppointment,
  therapistAvailabilitySlots,
  getAppointmentById,
  therapistCalendarDates,
  regenerateAppointmentVideo,
} from '../controllers/appointmentController.js'

const router = Router()

router.post(
  '/',
  verifyJWT,
  requireRoles('patient'),
  (req, res, next) => {
    uploadPaymentScreenshotMiddleware.single('paymentScreenshot')(req, res, (err) => {
      if (err) {
        err.statusCode = 400
        return next(err)
      }
      next()
    })
  },
  patientCreateAppointment
)
router.get('/availability/:therapistUserId', verifyJWT, requireRoles('patient'), therapistAvailabilitySlots)
router.get('/patient/me', verifyJWT, requireRoles('patient'), patientAppointments)
router.get('/therapist/me', verifyJWT, requireRoles('therapist'), therapistAppointments)
router.get('/therapist/calendar', verifyJWT, requireRoles('therapist'), therapistCalendarDates)
router.post('/:id/regenerate-video', verifyJWT, requireRoles('patient', 'therapist'), regenerateAppointmentVideo)
router.get('/:id', verifyJWT, requireRoles('patient', 'therapist'), getAppointmentById)
router.patch('/:id', verifyJWT, requireRoles('therapist'), therapistPatchAppointment)

export default router
