import fs from 'fs'
import path from 'path'
import { attachmentTypeFromMime, assertChatFileSize } from '../middleware/chatUpload.js'
import { moderateChatImageFile } from './imageModerationService.js'
import { assertChatAllowed } from './chatAccess.js'

export function buildAttachmentPayload(file) {
  const type = attachmentTypeFromMime(file.mimetype)
  if (!type) {
    const err = new Error('Unsupported attachment type')
    err.statusCode = 400
    throw err
  }
  return {
    type,
    url: `/api/files/chat/${file.filename}`,
    name: String(file.originalname || file.filename).slice(0, 200),
    mimeType: file.mimetype,
    size: file.size,
  }
}

export function buildListPreview(text, attachment) {
  const caption = String(text || '').trim()
  if (caption) return caption.slice(0, 200)
  if (!attachment?.type) return ''
  if (attachment.type === 'image') return '[Photo]'
  if (attachment.type === 'pdf') return '[Document]'
  if (attachment.type === 'video') return '[Video]'
  if (attachment.type === 'audio') return '[Voice message]'
  return '[Attachment]'
}

export async function processChatUpload({ file, therapistUserId, patientUserId, userId, role }) {
  if (!file) {
    const err = new Error('No file uploaded')
    err.statusCode = 400
    throw err
  }

  if (role === 'therapist' && String(userId) !== String(therapistUserId)) {
    fs.unlink(file.path, () => {})
    const err = new Error('Forbidden')
    err.statusCode = 403
    throw err
  }
  if (role === 'patient' && String(userId) !== String(patientUserId)) {
    fs.unlink(file.path, () => {})
    const err = new Error('Forbidden')
    err.statusCode = 403
    throw err
  }

  await assertChatAllowed(therapistUserId, patientUserId)
  assertChatFileSize(file)

  const type = attachmentTypeFromMime(file.mimetype)
  if (type === 'image') {
    try {
      await moderateChatImageFile(file.path, file.mimetype)
    } catch (e) {
      fs.unlink(file.path, () => {})
      throw e
    }
  }

  return buildAttachmentPayload(file)
}

export function formatAttachment(doc) {
  if (!doc?.attachment?.type) return null
  return {
    type: doc.attachment.type,
    url: doc.attachment.url,
    name: doc.attachment.name,
    mimeType: doc.attachment.mimeType,
    size: doc.attachment.size,
  }
}

export function removeUploadedFile(url) {
  if (!url || !url.includes('/chat/')) return
  const name = path.basename(url)
  const full = path.join(process.cwd(), 'uploads', 'chat', name)
  fs.unlink(full, () => {})
}
