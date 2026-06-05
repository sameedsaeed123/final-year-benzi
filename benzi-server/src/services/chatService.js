import mongoose from 'mongoose'
import { Message } from '../models/Message.js'
import { User } from '../models/User.js'
import { Therapist } from '../models/Therapist.js'
import { Patient } from '../models/Patient.js'
import { assertChatAllowed } from './chatAccess.js'
import { formatAttachment, buildListPreview } from './chatAttachmentService.js'

export { assertChatAllowed }

function formatDate(d) {
  if (!d) return ''
  return new Date(d).toLocaleString('en-GB', {
    day: 'numeric', month: 'short', year: 'numeric',
    hour: 'numeric', minute: '2-digit', hour12: true,
  })
}

const EDIT_WINDOW_MS = 15 * 60 * 1000

function isValidReactionEmoji(emoji) {
  const trimmed = String(emoji || '').trim()
  if (!trimmed || trimmed.length > 8) return false
  try {
    return /^(\p{Extended_Pictographic}\uFE0F?([\u200D]\p{Extended_Pictographic}\uFE0F?)*)+$/u.test(trimmed)
  } catch {
    return [...trimmed].length <= 4
  }
}

function formatReactions(reactions = []) {
  return (reactions || []).map((r) => ({
    emoji: r.emoji,
    userId: String(r.userId),
    role: r.role,
  }))
}

function formatMessageOut(m) {
  const deleted = !!m.deletedAt
  const attachment = deleted ? null : formatAttachment(m)
  return {
    id: String(m._id),
    senderUserId: String(m.senderUserId),
    senderRole: m.senderRole,
    text: deleted ? '' : (m.text || ''),
    attachment,
    readAt: m.readAt,
    editedAt: m.editedAt || null,
    isDeleted: deleted,
    reactions: formatReactions(m.reactions),
    createdAt: m.createdAt,
    formattedAt: formatDate(m.createdAt),
  }
}

async function getMessageForUser(messageId, userId, role) {
  if (!mongoose.Types.ObjectId.isValid(messageId)) {
    const err = new Error('Invalid message ID')
    err.statusCode = 400
    throw err
  }
  const doc = await Message.findById(messageId).lean()
  if (!doc || doc.deletedAt) {
    const err = new Error('Message not found')
    err.statusCode = 404
    throw err
  }

  const tid = String(doc.therapistUserId)
  const pid = String(doc.patientUserId)
  if (role === 'therapist' && String(userId) !== tid) {
    const err = new Error('Forbidden')
    err.statusCode = 403
    throw err
  }
  if (role === 'patient' && String(userId) !== pid) {
    const err = new Error('Forbidden')
    err.statusCode = 403
    throw err
  }
  await assertChatAllowed(tid, pid)
  return { doc, therapistUserId: tid, patientUserId: pid }
}

