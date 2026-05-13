import mongoose from 'mongoose'

const patientSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    totalPoints: { type: Number, default: 0 },
    assignedTherapistUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', default: null },
    assignedAt: { type: Date, default: null },
  },
  { timestamps: true }
)

export const Patient = mongoose.model('Patient', patientSchema)
