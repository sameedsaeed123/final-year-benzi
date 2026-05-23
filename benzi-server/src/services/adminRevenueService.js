import { TherapistSubscription } from '../models/TherapistSubscription.js'
import { SubscriptionPlan } from '../models/SubscriptionPlan.js'
import { User } from '../models/User.js'

function startOfMonth(d = new Date()) {
  return new Date(d.getFullYear(), d.getMonth(), 1)
}

function formatCents(cents) {
  return Math.round((cents || 0) / 100)
}

export async function getAdminSubscriptionStats() {
  const now = new Date()
  const monthStart = startOfMonth(now)

  const [totals, monthTotals, activeCount, byPlan, last12Months] = await Promise.all([
    TherapistSubscription.aggregate([
      { $group: { _id: null, totalCents: { $sum: '$amountPaidCents' }, count: { $sum: 1 } } },
    ]),
    TherapistSubscription.aggregate([
      { $match: { updatedAt: { $gte: monthStart } } },
      { $group: { _id: null, totalCents: { $sum: '$amountPaidCents' } } },
    ]),
    TherapistSubscription.countDocuments({ status: { $in: ['active', 'trialing'] } }),
    TherapistSubscription.aggregate([
      {
        $group: {
          _id: '$planSlug',
          count: { $sum: 1 },
          revenueCents: { $sum: '$amountPaidCents' },
        },
      },
    ]),
    TherapistSubscription.aggregate([
      {
        $match: {
          updatedAt: { $gte: new Date(now.getFullYear(), now.getMonth() - 11, 1) },
        },
      },
      {
        $group: {
          _id: {
            year: { $year: '$updatedAt' },
            month: { $month: '$updatedAt' },
          },
          revenueCents: { $sum: '$amountPaidCents' },
        },
      },
      { $sort: { '_id.year': 1, '_id.month': 1 } },
    ]),
  ])

  const totalRevenueCents = totals[0]?.totalCents || 0
  const monthRevenueCents = monthTotals[0]?.totalCents || 0

  const plans = await SubscriptionPlan.find().select('slug name').lean()
  const planNames = Object.fromEntries(plans.map((p) => [p.slug, p.name]))

  const revenueByPlan = byPlan.map((row) => ({
    planSlug: row._id || 'unknown',
    planName: planNames[row._id] || row._id || 'Unknown',
    count: row.count,
    revenue: formatCents(row.revenueCents),
    revenueCents: row.revenueCents,
  }))

  const monthLabels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const monthlyRevenue = last12Months.map((row) => ({
    label: `${monthLabels[row._id.month - 1]} ${row._id.year}`,
    revenue: formatCents(row.revenueCents),
    revenueCents: row.revenueCents,
  }))

  const planDistribution = byPlan.map((row) => ({
    planSlug: row._id,
    planName: planNames[row._id] || row._id,
    count: row.count,
  }))

  return {
    totalRevenue: formatCents(totalRevenueCents),
    totalRevenueCents,
    monthRevenue: formatCents(monthRevenueCents),
    monthRevenueCents,
    activeSubscriptions: activeCount,
    totalSubscriptionRecords: totals[0]?.count || 0,
    revenueByPlan,
    monthlyRevenue,
    planDistribution,
  }
}

export async function listSubscriptionPayments({ page = 1, limit = 20 } = {}) {
  const skip = (page - 1) * limit
  const subs = await TherapistSubscription.find()
    .sort({ updatedAt: -1 })
    .skip(skip)
    .limit(limit)
    .lean()
  const total = await TherapistSubscription.countDocuments()

  const rows = []
  for (const s of subs) {
    const user = await User.findById(s.therapistUserId).select('firstName lastName email').lean()
    rows.push({
      id: String(s._id),
      paymentId: s.stripeSubscriptionId ? `sub_${s.stripeSubscriptionId.slice(-8)}` : `local_${String(s._id).slice(-8)}`,
      doctor: user ? `Dr. ${user.firstName} ${user.lastName}`.trim() : 'Unknown',
      email: user?.email || '',
      date: s.updatedAt,
      plan: s.planName || s.planSlug,
      planSlug: s.planSlug,
      billingInterval: s.billingInterval,
      amount: formatCents(s.amountPaidCents),
      amountCents: s.amountPaidCents,
      status: s.status === 'active' ? 'Completed' : s.status === 'past_due' ? 'Pending' : 'Pending',
    })
  }

  return { payments: rows, total, page, limit }
}
