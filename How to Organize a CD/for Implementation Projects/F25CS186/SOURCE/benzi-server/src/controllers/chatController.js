import mongoose from 'mongoose'
import { sendSuccess, sendError } from '../utils/responseUtils.js'
import {
  listConversationsForTherapist,
  listConversationsForPatient,
  getMessages,
  sendMessage,
  markMessagesRead,
  getUnreadCount,
  editMessage,
  deleteMessage,
  setMessageReaction,
} from '../services/chatService.js'
import { processChatUpload } from '../services/chatAttachmentService.js'
import { emitChatMessage, emitChatMessageUpdate, notifyChatRecipient } from '../services/realtimeService.js'
import { detectCrisis } from '../services/crisisDetectionService.js'
import { notifyTherapistOfCrisis } from '../services/crisisAlertService.js'

async function deliverChatMessage(therapistUserId, patientUserId, senderRole, payload) {
  const msg = await sendMessage(payload)

  if (senderRole === 'patient' && payload.text) {
    const crisis = detectCrisis(payload.text)
    if (crisis.isCrisis) {
      const alert = await notifyTherapistOfCrisis(
        patientUserId,
        crisis,
        'therapist_chat',
        therapistUserId
      )
      if (!alert.notified) {
        console.warn('[Chat] Crisis detected but alert failed:', alert.reason || alert.error)
      }
    }
  }

  emitChatMessage(therapistUserId, patientUserId, msg)
  notifyChatRecipient({ therapistUserId, patientUserId, senderRole, message: msg })
  return msg
}

