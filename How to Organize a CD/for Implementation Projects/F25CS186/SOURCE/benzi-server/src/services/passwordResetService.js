import crypto from 'crypto'
import { PasswordResetToken } from '../models/PasswordResetToken.js'
import { User } from '../models/User.js'
import { rateLimits, tokenExpiry } from '../config/email.js'

/**
 * Enforce rate limits on password reset requests per email
 * Max 3 requests per hour
 * 
 * @param {string} email - Normalized email address
 * @throws {Error} If rate limit is exceeded
 */
export async function enforcePasswordResetRateLimit(email) {
  if (process.env.NODE_ENV === 'development') {
    return // Skip rate limiting in development mode for easy testing
  }

  const user = await User.findOne({ email: email.toLowerCase().trim() })
  if (!user) return // If user doesn't exist, skip DB rate checking (prevent email enumeration)

  const oneHourAgo = new Date(Date.now() - rateLimits.passwordReset.windowMs)
  const recentRequestsCount = await PasswordResetToken.countDocuments({
    userId: user._id,
    createdAt: { $gte: oneHourAgo },
  })

  if (recentRequestsCount >= rateLimits.passwordReset.maxRequests) {
    const error = new Error('Too many password reset requests. Please try again after an hour.')
    error.statusCode = 429
    throw error
  }
}

/**
 * Create a secure, single-use password reset token for a user
 * Invalidates any prior active tokens
 * 
 * @param {string} userId - User Object ID
 * @returns {Promise<string>} Plaintext token
 */
export async function createResetToken(userId) {
  // Invalidate any older active tokens for this user
  await PasswordResetToken.updateMany(
    { userId, used: false, expiresAt: { $gt: new Date() } },
    { $set: { used: true } }
  )

  // Generate cryptographically secure random 6-digit numeric token/code (OTP)
  const plaintextToken = Math.floor(100000 + crypto.randomInt(900000)).toString()
  const tokenHash = crypto.createHash('sha256').update(plaintextToken).digest('hex')
  const expiresAt = new Date(Date.now() + tokenExpiry.passwordReset) // 1 hour

  const resetToken = new PasswordResetToken({
    userId,
    tokenHash,
    expiresAt,
  })
  await resetToken.save()

  return plaintextToken
}

/**
 * Verify a plaintext password reset token
 * 
 * @param {string} plaintextToken - Plaintext reset token
 * @returns {Promise<Object|null>} Token document if valid, else null
 */
export async function verifyResetToken(plaintextToken) {
  if (!plaintextToken || typeof plaintextToken !== 'string') return null

  const tokenHash = crypto.createHash('sha256').update(plaintextToken).digest('hex')
  const tokenDoc = await PasswordResetToken.findOne({ tokenHash })

  if (!tokenDoc) return null

  // Check if used or expired
  if (tokenDoc.used || tokenDoc.expiresAt < new Date()) {
    return null
  }

  return tokenDoc
}

/**
 * Mark a password reset token as consumed (used)
 * 
 * @param {string} plaintextToken - Plaintext reset token
 * @returns {Promise<Object>} The consumed token document
 */
export async function consumeResetToken(plaintextToken) {
  const tokenDoc = await verifyResetToken(plaintextToken)
  if (!tokenDoc) {
    const err = new Error('Password reset token is invalid or has expired')
    err.statusCode = 400
    throw err
  }

  tokenDoc.used = true
  await tokenDoc.save()
  return tokenDoc
}

export default {
  enforcePasswordResetRateLimit,
  createResetToken,
  verifyResetToken,
  consumeResetToken,
}
