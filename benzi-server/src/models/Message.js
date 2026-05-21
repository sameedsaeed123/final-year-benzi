import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    // Conversation is always between a therapist and a patient
    therapistUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientUserId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderUserId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole:      { type: String, enum: ['therapist', 'patient'], required: true },
    text:            { type: String, required: true, maxlength: 4000 },
    readAt:          { type: Date, default: null },
    deletedAt:       { type: Date, default: null },
  },
  { timestamps: true }
)

// Compound index for fast conversation queries
messageSchema.index({ therapistUserId: 1, patientUserId: 1, createdAt: -1 })

export const Message = mongoose.model('Message', messageSchema)
