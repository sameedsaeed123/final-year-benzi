import mongoose from 'mongoose'

const patientSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    totalPoints: { type: Number, default: 0 },
    assignedTherapistUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignedAt: { type: Date, default: null },
    // Anonymous mode — when true, therapist sees "Anonymous Patient" instead of real name/contact
    anonymousModeEnabled: { type: Boolean, default: false },
    anonymousAlias: { type: String, default: '' }, // e.g. "Patient #A7F2"
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
