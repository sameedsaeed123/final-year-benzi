import Joi from 'joi'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { env } from '../config/environment.js'
import {
  registerUser,
  loginUser,
  issueAccessToken,
  toPublicUser,
  changeUserPassword,
  updateUserProfile,
  setUserProfileImageUrl,
} from '../services/authService.js'
import { sendSuccess, sendError } from '../utils/responseUtils.js'
import { ensureProfilesAfterAuth } from '../services/profileService.js'
import { User } from '../models/User.js'
import { TwoFactorAuth } from '../models/TwoFactorAuth.js'
import emailService from '../services/emailService.js'
import twoFactorService from '../services/twoFactorService.js'
import passwordResetService from '../services/passwordResetService.js'

const passwordRule = Joi.string()
  .min(8)
  .max(128)
  .pattern(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).+$/)
  .message(
    'Password must be 8+ characters and include uppercase, lowercase, number, and special character'
  )

/** Allow internal / dev TLDs like `.local` used by seed accounts. */
const emailSchema = Joi.string()
  .trim()
  .lowercase()
  .email({ tlds: { allow: false } })
  .max(320)
  .required()

const registerSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).required(),
  lastName: Joi.string().trim().min(2).max(50).required(),
  email: emailSchema,
  phone: Joi.string().trim().max(20).allow('').optional(),
  password: passwordRule.required(),
  confirmPassword: Joi.valid(Joi.ref('password')).required().messages({ 'any.only': 'Passwords must match' }),
  role: Joi.string().valid('patient', 'therapist').required(),
})

const loginSchema = Joi.object({
  email: emailSchema,
  password: Joi.string().required(),
  remember: Joi.boolean().optional(),
  expectedPortal: Joi.string().valid('patient', 'therapist', 'admin').required(),
  iv: Joi.string().hex().length(32).optional(),
  isEncrypted: Joi.boolean().optional(),
})

const changePasswordSchema = Joi.object({
  oldPassword: Joi.string().required(),
  newPassword: passwordRule.required(),
  confirmPassword: Joi.valid(Joi.ref('newPassword')).required().messages({ 'any.only': 'Passwords must match' }),
})

const authProfilePatchSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).optional(),
  lastName: Joi.string().trim().min(2).max(50).optional(),
  phone: Joi.string().trim().max(30).allow('').optional(),
}).min(1)

export async function patchAuthProfile(req, res, next) {
  try {
    const { error, value } = authProfilePatchSchema.validate(req.body, { abortEarly: false, stripUnknown: true })
    if (error) {
      return sendError(res, 'Validation failed', 400, error.details.map((d) => ({ field: d.path.join('.'), message: d.message })))
    }
    const user = await updateUserProfile(req.user.id, value)
    return sendSuccess(res, { user: toPublicUser(user) }, 'Updated', 200)
  } catch (e) {
    next(e)
  }
}

