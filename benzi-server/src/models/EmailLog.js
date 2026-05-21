import mongoose from 'mongoose'

const emailLogSchema = new mongoose.Schema(
  {
    recipient: { type: String, required: true, trim: true },
    subject: { type: String, required: true },
    template: { type: String, required: true },
    status: {
      type: String,
      enum: ['queued', 'sent', 'delivered', 'bounced', 'failed'],
      default: 'queued',
    },
    attempts: { type: Number, default: 0 },
    maxAttempts: { type: Number, default: 3 },
    error: { type: String, default: null },
    category: {
      type: String,
      enum: ['auth', 'reminder', 'verification', 'invitation', 'support', 'test', 'transactional', 'informational', 'bulk'],
      required: true,
    },
    priority: {
      type: String,
      enum: ['high', 'normal', 'low'],
      required: true,
    },
    jobId: { type: String, default: null },
    sentAt: { type: Date, default: null },
    metadata: { type: mongoose.Schema.Types.Mixed, default: {} },
    // Auto-expire logs after 90 days for GDPR compliance
    createdAt: { type: Date, default: Date.now, expires: '90d' },
  },
  { timestamps: true }
)

// Add indexes for metrics dashboard performance
emailLogSchema.index({ status: 1 })
emailLogSchema.index({ category: 1 })

export const EmailLog = mongoose.model('EmailLog', emailLogSchema)
