import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from './config/environment.js'
import { Message } from './models/Message.js'
import { assertChatAllowed } from './services/chatAccess.js'
import { sendMessage } from './services/chatService.js'
import {
  setSocketServer,
  userRoom,
  emitChatMessage,
  notifyChatRecipient,
} from './services/realtimeService.js'

function roomId(therapistUserId, patientUserId) {
  return `chat:${therapistUserId}:${patientUserId}`
}

async function verifySocketToken(token) {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET)
    const userId = payload.sub || payload.id
    if (!userId) return null
    return {
      id: String(userId),
      sub: String(userId),
      role: payload.role,
      email: payload.email,
    }
  } catch {
    return null
  }
}

export function initSocket(httpServer) {
  const io = new Server(httpServer, {
    cors: {
      origin: env.FRONTEND_URL,
      methods: ['GET', 'POST'],
      credentials: true,
    },
    pingTimeout: 60000,
    pingInterval: 25000,
  })

  io.use(async (socket, next) => {
    const token = socket.handshake.auth?.token || socket.handshake.query?.token
    if (!token) return next(new Error('Authentication required'))
    const user = await verifySocketToken(token)
    if (!user) return next(new Error('Invalid token'))
    socket.user = user
    next()
  })

  io.on('connection', (socket) => {
    const { id: userId, role } = socket.user
    socket.join(userRoom(userId))

    socket.on('join_room', async ({ therapistUserId, patientUserId }) => {
      if (role === 'therapist' && String(userId) !== String(therapistUserId)) return
      if (role === 'patient' && String(userId) !== String(patientUserId)) return

      try {
        await assertChatAllowed(therapistUserId, patientUserId)
      } catch {
        return
      }

      const room = roomId(therapistUserId, patientUserId)
      socket.join(room)
      socket.currentRoom = room
      socket.currentTherapistId = therapistUserId
      socket.currentPatientId = patientUserId
    })

    socket.on('send_message', async ({ therapistUserId, patientUserId, text, attachment }) => {
      if (role === 'therapist' && String(userId) !== String(therapistUserId)) return
      if (role === 'patient' && String(userId) !== String(patientUserId)) return

      const hasAttachment = attachment?.type && attachment?.url
      const trimmed = String(text || '').trim()
      if (!trimmed && !hasAttachment) return

      try {
        const msg = await sendMessage({
          senderUserId: userId,
          senderRole: role,
          therapistUserId,
          patientUserId,
          text: trimmed,
          attachment: hasAttachment ? attachment : undefined,
        })

        emitChatMessage(therapistUserId, patientUserId, msg)
        notifyChatRecipient({
          therapistUserId,
          patientUserId,
          senderRole: role,
          message: msg,
        })
      } catch {
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    socket.on('typing', ({ therapistUserId, patientUserId, isTyping }) => {
      if (role === 'therapist' && String(userId) !== String(therapistUserId)) return
      if (role === 'patient' && String(userId) !== String(patientUserId)) return
      const room = roomId(therapistUserId, patientUserId)
      socket.to(room).emit('typing', { senderRole: role, isTyping })
    })

    socket.on('mark_read', async ({ therapistUserId, patientUserId }) => {
      const senderRole = role === 'therapist' ? 'patient' : 'therapist'
      await Message.updateMany(
        { therapistUserId, patientUserId, senderRole, readAt: null },
        { $set: { readAt: new Date() } }
      )
      const room = roomId(therapistUserId, patientUserId)
      socket.to(room).emit('messages_read', { byRole: role })
    })

    socket.on('disconnect', () => {})
  })

  setSocketServer(io)
  return io
}
