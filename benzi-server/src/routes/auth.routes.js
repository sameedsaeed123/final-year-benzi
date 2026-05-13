import { Router } from 'express'
import {
  register,
  login,
  me,
  validateToken,
  patchAuthProfile,
  changePassword,
  uploadProfilePhoto,
} from '../controllers/authController.js'
import { verifyJWT } from '../middleware/verifyJWT.js'
import { authLimiter } from '../middleware/rateLimiters.js'
import { uploadProfilePhotoMiddleware } from '../middleware/profileUpload.js'

const router = Router()

router.post('/register', authLimiter, register)
router.post('/login', authLimiter, login)
router.get('/me', verifyJWT, me)
router.patch('/profile', verifyJWT, authLimiter, patchAuthProfile)
router.post('/change-password', verifyJWT, authLimiter, changePassword)
router.post(
  '/profile-photo',
  verifyJWT,
  authLimiter,
  (req, res, next) => {
    uploadProfilePhotoMiddleware.single('photo')(req, res, (err) => {
      if (err) {
        err.statusCode = 400
        return next(err)
      }
      next()
    })
  },
  uploadProfilePhoto
)
router.post('/validate', verifyJWT, validateToken)

export default router
