import mongoose from 'mongoose'

/** Monthly AI usage counters per therapist (subscription enforcement). */
const therapistUsageSchema = new mongoose.Schema(
  {
    therapistUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      index: true,
    },
    periodKey: { type: String, required: true },
    aiMessagesUsed: { type: Number, default: 0 },
    aiRecommendationsUsed: { type: Number, default: 0 },
  },
  { timestamps: true }
)

therapistUsageSchema.index({ therapistUserId: 1, periodKey: 1 }, { unique: true })

export const TherapistUsage = mongoose.model('TherapistUsage', therapistUsageSchema)
