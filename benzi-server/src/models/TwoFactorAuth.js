import mongoose from 'mongoose'

const twoFactorAuthSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    secret: { type: String, default: null }, // AES-256-CBC encrypted
    enabled: { type: Boolean, default: false },
    backupCodes: { type: [String], default: [] }, // Array of bcrypt-hashed strings
    emailCodeHash: { type: String, default: null }, // SHA-256 hashed code
    emailCodeExpiresAt: { type: Date, default: null },
    failedAttempts: { type: Number, default: 0 },
    lastFailedAt: { type: Date, default: null },
    lockoutUntil: { type: Date, default: null },
  },
  { timestamps: true }
)

export const TwoFactorAuth = mongoose.model('TwoFactorAuth', twoFactorAuthSchema)
