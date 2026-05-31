import { SubscriptionPlan } from '../models/SubscriptionPlan.js'
import { Coupon } from '../models/Coupon.js'
import { User } from '../models/User.js'
import {
  listTherapistAssignments,
  planToPublic,
  applySubscriptionToTherapist,
} from '../services/subscriptionService.js'
import {
  getAdminSubscriptionStats,
  listSubscriptionPayments,
} from '../services/adminRevenueService.js'
import { sendSuccess, sendError } from '../utils/responseUtils.js'
import { syncCouponToStripe, syncPlanToStripe } from '../services/stripeService.js'
import { invalidateAdminCache } from '../services/adminCacheService.js'
import { parsePaginationQuery } from '../utils/pagination.js'

export async function adminListPlans(req, res, next) {
  try {
    const plans = await SubscriptionPlan.find().sort({ sortOrder: 1 }).lean()
    return sendSuccess(res, { plans: plans.map(planToPublic) }, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function adminUpdatePlan(req, res, next) {
  try {
    const { slug } = req.params
    const allowed = [
      'name',
      'tagline',
      'priceMonthlyCents',
      'priceYearlyCents',
      'maxPatients',
      'aiMessageLimitMonthly',
      'aiRecommendationLimitMonthly',
      'aiContextMultiplier',
      'features',
      'featured',
      'active',
      'sortOrder',
      'stripePriceIdMonthly',
      'stripePriceIdYearly',
    ]
    const updates = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }
    const plan = await SubscriptionPlan.findOneAndUpdate({ slug }, { $set: updates }, { new: true })
    if (!plan) return sendError(res, 'Plan not found', 404)
    try {
      await syncPlanToStripe(plan.toObject())
    } catch (err) {
      console.warn('[Admin] Stripe plan sync failed:', err.message)
    }
    const refreshed = await SubscriptionPlan.findOne({ slug }).lean()
    await invalidateAdminCache()
    return sendSuccess(res, { plan: planToPublic(refreshed) }, 'Updated', 200)
  } catch (e) {
    next(e)
  }
}

export async function adminListCoupons(req, res, next) {
  try {
    const { page, limit, skip, meta } = parsePaginationQuery(req.query)
    const [coupons, total] = await Promise.all([
      Coupon.find().sort({ createdAt: -1 }).skip(skip).limit(limit).lean(),
      Coupon.countDocuments(),
    ])
    return sendSuccess(res, { coupons, ...meta(total) }, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function adminCreateCoupon(req, res, next) {
  try {
    const code = String(req.body?.code || '')
      .trim()
      .toUpperCase()
    if (!code) return sendError(res, 'Code is required', 400)
    const existing = await Coupon.findOne({ code })
    if (existing) return sendError(res, 'Coupon already exists', 409)

    let coupon = await Coupon.create({
      code,
      description: req.body.description || '',
      percentOff: req.body.percentOff ?? null,
      amountOffCents: req.body.amountOffCents ?? null,
      planSlugs: req.body.planSlugs || [],
      maxRedemptions: req.body.maxRedemptions ?? null,
      validUntil: req.body.validUntil ? new Date(req.body.validUntil) : null,
      active: req.body.active !== false,
    })
    try {
      const stripeIds = await syncCouponToStripe(coupon.toObject())
      if (stripeIds?.stripeCouponId) {
        coupon = await Coupon.findByIdAndUpdate(
          coupon._id,
          { $set: stripeIds },
          { new: true }
        )
      }
    } catch (err) {
      console.warn('[Admin] Stripe coupon sync failed:', err.message)
    }
    await invalidateAdminCache()
    return sendSuccess(res, { coupon }, 'Created', 201)
  } catch (e) {
    next(e)
  }
}

export async function adminUpdateCoupon(req, res, next) {
  try {
    const allowed = ['description', 'percentOff', 'amountOffCents', 'planSlugs', 'maxRedemptions', 'validUntil', 'active']
    const updates = {}
    for (const key of allowed) {
      if (req.body[key] !== undefined) updates[key] = req.body[key]
    }
    const coupon = await Coupon.findByIdAndUpdate(req.params.id, { $set: updates }, { new: true })
    if (!coupon) return sendError(res, 'Not found', 404)
    await invalidateAdminCache()
    return sendSuccess(res, { coupon }, 'Updated', 200)
  } catch (e) {
    next(e)
  }
}

export async function adminListAssignments(req, res, next) {
  try {
    const { page, limit } = parsePaginationQuery(req.query)
    const { assignments, total, totalPages } = await listTherapistAssignments({ page, limit })
    return sendSuccess(res, { assignments, total, page, limit, totalPages }, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function adminGetRevenueStats(req, res, next) {
  try {
    const stats = await getAdminSubscriptionStats()
    return sendSuccess(res, stats, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function adminListPayments(req, res, next) {
  try {
    const page = Math.max(1, Number(req.query.page) || 1)
    const limit = Math.min(50, Math.max(1, Number(req.query.limit) || 5))
    const data = await listSubscriptionPayments({ page, limit })
    return sendSuccess(res, data, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function adminAssignSubscription(req, res, next) {
  try {
    const therapistUserId = String(req.body?.therapistUserId || '')
    const planSlug = String(req.body?.planSlug || '')
    const billingInterval =
      req.body?.billingInterval === 'yearly'
        ? 'yearly'
        : req.body?.billingInterval === 'free'
          ? 'free'
          : 'monthly'

    if (!therapistUserId || !planSlug) {
      return sendError(res, 'therapistUserId and planSlug are required', 400)
    }

    const user = await User.findById(therapistUserId).lean()
    if (!user || user.role !== 'therapist') {
      return sendError(res, 'Therapist user not found', 404)
    }

    const plan = await SubscriptionPlan.findOne({ slug: planSlug }).lean()
    if (!plan) return sendError(res, 'Plan not found', 404)

    const amountPaidCents =
      billingInterval === 'yearly' ? plan.priceYearlyCents : plan.priceMonthlyCents

    await applySubscriptionToTherapist(therapistUserId, plan, {
      billingInterval,
      status: 'active',
      amountPaidCents: billingInterval === 'free' ? 0 : amountPaidCents,
    })

    const { assignments } = await listTherapistAssignments({ page: 1, limit: 5 })
    await invalidateAdminCache()
    return sendSuccess(res, { assignments }, 'Subscription assigned', 200)
  } catch (e) {
    next(e)
  }
}
