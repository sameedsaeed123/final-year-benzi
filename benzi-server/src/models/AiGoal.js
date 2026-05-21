import mongoose from 'mongoose'

const aiGoalSchema = new mongoose.Schema(
  {
    patientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    therapistUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    title: { type: String, required: true },
    description: { type: String, default: '' },
    priority: { type: String, enum: ['high', 'medium', 'low'], default: 'medium' },
    status: { type: String, enum: ['pending', 'in-progress', 'completed'], default: 'pending' },
    aiRecommended: { type: Boolean, default: false },
    /** therapist = assigned by clinician | patient = submitted by patient for therapist review */
    submittedBy: { type: String, enum: ['therapist', 'patient'], default: 'therapist' },
  },
  { timestamps: true }
)

aiGoalSchema.index({ patientUserId: 1, createdAt: -1 })

export const AiGoal = mongoose.model('AiGoal', aiGoalSchema)
