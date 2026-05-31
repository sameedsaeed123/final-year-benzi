import { SubscriptionPlan } from '../models/SubscriptionPlan.js'
import { Coupon } from '../models/Coupon.js'
import { TherapistSubscription } from '../models/TherapistSubscription.js'
import { Therapist } from '../models/Therapist.js'

export function planToPublic(plan) {
  if (!plan) return null
  return {
    id: String(plan._id),
    slug: plan.slug,
    name: plan.name,
    tagline: plan.tagline,
    priceMonthly: plan.priceMonthlyCents / 100,
    priceYearly: plan.priceYearlyCents / 100,
    priceMonthlyCents: plan.priceMonthlyCents,
    priceYearlyCents: plan.priceYearlyCents,
    maxPatients: plan.maxPatients,
    features: plan.features || [],
    featured: plan.featured,
    sortOrder: plan.sortOrder,
    limits: {
      maxPatients: plan.maxPatients,
      aiMessageLimitMonthly: plan.aiMessageLimitMonthly,
      aiRecommendationLimitMonthly: plan.aiRecommendationLimitMonthly,
      aiContextMultiplier: plan.aiContextMultiplier,
      contextAwareAi: plan.contextAwareAi,
      digitalContextAi: plan.digitalContextAi,
    },
  }
}

export async function listActivePlans() {
  const plans = await SubscriptionPlan.find({ active: true }).sort({ sortOrder: 1 }).lean()
  return plans.map(planToPublic)
}

export async function getPlanBySlug(slug) {
  const plan = await SubscriptionPlan.findOne({ slug, active: true }).lean()
  return plan
}

export function limitsFromPlan(plan) {
  return {
    maxPatients: plan.maxPatients,
    aiMessageLimitMonthly: plan.aiMessageLimitMonthly,
    aiRecommendationLimitMonthly: plan.aiRecommendationLimitMonthly,
    aiContextMultiplier: plan.aiContextMultiplier,
    contextAwareAi: plan.contextAwareAi,
    digitalContextAi: plan.digitalContextAi,
  }
}

export async function getTherapistSubscription(therapistUserId) {
  const sub = await TherapistSubscription.findOne({ therapistUserId }).lean()
  if (!sub) return null
  const plan = await getPlanBySlug(sub.planSlug)
  return {
    ...sub,
    id: String(sub._id),
    plan: plan ? planToPublic(plan) : null,
  }
}

export async function applySubscriptionToTherapist(therapistUserId, plan, options = {}) {
  const {
    billingInterval = 'monthly',
    status = 'active',
    stripeCustomerId = '',
    stripeSubscriptionId = '',
    currentPeriodStart = new Date(),
    currentPeriodEnd = null,
    couponCode = '',
    amountPaidCents = 0,
  } = options

  const periodEnd =
    currentPeriodEnd ||
    new Date(
      Date.now() +
        (billingInterval === 'yearly' ? 365 : billingInterval === 'free' ? 3650 : 30) *
          24 *
          60 *
          60 *
          1000
    )

  const doc = await TherapistSubscription.findOneAndUpdate(
    { therapistUserId },
    {
      therapistUserId,
      planSlug: plan.slug,
      planName: plan.name,
      billingInterval: billingInterval === 'yearly' ? 'yearly' : billingInterval === 'free' ? 'free' : 'monthly',
      status,
      stripeCustomerId,
      stripeSubscriptionId,
      currentPeriodStart,
      currentPeriodEnd: periodEnd,
      limits: limitsFromPlan(plan),
      couponCode,
      amountPaidCents,
      cancelAtPeriodEnd: false,
    },
    { upsert: true, new: true }
  )

  await Therapist.updateOne(
    { userId: therapistUserId },
    {
      $set: {
        subscriptionPlanSlug: plan.slug,
        subscriptionStatus: status,
        subscriptionExpiresAt: periodEnd,
      },
    }
  )

  return doc
}

export async function validateCoupon(code, planSlug) {
  const normalized = String(code || '')
    .trim()
    .toUpperCase()
  if (!normalized) return { valid: false, message: 'Enter a coupon code' }

  const coupon = await Coupon.findOne({ code: normalized, active: true }).lean()
  if (!coupon) return { valid: false, message: 'Invalid coupon code' }

  const now = new Date()
  if (coupon.validFrom && now < new Date(coupon.validFrom)) {
    return { valid: false, message: 'Coupon not active yet' }
  }
  if (coupon.validUntil && now > new Date(coupon.validUntil)) {
    return { valid: false, message: 'Coupon has expired' }
  }
  if (coupon.maxRedemptions != null && coupon.timesRedeemed >= coupon.maxRedemptions) {
    return { valid: false, message: 'Coupon fully redeemed' }
  }
  if (coupon.planSlugs?.length && !coupon.planSlugs.includes(planSlug)) {
    return { valid: false, message: 'Coupon not valid for this plan' }
  }

  return {
    valid: true,
    coupon: {
      code: coupon.code,
      percentOff: coupon.percentOff,
      amountOffCents: coupon.amountOffCents,
      description: coupon.description,
    },
  }
}

export function computeDiscountedAmountCents(baseCents, coupon) {
  if (!coupon) return baseCents
  if (coupon.percentOff) {
    return Math.max(0, Math.round(baseCents * (1 - coupon.percentOff / 100)))
  }
  if (coupon.amountOffCents) {
    return Math.max(0, baseCents - coupon.amountOffCents)
  }
  return baseCents
}

export async function incrementCouponRedemption(code) {
  await Coupon.updateOne({ code: String(code).toUpperCase() }, { $inc: { timesRedeemed: 1 } })
}

export async function listTherapistAssignments({ page = 1, limit = 5 } = {}) {
  const skip = (page - 1) * limit
  const [subs, total] = await Promise.all([
    TherapistSubscription.find().sort({ updatedAt: -1 }).skip(skip).limit(limit).lean(),
    TherapistSubscription.countDocuments(),
  ])
  const { User } = await import('../models/User.js')
  const userIds = subs.map((s) => s.therapistUserId)
  const users = await User.find({ _id: { $in: userIds } }).select('firstName lastName email').lean()
  const userById = Object.fromEntries(users.map((u) => [String(u._id), u]))

  const assignments = subs.map((s) => {
    const user = userById[String(s.therapistUserId)]
    return {
      id: String(s._id),
      therapistUserId: String(s.therapistUserId),
      doctor: user ? `Dr. ${user.firstName} ${user.lastName}`.trim() : 'Unknown',
      email: user?.email || '',
      plan: s.planName || s.planSlug,
      planSlug: s.planSlug,
      billingInterval: s.billingInterval,
      startDate: s.currentPeriodStart,
      expiryDate: s.currentPeriodEnd,
      status: s.status === 'active' ? 'Active' : s.status === 'canceled' ? 'Inactive' : 'Pending',
      amountPaid: (s.amountPaidCents || 0) / 100,
      limits: s.limits || null,
    }
  })

  return {
    assignments,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
  }
}
