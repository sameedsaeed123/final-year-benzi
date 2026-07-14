import mongoose from 'mongoose'

const passwordResetTokenSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    tokenHash: { type: String, required: true, unique: true }, // SHA-256 hash of plaintext token
    expiresAt: { type: Date, required: true },
    used: { type: Boolean, default: false },
  },
  { timestamps: true }
)

// Index for expiry and lookup performance
passwordResetTokenSchema.index({ expiresAt: 1 })

export const PasswordResetToken = mongoose.model('PasswordResetToken', passwordResetTokenSchema)
