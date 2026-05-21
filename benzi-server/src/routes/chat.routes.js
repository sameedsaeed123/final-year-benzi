import { Router } from 'express'
import { verifyJWT, requireRoles } from '../middleware/verifyJWT.js'
import {
  therapistListConversations,
  patientListConversations,
  therapistGetMessages,
  patientGetMessages,
  therapistSendMessage,
  patientSendMessage,
  therapistMarkRead,
  patientMarkRead,
  getMyUnreadCount,
} from '../controllers/chatController.js'

const router = Router()

// Shared
router.get('/unread', verifyJWT, getMyUnreadCount)

// Therapist
router.get('/therapist/conversations', verifyJWT, requireRoles('therapist'), therapistListConversations)
router.get('/therapist/messages/:patientUserId', verifyJWT, requireRoles('therapist'), therapistGetMessages)
router.post('/therapist/messages/:patientUserId', verifyJWT, requireRoles('therapist'), therapistSendMessage)
router.patch('/therapist/read/:patientUserId', verifyJWT, requireRoles('therapist'), therapistMarkRead)

// Patient
router.get('/patient/conversations', verifyJWT, requireRoles('patient'), patientListConversations)
router.get('/patient/messages/:therapistUserId', verifyJWT, requireRoles('patient'), patientGetMessages)
router.post('/patient/messages/:therapistUserId', verifyJWT, requireRoles('patient'), patientSendMessage)
router.patch('/patient/read/:therapistUserId', verifyJWT, requireRoles('patient'), patientMarkRead)

export default router
