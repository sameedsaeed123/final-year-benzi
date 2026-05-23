import mongoose from 'mongoose'

const aiMessageSchema = new mongoose.Schema(
  {
    patientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    sender: { type: String, enum: ['patient', 'ai'], required: true },
    text: { type: String, required: true, maxlength: 4000 },
    sentimentScore: { type: Number, default: 0 },
    sentimentLabel: { type: String, default: 'neutral' },
    crisisFlag: { type: String, enum: ['high', 'medium'], default: null },
  },
  { timestamps: true }
)

aiMessageSchema.index({ patientUserId: 1, createdAt: -1 })

export const AiMessage = mongoose.model('AiMessage', aiMessageSchema)
