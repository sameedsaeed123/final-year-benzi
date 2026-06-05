import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const chatDir = path.join(__dirname, '../../uploads/chat')

fs.mkdirSync(chatDir, { recursive: true })

const ALLOWED = {
  'image/jpeg': { ext: '.jpg', max: 5 * 1024 * 1024 },
  'image/png': { ext: '.png', max: 5 * 1024 * 1024 },
  'image/webp': { ext: '.webp', max: 5 * 1024 * 1024 },
  'image/gif': { ext: '.gif', max: 5 * 1024 * 1024 },
  'application/pdf': { ext: '.pdf', max: 10 * 1024 * 1024 },
  'video/mp4': { ext: '.mp4', max: 25 * 1024 * 1024 },
  'video/webm': { ext: '.webm', max: 25 * 1024 * 1024 },
  'audio/webm': { ext: '.webm', max: 5 * 1024 * 1024 },
  'audio/mpeg': { ext: '.mp3', max: 5 * 1024 * 1024 },
  'audio/ogg': { ext: '.ogg', max: 5 * 1024 * 1024 },
  'audio/mp4': { ext: '.m4a', max: 5 * 1024 * 1024 },
}

export function attachmentTypeFromMime(mime) {
  if (mime.startsWith('image/')) return 'image'
  if (mime === 'application/pdf') return 'pdf'
  if (mime.startsWith('video/')) return 'video'
  if (mime.startsWith('audio/')) return 'audio'
  return null
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, chatDir),
  filename: (req, file, cb) => {
    const meta = ALLOWED[file.mimetype]
    const ext = meta?.ext || path.extname(file.originalname || '').toLowerCase() || '.bin'
    const safeExt = ext.replace(/[^a-z0-9.]/gi, '')
    cb(null, `chat-${req.user.id}-${Date.now()}${safeExt}`)
  },
})

function fileFilter(_req, file, cb) {
  if (ALLOWED[file.mimetype]) {
    cb(null, true)
  } else {
    cb(new Error('File type not allowed. Use JPG, PNG, PDF, MP4, WebM, or voice audio.'))
  }
}

export const uploadChatAttachmentMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 25 * 1024 * 1024 },
})

export function assertChatFileSize(file) {
  const meta = ALLOWED[file.mimetype]
  if (!meta) {
    const err = new Error('File type not allowed')
    err.statusCode = 400
    throw err
  }
  if (file.size > meta.max) {
    const err = new Error(`File too large (max ${Math.round(meta.max / (1024 * 1024))}MB for this type)`)
    err.statusCode = 400
    throw err
  }
}
