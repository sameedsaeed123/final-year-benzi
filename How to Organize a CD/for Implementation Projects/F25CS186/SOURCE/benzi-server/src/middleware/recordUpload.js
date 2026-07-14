import multer from 'multer'
import path from 'path'
import fs from 'fs'
import crypto from 'crypto'

const ALLOWED_MIME = [
  'application/pdf',
  'application/msword',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png',
  'image/webp',
]

const MAX_SIZE = 10 * 1024 * 1024 // 10 MB

const recordsDir = path.join(process.cwd(), 'uploads', 'records')
fs.mkdirSync(recordsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, recordsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.pdf'
    const unique = crypto.randomBytes(16).toString('hex')
    cb(null, `${unique}${ext}`)
  },
})

export const recordUploadMiddleware = multer({
  storage,
  limits: { fileSize: MAX_SIZE },
  fileFilter: (_req, file, cb) => {
    if (ALLOWED_MIME.includes(file.mimetype)) {
      cb(null, true)
    } else {
      const err = new Error('Only PDF, Word, JPEG, PNG, and WebP files are allowed')
      err.statusCode = 400
      cb(err, false)
    }
  },
})