export async function changePassword(req, res, next) {
  try {
    const { error, value } = changePasswordSchema.validate(req.body, { abortEarly: false, stripUnknown: true })
    if (error) {
      return sendError(res, 'Validation failed', 400, error.details.map((d) => ({ field: d.path.join('.'), message: d.message })))
    }
    await changeUserPassword(req.user.id, value.oldPassword, value.newPassword)
    return sendSuccess(res, { ok: true }, 'Password updated', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function uploadProfilePhoto(req, res, next) {
  try {
    if (!req.file) {
      return sendError(res, 'No image file uploaded. Use form field name "photo".', 400)
    }
    const publicPath = `/api/files/profiles/${req.file.filename}`
    await setUserProfileImageUrl(req.user.id, publicPath)
    const user = await User.findById(req.user.id)
    return sendSuccess(res, { profileImageUrl: publicPath, user: toPublicUser(user) }, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function register(req, res, next) {
  try {
    const { error, value } = registerSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return sendError(res, 'Validation failed', 400, error.details.map((d) => ({ field: d.path.join('.'), message: d.message })))
    }
    const user = await registerUser(value)
    const accessToken = issueAccessToken(user, false)
    return sendSuccess(
      res,
      { accessToken, user: toPublicUser(user) },
      'Registration successful',
      201
    )
  } catch (e) {
    if (e.code === 11000) {
      return sendError(res, 'An account with this email already exists', 409)
    }
    next(e)
  }
}

export async function login(req, res, next) {
  try {
    const { error, value } = loginSchema.validate(req.body, { abortEarly: false })
    if (error) {
      return sendError(res, 'Validation failed', 400, error.details.map((d) => ({ field: d.path.join('.'), message: d.message })))
    }

    let decryptedPassword = value.password
    if (value.expectedPortal === 'admin' && value.isEncrypted && value.iv) {
      try {
        const secretKey = env.ADMIN_AES_KEY
        const iv = Buffer.from(value.iv, 'hex')
        const decipher = crypto.createDecipheriv('aes-256-cbc', Buffer.from(secretKey), iv)
        let decrypted = decipher.update(value.password, 'base64', 'utf8')
        decrypted += decipher.final('utf8')
        decryptedPassword = decrypted
      } catch (decryptErr) {
        console.error('Admin password decryption failed:', decryptErr)
        return sendError(res, 'Invalid encrypted payload', 400)
      }
    }

    const user = await loginUser(value.email, decryptedPassword)
    user.lastLoginAt = new Date()
    await user.save()
    await ensureProfilesAfterAuth(user)

    const ep = value.expectedPortal
    if (ep === 'patient' && user.role !== 'patient') {
      return sendError(
        res,
        user.role === 'therapist'
          ? 'This account is registered as a therapist. Use the Therapist login tab.'
          : 'This account is not a patient login.',
        403
      )
    }
    if (ep === 'therapist' && user.role !== 'therapist') {
      return sendError(
        res,
        user.role === 'patient'
          ? 'This account is registered as a patient. Use the Patient login tab.'
          : 'This account is not a therapist login.',
        403
      )
    }
    if (ep === 'admin' && user.role !== 'admin') {
      return sendError(res, 'This email is not registered as an administrator.', 403)
    }

    // Check if 2FA is enabled
    if (user.twoFactorEnabled) {
      const tempToken = jwt.sign(
        { sub: user._id.toString(), temp2FA: true },
        env.JWT_SECRET,
        { expiresIn: '5m' }
      )
      return sendSuccess(res, {
        requires2FA: true,
        tempToken,
        user: toPublicUser(user),
      }, '2FA verification code required', 200)
    }

    const accessToken = issueAccessToken(user, Boolean(value.remember))
    return sendSuccess(res, {
      accessToken,
      user: toPublicUser(user),
      isTemporaryPassword: user.isTemporaryPassword
    }, 'Login successful', 200)
  } catch (e) {
    next(e)
  }
}

export async function me(req, res) {
  const user = await User.findById(req.user.id)
  if (!user) {
    return sendError(res, 'User not found', 404)
  }
  user.lastLoginAt = new Date()
  await user.save()
  return sendSuccess(res, { user: toPublicUser(user) }, 'OK', 200)
}

export async function validateToken(req, res) {
  return sendSuccess(res, { valid: true, user: req.user }, 'Token valid', 200)
}

// ==========================================
// 2FA & Password Reset Controller Methods
// ==========================================

export async function enable2FA(req, res, next) {
  try {
    const user = await User.findById(req.user.id)
    if (!user) return sendError(res, 'User not found', 404)

    // Generate TOTP secret
    const { secret, qrCodeDataUrl } = await twoFactorService.generateTOTPSecret(user)
    const encryptedSecret = twoFactorService.encryptSecret(secret)

    // Generate backup codes
    const { plaintextBackupCodes, hashedBackupCodes } = await twoFactorService.generateBackupCodes()

    // Save to TwoFactorAuth model
    await TwoFactorAuth.findOneAndUpdate(
      { userId: user._id },
      {
        $set: {
          secret: encryptedSecret,
          backupCodes: hashedBackupCodes,
          enabled: false // Not enabled yet until verified
        }
      },
      { upsert: true }
    )

    return sendSuccess(res, {
      secret,
      qrCodeDataUrl,
      backupCodes: plaintextBackupCodes
    }, '2FA setup initiated. Verify the code to complete activation.', 200)
  } catch (e) {
    next(e)
  }
}

export async function verify2FAEnable(req, res, next) {
  try {
    const { token } = req.body
    if (!token) return sendError(res, 'Verification token is required', 400)

    const twoFA = await TwoFactorAuth.findOne({ userId: req.user.id })
    if (!twoFA) return sendError(res, '2FA setup has not been initiated', 400)

    // Try verifying email code first, then TOTP token
    let isValid = await twoFactorService.verifyEmailCode(req.user.id, token)

    if (!isValid && twoFA.secret) {
      const secret = twoFactorService.decryptSecret(twoFA.secret)
      isValid = twoFactorService.verifyTOTP(secret, token)
    }

    if (!isValid) {
      return sendError(res, 'Invalid verification code. Please try again.', 400)
    }

    twoFA.enabled = true
    await twoFA.save()

    await User.findByIdAndUpdate(req.user.id, { twoFactorEnabled: true })

    return sendSuccess(res, { enabled: true }, 'Two-factor authentication has been enabled successfully.', 200)
  } catch (e) {
    next(e)
  }
}

export async function verify2FA(req, res, next) {
  try {
    const { tempToken, token, method = 'totp' } = req.body
    if (!token) return sendError(res, '2FA token/code is required', 400)

    let userId = null

    if (tempToken) {
      try {
        const decoded = jwt.verify(tempToken, env.JWT_SECRET)
        if (!decoded.temp2FA) {
          return sendError(res, 'Invalid temporary token', 401)
        }
        userId = decoded.sub
      } catch (err) {
        return sendError(res, 'Temporary token has expired or is invalid', 401)
      }
    } else {
      userId = req.user?.id
    }

    if (!userId) {
      return sendError(res, 'Authentication or temporary token is required', 401)
    }

    const twoFA = await TwoFactorAuth.findOne({ userId })
    if (!twoFA || !twoFA.enabled) {
      return sendError(res, '2FA is not enabled for this account', 400)
    }

    // Check lockout
    if (twoFA.lockoutUntil && twoFA.lockoutUntil > new Date()) {
      return sendError(res, `Too many failed attempts. Locked out until ${twoFA.lockoutUntil.toISOString()}`, 429)
    }

    let isValid = false

    if (method === 'totp') {
      const secret = twoFactorService.decryptSecret(twoFA.secret)
      isValid = twoFactorService.verifyTOTP(secret, token)
      
      // Increment failed attempts if invalid
      if (!isValid) {
        twoFA.failedAttempts += 1
        twoFA.lastFailedAt = new Date()
        if (twoFA.failedAttempts >= 5) {
          twoFA.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000)
        }
        await twoFA.save()
      } else {
        // Reset counters
        twoFA.failedAttempts = 0
        twoFA.lockoutUntil = null
        await twoFA.save()
      }
    } else if (method === 'backup') {
      isValid = await twoFactorService.verifyBackupCode(userId, token)
    } else if (method === 'email') {
      isValid = await twoFactorService.verifyEmailCode(userId, token)
    } else {
      return sendError(res, 'Invalid 2FA method specified', 400)
    }

    if (!isValid) {
      return sendError(res, 'Invalid 2FA verification code', 401)
    }

    const user = await User.findById(userId)
    user.lastLoginAt = new Date()
    await user.save()

    const accessToken = issueAccessToken(user, false)
    return sendSuccess(res, { accessToken, user: toPublicUser(user), isTemporaryPassword: user.isTemporaryPassword }, '2FA verification successful', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function send2FACodeFallback(req, res, next) {
  try {
    const { tempToken } = req.body
    let userId = null

    if (tempToken) {
      try {
        const decoded = jwt.verify(tempToken, env.JWT_SECRET)
        userId = decoded.sub
      } catch (err) {
        return sendError(res, 'Temporary token has expired or is invalid', 401)
      }
    } else {
      userId = req.user?.id
    }

    if (!userId) {
      return sendError(res, 'Authentication or temporary token is required', 401)
    }

    const user = await User.findById(userId)
    if (!user) return sendError(res, 'User not found', 404)

    const code = await twoFactorService.generateEmailCode(userId)
    await emailService.send2FACode(user.email, `${user.firstName} ${user.lastName}`, code)

    return sendSuccess(res, { sent: true }, 'Verification code sent to your email.', 200)
  } catch (e) {
    next(e)
  }
}

export async function disable2FA(req, res, next) {
  try {
    const { password } = req.body
    if (!password) return sendError(res, 'Password is required to disable 2FA', 400)

    const user = await User.findById(req.user.id).select('+passwordHash')
    if (!user) return sendError(res, 'User not found', 404)

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) return sendError(res, 'Incorrect password', 401)

    await TwoFactorAuth.deleteOne({ userId: req.user.id })
    await User.findByIdAndUpdate(req.user.id, { twoFactorEnabled: false })

    return sendSuccess(res, { disabled: true }, 'Two-factor authentication has been disabled.', 200)
  } catch (e) {
    next(e)
  }
}

export async function regenerateBackupCodes(req, res, next) {
  try {
    const { password } = req.body
    if (!password) return sendError(res, 'Password is required to regenerate backup codes', 400)

    const user = await User.findById(req.user.id).select('+passwordHash')
    if (!user) return sendError(res, 'User not found', 404)

    const isMatch = await bcrypt.compare(password, user.passwordHash)
    if (!isMatch) return sendError(res, 'Incorrect password', 401)

    const { plaintextBackupCodes, hashedBackupCodes } = await twoFactorService.generateBackupCodes()

    await TwoFactorAuth.findOneAndUpdate(
      { userId: req.user.id },
      { $set: { backupCodes: hashedBackupCodes } }
    )

    return sendSuccess(res, { backupCodes: plaintextBackupCodes }, 'New backup codes generated.', 200)
  } catch (e) {
    next(e)
  }
}

export async function forgotPassword(req, res, next) {
  try {
    const { email } = req.body
    if (!email) return sendError(res, 'Email address is required', 400)

    // Enforce hourly rate limit
    await passwordResetService.enforcePasswordResetRateLimit(email)

    const user = await User.findOne({ email: email.toLowerCase().trim() })
    if (user) {
      const token = await passwordResetService.createResetToken(user._id)
      const resetUrl = `${env.FRONTEND_URL}/reset-password?token=${token}`
      
      // Fire email asynchronously in background
      await emailService.sendPasswordResetEmail(
        user.email,
        `${user.firstName} ${user.lastName}`,
        resetUrl,
        1
      )
    }

    // Return identical message regardless of whether user exists
    return sendSuccess(res, { ok: true }, 'If an account exists with this email, a reset link has been sent.', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function resetPassword(req, res, next) {
  try {
    const { token, password, confirmPassword } = req.body
    if (!token || !password) {
      return sendError(res, 'Token and new password are required', 400)
    }

    if (password !== confirmPassword) {
      return sendError(res, 'Passwords do not match', 400)
    }

    // Verify strength roughly (can use pattern from registration Joi schema)
    const strengthRegex = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[!@#$%^&*()_+\-=[\]{};':"\\|,.<>/?]).{8,}$/
    if (!strengthRegex.test(password)) {
      return sendError(res, 'Password must be 8+ characters and include uppercase, lowercase, number, and special character', 400)
    }

    // Verify & Consume token
    const tokenDoc = await passwordResetService.consumeResetToken(token)

    // Hash and update password
    const passwordHash = await bcrypt.hash(password, 12)
    await User.findByIdAndUpdate(tokenDoc.userId, {
      passwordHash,
      isTemporaryPassword: false, // If they change/reset password, clear temp flag
    })

    return sendSuccess(res, { ok: true }, 'Your password has been reset successfully.', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}
