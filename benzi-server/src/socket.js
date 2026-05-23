import { Server } from 'socket.io'
import jwt from 'jsonwebtoken'
import { env } from './config/environment.js'
import { Message } from './models/Message.js'
import { Appointment } from './models/Appointment.js'
import { setSocketServer, userRoom, emitActivityNotification } from './services/realtimeService.js'

// roomId for a therapist-patient pair
function roomId(therapistUserId, patientUserId) {
  return `chat:${therapistUserId}:${patientUserId}`
}

async function verifySocketToken(token) {
  try {
    const payload = jwt.verify(token, env.JWT_SECRET)
    return payload // { id, role, ... }
  } catch {
    return null
  }
}

async function assertChatAllowed(therapistUserId, patientUserId) {
  const appt = await Appointment.findOne({
    therapistUserId,
    patientUserId,
    status: { $in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
  }).select('_id').lean()
  return !!appt
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

  // Auth middleware
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

    // Join a conversation room
    socket.on('join_room', async ({ therapistUserId, patientUserId }) => {
      // Validate the user is one of the two parties
      if (role === 'therapist' && String(userId) !== String(therapistUserId)) return
      if (role === 'patient' && String(userId) !== String(patientUserId)) return

      const allowed = await assertChatAllowed(therapistUserId, patientUserId)
      if (!allowed) return

      const room = roomId(therapistUserId, patientUserId)
      socket.join(room)
      socket.currentRoom = room
      socket.currentTherapistId = therapistUserId
      socket.currentPatientId = patientUserId
    })

    // Send a message
    socket.on('send_message', async ({ therapistUserId, patientUserId, text }) => {
      if (!text || !String(text).trim()) return
      if (role === 'therapist' && String(userId) !== String(therapistUserId)) return
      if (role === 'patient' && String(userId) !== String(patientUserId)) return

      const allowed = await assertChatAllowed(therapistUserId, patientUserId)
      if (!allowed) return

      try {
        const doc = await Message.create({
          therapistUserId,
          patientUserId,
          senderUserId: userId,
          senderRole: role,
          text: String(text).trim().slice(0, 4000),
        })

        const payload = {
          id: String(doc._id),
          senderUserId: String(doc.senderUserId),
          senderRole: doc.senderRole,
          text: doc.text,
          readAt: doc.readAt,
          createdAt: doc.createdAt,
        }

        const room = roomId(therapistUserId, patientUserId)
        io.to(room).emit('new_message', payload)

        const recipientId = role === 'therapist' ? patientUserId : therapistUserId
        emitActivityNotification({
          patientUserId,
          therapistUserId,
          notifyUserIds: [recipientId],
          type: 'chat_message',
          title: 'New message',
          message:
            role === 'therapist'
              ? 'Your therapist sent you a message'
              : 'Your patient sent a new message',
          data: { messageId: payload.id, preview: payload.text?.slice(0, 80) },
        })
      } catch (e) {
        socket.emit('error', { message: 'Failed to send message' })
      }
    })

    // Typing indicator
    socket.on('typing', ({ therapistUserId, patientUserId, isTyping }) => {
      if (role === 'therapist' && String(userId) !== String(therapistUserId)) return
      if (role === 'patient' && String(userId) !== String(patientUserId)) return
      const room = roomId(therapistUserId, patientUserId)
      socket.to(room).emit('typing', { senderRole: role, isTyping })
    })

    // Mark messages as read
    socket.on('mark_read', async ({ therapistUserId, patientUserId }) => {
      const senderRole = role === 'therapist' ? 'patient' : 'therapist'
      await Message.updateMany(
        { therapistUserId, patientUserId, senderRole, readAt: null },
        { $set: { readAt: new Date() } }
      )
      const room = roomId(therapistUserId, patientUserId)
      socket.to(room).emit('messages_read', { byRole: role })
    })

    socket.on('disconnect', () => {
      // cleanup handled automatically by socket.io
    })
  })

  setSocketServer(io)
  return io
}
