import mongoose from 'mongoose'

const therapistSubscriptionSchema = new mongoose.Schema(
  {
    therapistUserId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
      unique: true,
      index: true,
    },
    planSlug: { type: String, required: true },
    planName: { type: String, default: '' },
    billingInterval: { type: String, enum: ['monthly', 'yearly', 'free'], default: 'monthly' },
    status: {
      type: String,
      enum: ['active', 'trialing', 'past_due', 'canceled', 'incomplete'],
      default: 'active',
    },
    stripeCustomerId: { type: String, default: '' },
    stripeSubscriptionId: { type: String, default: '' },
    currentPeriodStart: { type: Date, default: null },
    currentPeriodEnd: { type: Date, default: null },
    cancelAtPeriodEnd: { type: Boolean, default: false },
    limits: {
      maxPatients: { type: Number, default: 5 },
      aiMessageLimitMonthly: { type: Number, default: 50 },
      aiRecommendationLimitMonthly: { type: Number, default: 20 },
      aiContextMultiplier: { type: Number, default: 1 },
      contextAwareAi: { type: Boolean, default: false },
      digitalContextAi: { type: Boolean, default: false },
    },
    couponCode: { type: String, default: '' },
    amountPaidCents: { type: Number, default: 0 },
  },
  { timestamps: true }
)

export const TherapistSubscription = mongoose.model(
  'TherapistSubscription',
  therapistSubscriptionSchema
)