export async function therapistListConversations(req, res, next) {
  try {
    const conversations = await listConversationsForTherapist(req.user.id)
    return sendSuccess(res, { conversations }, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function patientListConversations(req, res, next) {
  try {
    const conversations = await listConversationsForPatient(req.user.id)
    return sendSuccess(res, { conversations }, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function therapistGetMessages(req, res, next) {
  try {
    const { patientUserId } = req.params
    if (!mongoose.Types.ObjectId.isValid(patientUserId)) {
      return sendError(res, 'Invalid patient ID', 400)
    }
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50))
    const before = req.query.before || null
    const messages = await getMessages(req.user.id, patientUserId, limit, before)
    return sendSuccess(res, { messages }, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode, null, e.code)
    next(e)
  }
}

export async function patientGetMessages(req, res, next) {
  try {
    const { therapistUserId } = req.params
    if (!mongoose.Types.ObjectId.isValid(therapistUserId)) {
      return sendError(res, 'Invalid therapist ID', 400)
    }
    const limit = Math.min(100, Math.max(1, parseInt(req.query.limit) || 50))
    const before = req.query.before || null
    const messages = await getMessages(therapistUserId, req.user.id, limit, before)
    return sendSuccess(res, { messages }, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode, null, e.code)
    next(e)
  }
}

export async function therapistUploadAttachment(req, res, next) {
  try {
    const { patientUserId } = req.params
    if (!mongoose.Types.ObjectId.isValid(patientUserId)) {
      return sendError(res, 'Invalid patient ID', 400)
    }
    const attachment = await processChatUpload({
      file: req.file,
      therapistUserId: req.user.id,
      patientUserId,
      userId: req.user.id,
      role: 'therapist',
    })
    return sendSuccess(res, { attachment }, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode, null, e.code)
    next(e)
  }
}

export async function patientUploadAttachment(req, res, next) {
  try {
    const { therapistUserId } = req.params
    if (!mongoose.Types.ObjectId.isValid(therapistUserId)) {
      return sendError(res, 'Invalid therapist ID', 400)
    }
    const attachment = await processChatUpload({
      file: req.file,
      therapistUserId,
      patientUserId: req.user.id,
      userId: req.user.id,
      role: 'patient',
    })
    return sendSuccess(res, { attachment }, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode, null, e.code)
    next(e)
  }
}

export async function therapistSendMessage(req, res, next) {
  try {
    const { patientUserId } = req.params
    if (!mongoose.Types.ObjectId.isValid(patientUserId)) {
      return sendError(res, 'Invalid patient ID', 400)
    }

    let attachment = req.body?.attachment
    if (typeof attachment === 'string') {
      try {
        attachment = JSON.parse(attachment)
      } catch {
        attachment = null
      }
    }

    if (req.file) {
      attachment = await processChatUpload({
        file: req.file,
        therapistUserId: req.user.id,
        patientUserId,
        userId: req.user.id,
        role: 'therapist',
      })
    }

    const msg = await deliverChatMessage(req.user.id, patientUserId, 'therapist', {
      senderUserId: req.user.id,
      senderRole: 'therapist',
      therapistUserId: req.user.id,
      patientUserId,
      text: req.body?.text,
      attachment,
    })
    return sendSuccess(res, { message: msg }, 'Sent', 201)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode, null, e.code)
    next(e)
  }
}

export async function patientSendMessage(req, res, next) {
  try {
    const { therapistUserId } = req.params
    if (!mongoose.Types.ObjectId.isValid(therapistUserId)) {
      return sendError(res, 'Invalid therapist ID', 400)
    }

    let attachment = req.body?.attachment
    if (typeof attachment === 'string') {
      try {
        attachment = JSON.parse(attachment)
      } catch {
        attachment = null
      }
    }

    if (req.file) {
      attachment = await processChatUpload({
        file: req.file,
        therapistUserId,
        patientUserId: req.user.id,
        userId: req.user.id,
        role: 'patient',
      })
    }

    const msg = await deliverChatMessage(therapistUserId, req.user.id, 'patient', {
      senderUserId: req.user.id,
      senderRole: 'patient',
      therapistUserId,
      patientUserId: req.user.id,
      text: req.body?.text,
      attachment,
    })
    return sendSuccess(res, { message: msg }, 'Sent', 201)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode, null, e.code)
    next(e)
  }
}

export async function therapistMarkRead(req, res, next) {
  try {
    const { patientUserId } = req.params
    await markMessagesRead(req.user.id, patientUserId, 'therapist')
    return sendSuccess(res, { ok: true }, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function patientMarkRead(req, res, next) {
  try {
    const { therapistUserId } = req.params
    await markMessagesRead(therapistUserId, req.user.id, 'patient')
    return sendSuccess(res, { ok: true }, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function getMyUnreadCount(req, res, next) {
  try {
    const count = await getUnreadCount(req.user.id, req.user.role)
    return sendSuccess(res, { unread: count }, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function therapistEditMessage(req, res, next) {
  try {
    const { messageId } = req.params
    const result = await editMessage({
      messageId,
      userId: req.user.id,
      role: 'therapist',
      text: req.body?.text,
    })
    emitChatMessageUpdate(result.therapistUserId, result.patientUserId, result.message)
    return sendSuccess(res, { message: result.message }, 'Updated', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode, null, e.code)
    next(e)
  }
}

export async function patientEditMessage(req, res, next) {
  try {
    const { messageId } = req.params
    const result = await editMessage({
      messageId,
      userId: req.user.id,
      role: 'patient',
      text: req.body?.text,
    })
    emitChatMessageUpdate(result.therapistUserId, result.patientUserId, result.message)
    return sendSuccess(res, { message: result.message }, 'Updated', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode, null, e.code)
    next(e)
  }
}

export async function therapistDeleteMessage(req, res, next) {
  try {
    const { messageId } = req.params
    const result = await deleteMessage({
      messageId,
      userId: req.user.id,
      role: 'therapist',
    })
    emitChatMessageUpdate(result.therapistUserId, result.patientUserId, result.message)
    return sendSuccess(res, { message: result.message }, 'Deleted', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode, null, e.code)
    next(e)
  }
}

export async function patientDeleteMessage(req, res, next) {
  try {
    const { messageId } = req.params
    const result = await deleteMessage({
      messageId,
      userId: req.user.id,
      role: 'patient',
    })
    emitChatMessageUpdate(result.therapistUserId, result.patientUserId, result.message)
    return sendSuccess(res, { message: result.message }, 'Deleted', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode, null, e.code)
    next(e)
  }
}

export async function therapistReactMessage(req, res, next) {
  try {
    const { messageId } = req.params
    const result = await setMessageReaction({
      messageId,
      userId: req.user.id,
      role: 'therapist',
      emoji: req.body?.emoji,
    })
    emitChatMessageUpdate(result.therapistUserId, result.patientUserId, result.message)
    return sendSuccess(res, { message: result.message }, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode, null, e.code)
    next(e)
  }
}

export async function patientReactMessage(req, res, next) {
  try {
    const { messageId } = req.params
    const result = await setMessageReaction({
      messageId,
      userId: req.user.id,
      role: 'patient',
      emoji: req.body?.emoji,
    })
    emitChatMessageUpdate(result.therapistUserId, result.patientUserId, result.message)
    return sendSuccess(res, { message: result.message }, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode, null, e.code)
    next(e)
  }
}