export async function listConversationsForTherapist(therapistUserId) {
  const pipeline = [
    { $match: { therapistUserId: new mongoose.Types.ObjectId(therapistUserId) } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$patientUserId',
        lastMessage: { $first: { $ifNull: ['$listPreview', '$text'] } },
        lastAt: { $first: '$createdAt' },
        lastSenderRole: { $first: '$senderRole' },
        unread: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$senderRole', 'patient'] }, { $eq: ['$readAt', null] }, { $eq: ['$deletedAt', null] }] },
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

export async function listConversationsForPatient(patientUserId) {
  const pipeline = [
    { $match: { patientUserId: new mongoose.Types.ObjectId(patientUserId) } },
    { $sort: { createdAt: -1 } },
    {
      $group: {
        _id: '$therapistUserId',
        lastMessage: { $first: { $ifNull: ['$listPreview', '$text'] } },
        lastAt: { $first: '$createdAt' },
        lastSenderRole: { $first: '$senderRole' },
        unread: {
          $sum: {
            $cond: [
              { $and: [{ $eq: ['$senderRole', 'therapist'] }, { $eq: ['$readAt', null] }, { $eq: ['$deletedAt', null] }] },
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
  const [users, therapists] = await Promise.all([
    User.find({ _id: { $in: therapistIds } })
      .select('firstName lastName profileImageUrl')
      .lean(),
    Therapist.find({ userId: { $in: therapistIds } })
      .select('userId profileImageUrl')
      .lean(),
  ])

  const userMap = Object.fromEntries(users.map((u) => [String(u._id), u]))
  const therapistMap = Object.fromEntries(therapists.map((t) => [String(t.userId), t]))

  return rows.map((r) => {
    const tid = String(r._id)
    const u = userMap[tid]
    const t = therapistMap[tid]
    const image = (u?.profileImageUrl || t?.profileImageUrl || '').trim()
    return {
      therapistUserId: tid,
      name: u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Therapist' : 'Therapist',
      image,
      lastMessage: r.lastMessage,
      lastAt: formatDate(r.lastAt),
      lastAtRaw: r.lastAt,
      lastSenderRole: r.lastSenderRole,
      unread: r.unread,
    }
  })
}

export async function getMessages(therapistUserId, patientUserId, limit = 50, before = null) {
  await assertChatAllowed(therapistUserId, patientUserId)

  const query = {
    therapistUserId: new mongoose.Types.ObjectId(therapistUserId),
    patientUserId: new mongoose.Types.ObjectId(patientUserId),
  }
  if (before) query.createdAt = { $lt: new Date(before) }

  const messages = await Message.find(query)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean()

  return messages.reverse().map((m) => formatMessageOut(m))
}

export async function sendMessage({
  senderUserId,
  senderRole,
  therapistUserId,
  patientUserId,
  text,
  attachment,
}) {
  await assertChatAllowed(therapistUserId, patientUserId)

  const caption = String(text || '').trim().slice(0, 4000)
  const hasAttachment = attachment?.type && attachment?.url

  if (!caption && !hasAttachment) {
    const err = new Error('Message text or attachment is required')
    err.statusCode = 400
    throw err
  }

  const listPreview = buildListPreview(caption, attachment)
  const doc = await Message.create({
    therapistUserId,
    patientUserId,
    senderUserId,
    senderRole,
    text: caption,
    listPreview,
    attachment: hasAttachment
      ? {
          type: attachment.type,
          url: attachment.url,
          name: attachment.name || '',
          mimeType: attachment.mimeType || '',
          size: attachment.size || 0,
        }
      : undefined,
  })

  return formatMessageOut(doc.toObject())
}

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

export async function editMessage({ messageId, userId, role, text }) {
  const { doc, therapistUserId, patientUserId } = await getMessageForUser(messageId, userId, role)

  if (String(doc.senderUserId) !== String(userId)) {
    const err = new Error('You can only edit your own messages')
    err.statusCode = 403
    throw err
  }

  const hasAttachment = doc.attachment?.type
  const trimmed = String(text || '').trim().slice(0, 4000)
  if (!trimmed) {
    const err = new Error('Message text is required')
    err.statusCode = 400
    throw err
  }

  if (hasAttachment && !String(doc.text || '').trim()) {
    const err = new Error('This message cannot be edited')
    err.statusCode = 400
    throw err
  }

  const age = Date.now() - new Date(doc.createdAt).getTime()
  if (age > EDIT_WINDOW_MS) {
    const err = new Error('Messages can only be edited within 15 minutes')
    err.statusCode = 400
    throw err
  }

  const listPreview = buildListPreview(trimmed, hasAttachment ? formatAttachment(doc) : null)
  const updated = await Message.findByIdAndUpdate(
    messageId,
    { $set: { text: trimmed, listPreview, editedAt: new Date() } },
    { new: true }
  ).lean()

  return { message: formatMessageOut(updated), therapistUserId, patientUserId }
}

export async function deleteMessage({ messageId, userId, role }) {
  const { doc, therapistUserId, patientUserId } = await getMessageForUser(messageId, userId, role)

  if (String(doc.senderUserId) !== String(userId)) {
    const err = new Error('You can only delete your own messages')
    err.statusCode = 403
    throw err
  }

  const updated = await Message.findByIdAndUpdate(
    messageId,
    {
      $set: {
        deletedAt: new Date(),
        text: '',
        listPreview: 'This message was deleted',
        attachment: { type: null, url: '', name: '', mimeType: '', size: 0 },
        reactions: [],
      },
    },
    { new: true }
  ).lean()

  return { message: formatMessageOut(updated), therapistUserId, patientUserId }
}

export async function setMessageReaction({ messageId, userId, role, emoji }) {
  const { doc, therapistUserId, patientUserId } = await getMessageForUser(messageId, userId, role)

  const reactions = [...(doc.reactions || [])]
  const idx = reactions.findIndex((r) => String(r.userId) === String(userId))
  const normalized = String(emoji || '').trim()

  if (!normalized) {
    if (idx !== -1) reactions.splice(idx, 1)
  } else {
    if (!isValidReactionEmoji(normalized)) {
      const err = new Error('Invalid reaction emoji')
      err.statusCode = 400
      throw err
    }
    const entry = { emoji: normalized, userId, role }
    if (idx !== -1) {
      if (reactions[idx].emoji === normalized) reactions.splice(idx, 1)
      else reactions[idx] = entry
    } else {
      reactions.push(entry)
    }
  }

  const updated = await Message.findByIdAndUpdate(
    messageId,
    { $set: { reactions } },
    { new: true }
  ).lean()

  return { message: formatMessageOut(updated), therapistUserId, patientUserId }
}
