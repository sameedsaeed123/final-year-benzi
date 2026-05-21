import { Router } from 'express'
import { verifyJWT, requireRoles } from '../middleware/verifyJWT.js'
import {
  patientDashboard,
  patientLinkedTherapist,
  getReminderPreferences,
  updateReminderPreferences,
} from '../controllers/patientController.js'

const router = Router()

router.get('/dashboard/me', verifyJWT, requireRoles('patient'), patientDashboard)
router.get('/linked-therapist/me', verifyJWT, requireRoles('patient'), patientLinkedTherapist)
router.get('/reminder-preferences/me', verifyJWT, requireRoles('patient'), getReminderPreferences)
router.put('/reminder-preferences/me', verifyJWT, requireRoles('patient'), updateReminderPreferences)

export default router
