import mongoose from 'mongoose'

const serviceSchema = new mongoose.Schema(
  {
    therapistUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    name: { type: String, required: true, trim: true },
    type: { type: String, default: 'Individual Therapy' },
    description: { type: String, default: '' },
    durationMinutes: { type: Number, default: 60 },
    pricePerSession: { type: Number, default: 0 },
    isActive: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const Service = mongoose.model('Service', serviceSchema)
