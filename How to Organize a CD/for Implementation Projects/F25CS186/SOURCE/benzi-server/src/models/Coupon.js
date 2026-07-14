import mongoose from 'mongoose'

const couponSchema = new mongoose.Schema(
  {
    code: { type: String, required: true, unique: true, uppercase: true, trim: true },
    description: { type: String, default: '' },
    percentOff: { type: Number, default: null, min: 0, max: 100 },
    amountOffCents: { type: Number, default: null, min: 0 },
    planSlugs: { type: [String], default: [] },
    maxRedemptions: { type: Number, default: null },
    timesRedeemed: { type: Number, default: 0 },
    validFrom: { type: Date, default: null },
    validUntil: { type: Date, default: null },
    active: { type: Boolean, default: true },
    stripeCouponId: { type: String, default: '' },
    stripePromotionCodeId: { type: String, default: '' },
  },
  { timestamps: true }
)

export const Coupon = mongoose.model('Coupon', couponSchema)
