import multer from 'multer'
import path from 'path'
import fs from 'fs'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const docsDir = path.join(__dirname, '../../uploads/documents')

fs.mkdirSync(docsDir, { recursive: true })

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, docsDir),
  filename: (req, file, cb) => {
    const ext = path.extname(file.originalname || '').toLowerCase()
    const allowed = ['.jpg', '.jpeg', '.png', '.pdf']
    const safe = allowed.includes(ext) ? ext : '.jpg'
    cb(null, `doc-${req.user.id}-${file.fieldname}-${Date.now()}${safe}`)
  },
})

function fileFilter(_req, file, cb) {
  if (/^(image\/(jpeg|png))|application\/pdf$/i.test(file.mimetype)) {
    cb(null, true)
  } else {
    cb(new Error('Only JPEG, PNG images or PDF documents are allowed'))
  }
}

export const uploadVerificationDocsMiddleware = multer({
  storage,
  fileFilter,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5 MB limit
})
