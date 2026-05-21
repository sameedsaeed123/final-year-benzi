import mongoose from 'mongoose'

const ROLES = ['patient', 'therapist', 'admin']
const STATUSES = ['PENDING_VERIFICATION', 'VERIFIED', 'SUSPENDED']

const userSchema = new mongoose.Schema(
  {
    email: { type: String, required: true, unique: true, trim: true, lowercase: true },
    passwordHash: { type: String, required: true, select: false },
    role: { type: String, enum: ROLES, required: true },
    firstName: { type: String, required: true, trim: true },
    lastName: { type: String, required: true, trim: true },
    phone: { type: String, trim: true, default: '' },
    profileImageUrl: { type: String, default: '', trim: true },
    status: { type: String, enum: STATUSES, default: 'VERIFIED' },
    twoFactorEnabled: { type: Boolean, default: false },
    isTemporaryPassword: { type: Boolean, default: false },
    lastLoginAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export const User = mongoose.model('User', userSchema)
export { ROLES }
