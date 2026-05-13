import { Router } from 'express'
import { verifyJWT, requireRoles } from '../middleware/verifyJWT.js'
import {
  therapistDashboard,
  therapistDirectory,
  therapistProfileMe,
  therapistProfilePatch,
  therapistAvailabilityMe,
  therapistAvailabilityPatch,
} from '../controllers/therapistController.js'
import {
  therapistServicesList,
  therapistServiceCreate,
  therapistServicePatch,
  therapistServiceDelete,
} from '../controllers/therapistServicesController.js'

const router = Router()

router.get('/directory', therapistDirectory)
router.get('/profile/me', verifyJWT, requireRoles('therapist'), therapistProfileMe)
router.patch('/profile/me', verifyJWT, requireRoles('therapist'), therapistProfilePatch)
router.get('/dashboard/me', verifyJWT, requireRoles('therapist'), therapistDashboard)

router.get('/availability/me', verifyJWT, requireRoles('therapist'), therapistAvailabilityMe)
router.patch('/availability/me', verifyJWT, requireRoles('therapist'), therapistAvailabilityPatch)

router.get('/services/me', verifyJWT, requireRoles('therapist'), therapistServicesList)
router.post('/services', verifyJWT, requireRoles('therapist'), therapistServiceCreate)
router.patch('/services/:serviceId', verifyJWT, requireRoles('therapist'), therapistServicePatch)
router.delete('/services/:serviceId', verifyJWT, requireRoles('therapist'), therapistServiceDelete)

export default router
