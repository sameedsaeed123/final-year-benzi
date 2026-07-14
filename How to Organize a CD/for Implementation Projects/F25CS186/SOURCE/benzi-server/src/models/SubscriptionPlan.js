import mongoose from 'mongoose'

const subscriptionPlanSchema = new mongoose.Schema(
  {
    slug: { type: String, required: true, unique: true, trim: true },
    name: { type: String, required: true, trim: true },
    tagline: { type: String, default: '', trim: true },
    priceMonthlyCents: { type: Number, default: 0, min: 0 },
    priceYearlyCents: { type: Number, default: 0, min: 0 },
    maxPatients: { type: Number, default: 5 },
    aiMessageLimitMonthly: { type: Number, default: 50 },
    aiRecommendationLimitMonthly: { type: Number, default: 20 },
    aiContextMultiplier: { type: Number, default: 1 },
    features: { type: [String], default: [] },
    anonymousMood: { type: Boolean, default: true },
    statsGeneration: { type: Boolean, default: true },
    goalAssignment: { type: Boolean, default: true },
    crisisTriggers: { type: Boolean, default: true },
    contextAwareAi: { type: Boolean, default: false },
    digitalContextAi: { type: Boolean, default: false },
    stripeProductId: { type: String, default: '' },
    stripePriceIdMonthly: { type: String, default: '' },
    stripePriceIdYearly: { type: String, default: '' },
    sortOrder: { type: Number, default: 0 },
    featured: { type: Boolean, default: false },
    active: { type: Boolean, default: true },
  },
  { timestamps: true }
)

export const SubscriptionPlan = mongoose.model('SubscriptionPlan', subscriptionPlanSchema)
