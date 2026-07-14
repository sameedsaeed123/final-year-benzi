import speakeasy from 'speakeasy'
import qrcode from 'qrcode'
import crypto from 'crypto'
import bcrypt from 'bcryptjs'
import { TwoFactorAuth } from '../models/TwoFactorAuth.js'
import { env } from '../config/environment.js'

// Derive a secure 32-byte key for AES-256-CBC encryption
const getEncryptionKey = () => {
  const key = process.env.TWO_FACTOR_ENCRYPTION_KEY || env.JWT_SECRET
  return crypto.createHash('sha256').update(key).digest()
}

/**
 * Encrypt TOTP Secret using AES-256-CBC
 */
export function encryptSecret(text) {
  const iv = crypto.randomBytes(16)
  const cipher = crypto.createCipheriv('aes-256-cbc', getEncryptionKey(), iv)
  let encrypted = cipher.update(text, 'utf8', 'hex')
  encrypted += cipher.final('hex')
  return `${iv.toString('hex')}:${encrypted}`
}

/**
 * Decrypt TOTP Secret using AES-256-CBC
 */
export function decryptSecret(encryptedSecret) {
  const [ivHex, encryptedHex] = encryptedSecret.split(':')
  if (!ivHex || !encryptedHex) throw new Error('Invalid encrypted secret format')
  const iv = Buffer.from(ivHex, 'hex')
  const decipher = crypto.createDecipheriv('aes-256-cbc', getEncryptionKey(), iv)
  let decrypted = decipher.update(encryptedHex, 'hex', 'utf8')
  decrypted += decipher.final('utf8')
  return decrypted
}

/**
 * Generate a new TOTP secret and corresponding QR code
 * 
 * @param {Object} user - User document
 * @returns {Promise<Object>} { secret, qrCodeDataUrl }
 */
export async function generateTOTPSecret(user) {
  const secret = speakeasy.generateSecret({
    length: 20,
    name: `BENZI (${user.email})`,
    issuer: 'BENZI',
  })

  // Generate QR code data URI
  const qrCodeDataUrl = await qrcode.toDataURL(secret.otpauth_url)

  return {
    secret: secret.base32,
    qrCodeDataUrl,
  }
}

/**
 * Generate 10 secure, unique backup codes
 * 
 * @returns {Promise<Object>} { plaintextCodes, hashedCodes }
 */
export async function generateBackupCodes() {
  const plaintextCodes = []
  const hashedCodes = []

  for (let i = 0; i < 10; i++) {
    // Generate an 8-character random alphanumeric code
    const code = crypto.randomBytes(4).toString('hex').toUpperCase()
    plaintextCodes.push(code)
    const hashed = await bcrypt.hash(code, 12)
    hashedCodes.push(hashed)
  }

  return {
    plaintextCodes,
    hashedCodes,
  }
}

/**
 * Verify a TOTP token against a user's base32 secret
 */
export function verifyTOTP(secretBase32, token) {
  return speakeasy.totp.verify({
    secret: secretBase32,
    encoding: 'base32',
    token,
    window: 2, // Allow a window of 2 steps (±30 seconds)
  })
}

/**
 * Verify and consume a backup code for a user
 */
export async function verifyBackupCode(userId, code) {
  const normalizedCode = String(code).trim().toUpperCase()
  const twoFa = await TwoFactorAuth.findOne({ userId })
  if (!twoFa || !twoFa.enabled || !twoFa.backupCodes.length) {
    return false
  }

  // Check lockout status
  if (twoFa.lockoutUntil && twoFa.lockoutUntil > new Date()) {
    const err = new Error(`Too many failed attempts. Locked out until ${twoFa.lockoutUntil.toISOString()}`)
    err.statusCode = 429
    throw err
  }

  // Iterate and compare bcrypt hashes
  for (let i = 0; i < twoFa.backupCodes.length; i++) {
    const match = await bcrypt.compare(normalizedCode, twoFa.backupCodes[i])
    if (match) {
      // Consume the backup code (remove it from array)
      twoFa.backupCodes.splice(i, 1)
      twoFa.failedAttempts = 0
      twoFa.lastFailedAt = null
      twoFa.lockoutUntil = null
      await twoFa.save()
      return true
    }
  }

  // Increment failed attempts
  await handleVerificationFailure(twoFa)
  return false
}

/**
 * Generate a 6-digit fallback email code
 */
export async function generateEmailCode(userId) {
  // Generate cryptographically secure random 6-digit code
  const code = Math.floor(100000 + crypto.randomInt(900000)).toString()
  const codeHash = crypto.createHash('sha256').update(code).digest('hex')
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000) // 10 minutes

  await TwoFactorAuth.findOneAndUpdate(
    { userId },
    {
      $set: {
        emailCodeHash: codeHash,
        emailCodeExpiresAt: expiresAt,
      },
    },
    { upsert: true }
  )

  return code
}

/**
 * Verify fallback email 2FA code
 */
export async function verifyEmailCode(userId, code) {
  const normalizedCode = String(code).trim()
  const twoFa = await TwoFactorAuth.findOne({ userId })
  if (!twoFa || !twoFa.emailCodeHash || !twoFa.emailCodeExpiresAt) {
    return false
  }

  // Check lockout status
  if (twoFa.lockoutUntil && twoFa.lockoutUntil > new Date()) {
    const err = new Error(`Too many failed attempts. Locked out until ${twoFa.lockoutUntil.toISOString()}`)
    err.statusCode = 429
    throw err
  }

  // Check expiration
  if (twoFa.emailCodeExpiresAt < new Date()) {
    return false
  }

  const hash = crypto.createHash('sha256').update(normalizedCode).digest('hex')
  if (hash === twoFa.emailCodeHash) {
    // Reset code and failed attempts on success
    twoFa.emailCodeHash = null
    twoFa.emailCodeExpiresAt = null
    twoFa.failedAttempts = 0
    twoFa.lastFailedAt = null
    twoFa.lockoutUntil = null
    await twoFa.save()
    return true
  }

  // Increment failed attempts
  await handleVerificationFailure(twoFa)
  return false
}

/**
 * Internal helper to handle verification failure & lockout
 */
async function handleVerificationFailure(twoFa) {
  twoFa.failedAttempts += 1
  twoFa.lastFailedAt = new Date()

  // 5 failed attempts locks out for 15 minutes
  if (twoFa.failedAttempts >= 5) {
    twoFa.lockoutUntil = new Date(Date.now() + 15 * 60 * 1000)
    console.warn(`[2FAService] User ${twoFa.userId} has been locked out due to failed 2FA attempts until ${twoFa.lockoutUntil.toISOString()}`)
  }

  await twoFa.save()
}

export default {
  encryptSecret,
  decryptSecret,
  generateTOTPSecret,
  generateBackupCodes,
  verifyTOTP,
  verifyBackupCode,
  generateEmailCode,
  verifyEmailCode,
}
