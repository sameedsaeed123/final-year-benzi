import mongoose from 'mongoose'
import { sendSuccess, sendError } from '../utils/responseUtils.js'
import {
  listConversationsForTherapist,
  listConversationsForPatient,
  getMessages,
  sendMessage,
  markMessagesRead,
  getUnreadCount,
} from '../services/chatService.js'

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
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
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
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function therapistSendMessage(req, res, next) {
  try {
    const { patientUserId } = req.params
    if (!mongoose.Types.ObjectId.isValid(patientUserId)) {
      return sendError(res, 'Invalid patient ID', 400)
    }
    const msg = await sendMessage({
      senderUserId: req.user.id,
      senderRole: 'therapist',
      therapistUserId: req.user.id,
      patientUserId,
      text: req.body.text,
    })
    return sendSuccess(res, { message: msg }, 'Sent', 201)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function patientSendMessage(req, res, next) {
  try {
    const { therapistUserId } = req.params
    if (!mongoose.Types.ObjectId.isValid(therapistUserId)) {
      return sendError(res, 'Invalid therapist ID', 400)
    }
    const msg = await sendMessage({
      senderUserId: req.user.id,
      senderRole: 'patient',
      therapistUserId,
      patientUserId: req.user.id,
      text: req.body.text,
    })
    return sendSuccess(res, { message: msg }, 'Sent', 201)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
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
