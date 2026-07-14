import { Router } from 'express'
import { verifyJWT, requireRoles } from '../middleware/verifyJWT.js'
import { uploadChatAttachmentMiddleware } from '../middleware/chatUpload.js'
import {
  therapistListConversations,
  patientListConversations,
  therapistGetMessages,
  patientGetMessages,
  therapistSendMessage,
  patientSendMessage,
  therapistUploadAttachment,
  patientUploadAttachment,
  therapistMarkRead,
  patientMarkRead,
  getMyUnreadCount,
  therapistEditMessage,
  patientEditMessage,
  therapistDeleteMessage,
  patientDeleteMessage,
  therapistReactMessage,
  patientReactMessage,
} from '../controllers/chatController.js'

const router = Router()

function optionalChatFile(req, res, next) {
  uploadChatAttachmentMiddleware.single('file')(req, res, (err) => {
    if (err) {
      err.statusCode = 400
      return next(err)
    }
    next()
  })
}

router.get('/unread', verifyJWT, getMyUnreadCount)

router.get('/therapist/conversations', verifyJWT, requireRoles('therapist'), therapistListConversations)
router.get('/therapist/messages/:patientUserId', verifyJWT, requireRoles('therapist'), therapistGetMessages)
router.post(
  '/therapist/attachments/:patientUserId',
  verifyJWT,
  requireRoles('therapist'),
  optionalChatFile,
  therapistUploadAttachment
)
router.post(
  '/therapist/messages/:patientUserId',
  verifyJWT,
  requireRoles('therapist'),
  optionalChatFile,
  therapistSendMessage
)
router.patch('/therapist/read/:patientUserId', verifyJWT, requireRoles('therapist'), therapistMarkRead)
router.patch('/therapist/messages/:patientUserId/:messageId', verifyJWT, requireRoles('therapist'), therapistEditMessage)
router.delete('/therapist/messages/:patientUserId/:messageId', verifyJWT, requireRoles('therapist'), therapistDeleteMessage)
router.patch('/therapist/messages/:patientUserId/:messageId/reaction', verifyJWT, requireRoles('therapist'), therapistReactMessage)

router.get('/patient/conversations', verifyJWT, requireRoles('patient'), patientListConversations)
router.get('/patient/messages/:therapistUserId', verifyJWT, requireRoles('patient'), patientGetMessages)
router.post(
  '/patient/attachments/:therapistUserId',
  verifyJWT,
  requireRoles('patient'),
  optionalChatFile,
  patientUploadAttachment
)
router.post(
  '/patient/messages/:therapistUserId',
  verifyJWT,
  requireRoles('patient'),
  optionalChatFile,
  patientSendMessage
)
router.patch('/patient/read/:therapistUserId', verifyJWT, requireRoles('patient'), patientMarkRead)
router.patch('/patient/messages/:therapistUserId/:messageId', verifyJWT, requireRoles('patient'), patientEditMessage)
router.delete('/patient/messages/:therapistUserId/:messageId', verifyJWT, requireRoles('patient'), patientDeleteMessage)
router.patch('/patient/messages/:therapistUserId/:messageId/reaction', verifyJWT, requireRoles('patient'), patientReactMessage)

export default router
