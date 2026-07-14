import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const profilesDir = path.join(__dirname, '../../uploads/profiles')

fs.mkdirSync(profilesDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, profilesDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    const allowed = ['.jpg', '.jpeg', '.png', '.webp', '.gif']
    const safe = allowed.includes(ext) ? ext : '.jpg'
    cb(null, `profile-${req.user.id}-${Date.now()}${safe}`)
  },
})

function fileFilter(_req, file, cb) {
  if (/^image\/(jpeg|png|gif|webp)$/i.test(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPEG, PNG, GIF, or WebP images are allowed'))
  }
}

export const uploadProfilePhotoMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 3 * 1024 * 1024 },
})
