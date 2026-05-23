import mongoose from 'mongoose'

/** Idempotent Stripe webhook processing */
const stripeWebhookEventSchema = new mongoose.Schema(
  {
    eventId: { type: String, required: true, unique: true },
    type: { type: String, required: true },
    processedAt: { type: Date, default: Date.now },
  },
  { timestamps: true }
)

export const StripeWebhookEvent = mongoose.model('StripeWebhookEvent', stripeWebhookEventSchema)
