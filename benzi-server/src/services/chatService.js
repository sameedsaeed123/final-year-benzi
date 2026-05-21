import mongoose from 'mongoose'
import { Message } from '../models/Message.js'
import { User } from '../models/User.js'
import { Appointment } from '../models/Appointment.js'
import { Patient } from '../models/Patient.js'

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

// Verify the two users have an appointment relationship
async function assertChatAllowed(therapistUserId, patientUserId) {
  const appt = await Appointment.findOne({
    therapistUserId,
    patientUserId,
    status: { $in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
  }).select('_id').lean()
  if (!appt) {
    const err = new Error('Chat not allowed — no appointment relationship')
    err.statusCode = 403
    throw err
  }
}

// Get all conversations for a therapist (one per patient, latest message)
export async function listConversationsForTherapist(therapistUserId) {
  const pipeline = [
    { $match: { therapistUserId: new mongoose.Types.ObjectId(therapistUserId), deletedAt: null } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$patientUserId',
        lastMessage: { $first: '$text' },
        lastAt: { $first: '$createdAt' },
        lastSenderRole: { $first: '$senderRole' },
        unread: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$senderRole', 'patient'] }, { $eq: ['$readAt', null] }] },
              1, 0,
            ],
          },
        },
      },
    },
    { $sort: { lastAt: -1 } },
  ]

  const rows = await Message.aggregate(pipeline)
  if (!rows.length) return []

  const patientIds = rows.map((r) => r._id)
  const users = await User.find({ _id: { $in: patientIds } })
    .select('firstName lastName profileImageUrl')
    .lean()
  const patients = await Patient.find({ userId: { $in: patientIds } })
    .select('userId anonymousModeEnabled anonymousAlias')
    .lean()

  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]))
  const patientMap = Object.fromEntries(patients.map((p) => [String(p.userId), p]))

  return rows.map((r) => {
    const pid = String(r._id)
    const u = userMap[pid]
    const p = patientMap[pid]
    const isAnon = p?.anonymousModeEnabled || false
    const alias = p?.anonymousAlias || `Patient #${pid.slice(-4).toUpperCase()}`
    return {
      patientUserId: pid,
      name: isAnon ? alias : (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Patient' : 'Patient'),
      image: isAnon ? '' : (u?.profileImageUrl || ''),
      isAnonymous: isAnon,
      lastMessage: r.lastMessage,
      lastAt: formatDate(r.lastAt),
      lastAtRaw: r.lastAt,
      lastSenderRole: r.lastSenderRole,
      unread: r.unread,
    }
  })
}

// Get all conversations for a patient (one per therapist, latest message)
export async function listConversationsForPatient(patientUserId) {
  const pipeline = [
    { $match: { patientUserId: new mongoose.Types.ObjectId(patientUserId), deletedAt: null } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$therapistUserId',
        lastMessage: { $first: '$text' },
        lastAt: { $first: '$createdAt' },
        lastSenderRole: { $first: '$senderRole' },
        unread: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$senderRole', 'therapist'] }, { $eq: ['$readAt', null] }] },
              1, 0,
            ],
          },
        },
      },
    },
    { $sort: { lastAt: -1 } },
  ]

  const rows = await Message.aggregate(pipeline)
  if (!rows.length) return []

  const therapistIds = rows.map((r) => r._id)
  const users = await User.find({ _id: { $in: therapistIds } })
    .select('firstName lastName profileImageUrl')
    .lean()

  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]))

  return rows.map((r) => {
    const tid = String(r._id)
    const u = userMap[tid]
    return {
      therapistUserId: tid,
      name: u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Therapist' : 'Therapist',
      image: u?.profileImageUrl || '',
      lastMessage: r.lastMessage,
      lastAt: formatDate(r.lastAt),
      lastAtRaw: r.lastAt,
      lastSenderRole: r.lastSenderRole,
      unread: r.unread,
    }
  })
}

// Get message history for a conversation
export async function getMessages(therapistUserId, patientUserId, limit = 50, before = null) {
  await assertChatAllowed(therapistUserId, patientUserId)

  const query = {
    therapistUserId: new mongoose.Types.ObjectId(therapistUserId),
    patientUserId: new mongoose.Types.ObjectId(patientUserId),
    deletedAt: null,
  }
  if (before) query.createdAt = { $lt: new Date(before) }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()

  return messages.reverse().map((m) => ({
    id: String(m._id),
    senderUserId: String(m.senderUserId),
    senderRole: m.senderRole,
    text: m.text,
    readAt: m.readAt,
    createdAt: m.createdAt,
    formattedAt: formatDate(m.createdAt),
  }))
}

// Send a message (REST fallback — Socket.IO is primary)
export async function sendMessage({ senderUserId, senderRole, therapistUserId, patientUserId, text }) {
  await assertChatAllowed(therapistUserId, patientUserId)

  if (!text || !String(text).trim()) {
    const err = new Error('Message text is required')
    err.statusCode = 400
    throw err
  }

  const doc = await Message.create({
    therapistUserId,
    patientUserId,
    senderUserId,
    senderRole,
    text: String(text).trim().slice(0, 4000),
  })

  return {
    id: String(doc._id),
    senderUserId: String(doc.senderUserId),
    senderRole: doc.senderRole,
    text: doc.text,
    readAt: doc.readAt,
    createdAt: doc.createdAt,
    formattedAt: formatDate(doc.createdAt),
  }
}

// Mark messages as read
export async function markMessagesRead(therapistUserId, patientUserId, readerRole) {
  const senderRole = readerRole === 'therapist' ? 'patient' : 'therapist'
  await Message.updateMany(
    {
      therapistUserId: new mongoose.Types.ObjectId(therapistUserId),
      patientUserId: new mongoose.Types.ObjectId(patientUserId),
      senderRole,
      readAt: null,
    },
    { $set: { readAt: new Date() } }
  )
}

// Get total unread count for a user
export async function getUnreadCount(userId, role) {
  const senderRole = role === 'therapist' ? 'patient' : 'therapist'
  const matchField = role === 'therapist' ? 'therapistUserId' : 'patientUserId'
  const count = await Message.countDocuments({
    [matchField]: new mongoose.Types.ObjectId(userId),
    senderRole,
    readAt: null,
    deletedAt: null,
  })
  return count
}
