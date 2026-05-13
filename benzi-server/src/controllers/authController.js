import Joi from 'joi'
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
  /** Must match the portal the user chose so therapists cannot sign in as patients. */
  expectedPortal: Joi.string().valid('patient', 'therapist', 'admin').required(),
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
    const user = await loginUser(value.email, value.password)
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

    const accessToken = issueAccessToken(user, Boolean(value.remember))
    return sendSuccess(res, { accessToken, user: toPublicUser(user) }, 'Login successful', 200)
  } catch (e) {
    next(e)
  }
}

export async function me(req, res) {
  const user = await User.findById(req.user.id).select('email role firstName lastName phone status profileImageUrl')
  if (!user) {
    return sendError(res, 'User not found', 404)
  }
  return sendSuccess(res, { user: toPublicUser(user) }, 'OK', 200)
}

export async function validateToken(req, res) {
  return sendSuccess(res, { valid: true, user: req.user }, 'Token valid', 200)
}
