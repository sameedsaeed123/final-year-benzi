import mongoose from 'mongoose'

const messageSchema = new mongoose.Schema(
  {
    // Conversation is always between a therapist and a patient
    therapistUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    patientUserId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    senderUserId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    senderRole:      { type: String, enum: ['therapist', 'patient'], required: true },
    text:            { type: String, default: '', maxlength: 4000 },
    listPreview:     { type: String, default: '', maxlength: 4000 },
    attachment: {
      type:     { type: String, enum: ['image', 'pdf', 'video', 'audio', null], default: null },
      url:      { type: String, default: '' },
      name:     { type: String, default: '' },
      mimeType: { type: String, default: '' },
      size:     { type: Number, default: 0 },
    },
    readAt:          { type: Date, default: null },
    editedAt:        { type: Date, default: null },
    deletedAt:       { type: Date, default: null },
    reactions: [{
      emoji:    { type: String, required: true, maxlength: 8 },
      userId:   { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
      role:     { type: String, enum: ['therapist', 'patient'], required: true },
    }],
  },
  { timestamps: true }
)

// Compound index for fast conversation queries
messageSchema.index({ therapistUserId: 1, patientUserId: 1, createdAt: -1 })

export const Message = mongoose.model('Message', messageSchema)
