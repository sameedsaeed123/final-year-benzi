import mongoose from 'mongoose'

const therapistLinkSchema = new mongoose.Schema(
  {
    therapistUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    linkedAt: { type: Date, default: Date.now },
    unlinkedAt: { type: Date, default: null },
  },
  { _id: true }
)

const patientSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    totalPoints: { type: Number, default: 0 },
    /** Primary therapist — first active link (goals, AI limits default) */
    assignedTherapistUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignedAt: { type: Date, default: null },
    /** Active / historical therapist relationships */
    therapistLinks: { type: [therapistLinkSchema], default: [] },
    anonymousModeEnabled: { type: Boolean, default: false },
    anonymousAlias: { type: String, default: '' },
    reminderPreferences: {
      email24h: { type: Boolean, default: true },
      email10h: { type: Boolean, default: true },
      email5h: { type: Boolean, default: true },
      email3h: { type: Boolean, default: true },
      email2h: { type: Boolean, default: true },
      email1h: { type: Boolean, default: true },
      masterEnabled: { type: Boolean, default: true },
    },
    timezone: { type: String, default: 'UTC', trim: true },
  },
  { timestamps: true }
)

export const Patient = mongoose.model('Patient', patientSchema)
