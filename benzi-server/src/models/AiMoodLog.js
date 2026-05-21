import mongoose from 'mongoose'

const aiMoodLogSchema = new mongoose.Schema(
  {
    patientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    date: { type: Date, required: true },
    averageSentiment: { type: Number, default: 0 },
    messageCount: { type: Number, default: 0 },
    dominantLabel: { type: String, default: 'neutral' },
  },
  { timestamps: true }
)

aiMoodLogSchema.index({ patientUserId: 1, date: 1 }, { unique: true })

export const AiMoodLog = mongoose.model('AiMoodLog', aiMoodLogSchema)
