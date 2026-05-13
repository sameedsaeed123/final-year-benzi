import { Router } from 'express'
import { verifyJWT, requireRoles } from '../middleware/verifyJWT.js'
import { patientDashboard, patientLinkedTherapist } from '../controllers/patientController.js'

const router = Router()

router.get('/dashboard/me', verifyJWT, requireRoles('patient'), patientDashboard)
router.get('/linked-therapist/me', verifyJWT, requireRoles('patient'), patientLinkedTherapist)

export default router
