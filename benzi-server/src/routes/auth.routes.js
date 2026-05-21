import { Router } from 'express'
import {
  register,
  login,
  me,
  validateToken,
  patchAuthProfile,
  changePassword,
  uploadProfilePhoto,
  enable2FA,
  verify2FAEnable,
  verify2FA,
  send2FACodeFallback,
  disable2FA,
  regenerateBackupCodes,
  forgotPassword,
  resetPassword,
} from '../controllers/authController.js'
import { verifyJWT, optionalVerifyJWT } from '../middleware/verifyJWT.js'
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

// 2FA Routes
router.post('/2fa/enable', verifyJWT, authLimiter, enable2FA)
router.post('/2fa/verify-enable', verifyJWT, authLimiter, verify2FAEnable)
router.post('/2fa/verify', authLimiter, verify2FA)
router.post('/2fa/send-code', optionalVerifyJWT, authLimiter, send2FACodeFallback)
router.post('/2fa/disable', verifyJWT, authLimiter, disable2FA)
router.post('/2fa/backup-codes', verifyJWT, authLimiter, regenerateBackupCodes)

// Password Reset Routes
router.post('/forgot-password', authLimiter, forgotPassword)
router.post('/reset-password', authLimiter, resetPassword)

export default router
