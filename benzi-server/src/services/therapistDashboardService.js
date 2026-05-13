import { Service } from '../models/Service.js'
import { Therapist } from '../models/Therapist.js'
import { Appointment } from '../models/Appointment.js'
import { User } from '../models/User.js'

const MS_DAY = 86400000

function padRevenueWeekly(rows) {
  const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9']
  return labels.map((label, i) => rows[i] || { label, value: '$0', width: '0%' })
}

function padRevenueMonthly(rows) {
  const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
  return labels.map((label, i) => rows[i] || { label, value: '$0', width: '0%' })
}

function padRevenueYearly(rows) {
  const labels = ['2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032']
  return labels.map((label, i) => rows[i] || { label, value: '$0', width: '0%' })
}

function formatUsd0(cents) {
  const v = Math.round((cents || 0) / 100)
  return `$${v}`
}

function pctWidth(maxCents, cents) {
  if (!maxCents || maxCents <= 0) return '0%'
  const p = Math.min(100, Math.round(((cents || 0) / maxCents) * 100))
  return `${p}%`
}

export async function getTherapistDashboard(therapistUserId) {
  const tuid = therapistUserId
  const now = new Date()
  const since30 = new Date(now.getTime() - 30 * MS_DAY)

  const [activeServices, newServices, therapistRow, pkgAgg] = await Promise.all([
    Service.countDocuments({ therapistUserId: tuid, isActive: true }),
    Service.countDocuments({ therapistUserId: tuid, createdAt: { $gte: since30 } }),
    Therapist.findOne({ userId: tuid }).lean(),
    Appointment.aggregate([
      { $match: { therapistUserId: tuid, status: 'COMPLETED' } },
      {
        $lookup: {
          from: 'services',
          localField: 'serviceId',
          foreignField: '_id',
          as: 'svc',
        },
      },
      { $unwind: { path: '$svc', preserveNullAndEmptyArrays: true } },
      {
        $group: {
          _id: '$svc.name',
          count: { $sum: 1 },
          revenueCents: { $sum: { $ifNull: ['$svc.pricePerSession', 0] } },
        },
      },
      { $sort: { count: -1 } },
      { $limit: 4 },
    ]),
  ])

  const avgRating = therapistRow?.avgRating ?? 0
  const avgReply = therapistRow?.avgReplyTimeMinutes ?? 0
  const reviewCount = therapistRow?.reviewCount ?? 0

  const defaultPackages = [
    { label: 'Stress Management', value: 0, color: '#1F5F4A' },
    { label: 'Career Counselling', value: 0, color: '#1F5F4A' },
  ]
  const fromAgg = pkgAgg.slice(0, 2).map((p, idx) => ({
    label: p._id || `Service ${idx + 1}`,
    value: Math.min(100, (p.count || 0) * 25),
    color: '#1F5F4A',
  }))
  const packageData = fromAgg.length > 0 ? [...fromAgg, ...defaultPackages].slice(0, 2) : defaultPackages

  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  const todayAppt = await Appointment.findOne({
    therapistUserId: tuid,
    date: { $gte: start, $lt: end },
  })
    .sort({ date: 1 })
    .lean()

  let todayPatientName = ''
  let todayTopic = 'No sessions scheduled for today.'
  if (todayAppt) {
    const pu = await User.findById(todayAppt.patientUserId).select('firstName lastName').lean()
    todayPatientName = pu ? `${pu.firstName || ''} ${pu.lastName || ''}`.trim() : 'Patient'
    todayTopic = `Session — ${todayAppt.status === 'COMPLETED' ? 'Completed' : 'Upcoming'}`
  }

  const completed = await Appointment.find({ therapistUserId: tuid, status: 'COMPLETED' })
    .populate('serviceId')
    .lean()

  const weeklyBuckets = {}
  for (let i = 0; i < 9; i++) weeklyBuckets[i] = 0
  const monthKeys = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
  const monthlyBuckets = {}
  monthKeys.forEach((m) => {
    monthlyBuckets[m] = 0
  })
  const yearlyKeys = ['2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032']
  const yearlyBuckets = {}
  yearlyKeys.forEach((y) => {
    yearlyBuckets[y] = 0
  })

  for (const a of completed) {
    const cents = a.serviceId?.pricePerSession || 0
    const d = new Date(a.date)
    const diffWeeks = Math.floor((now.getTime() - d.getTime()) / (7 * MS_DAY))
    const wk = Math.min(8, Math.max(0, diffWeeks))
    weeklyBuckets[wk] = (weeklyBuckets[wk] || 0) + cents

    const mk = monthKeys[d.getMonth()] ?? 'Jan'
    if (monthlyBuckets[mk] !== undefined) monthlyBuckets[mk] += cents

    const y = String(d.getFullYear())
    if (yearlyBuckets[y] !== undefined) yearlyBuckets[y] += cents
  }

  let maxWeekly = 0
  for (let i = 0; i < 9; i++) maxWeekly = Math.max(maxWeekly, weeklyBuckets[i] || 0)

  let maxMonthly = 0
  for (const m of monthKeys) maxMonthly = Math.max(maxMonthly, monthlyBuckets[m] || 0)

  let maxYearly = 0
  for (const y of yearlyKeys) maxYearly = Math.max(maxYearly, yearlyBuckets[y] || 0)

  const weeklyRows = Array.from({ length: 9 }, (_, i) => {
    const c = weeklyBuckets[i] || 0
    return {
      label: `Week ${i + 1}`,
      value: formatUsd0(c),
      width: pctWidth(maxWeekly || 1, c),
    }
  })

  const monthlyRows = monthKeys.map((label) => {
    const c = monthlyBuckets[label] || 0
    return { label, value: formatUsd0(c), width: pctWidth(maxMonthly || 1, c) }
  })

  const yearlyRows = yearlyKeys.map((label) => {
    const c = yearlyBuckets[label] || 0
    return { label, value: formatUsd0(c), width: pctWidth(maxYearly || 1, c) }
  })

  return {
    statCards: [
      {
        label: 'Active Services',
        value: String(activeServices),
        delta: '+0.0% vs last Month',
        accent: 'text-[#1f5f4a]',
      },
      {
        label: 'New Services',
        value: String(newServices),
        delta: '+0.0% vs last Month',
        accent: 'text-[#b45309]',
      },
      {
        label: 'Avg Reviews',
        value: reviewCount > 0 ? avgRating.toFixed(1) : '0',
        delta: '+0.0% vs last Month',
        accent: 'text-[#1f5f4a]',
      },
      {
        label: 'Avg Reply Time',
        value: avgReply > 0 ? `${avgReply} min` : '0 min',
        delta: '+0.0% vs last Month',
        accent: 'text-[#1f5f4a]',
      },
    ],
    packageData,
    today: {
      topic: todayTopic,
      patientName: todayPatientName,
    },
    revenue: {
      Weekly: padRevenueWeekly(weeklyRows),
      Monthly: padRevenueMonthly(monthlyRows),
      Yearly: padRevenueYearly(yearlyRows),
    },
    patientOptions: await listRecentPatientNames(tuid),
  }
}

async function listRecentPatientNames(therapistUserId) {
  const ids = await Appointment.distinct('patientUserId', { therapistUserId })
  if (!ids.length) return ['—']
  const users = await User.find({ _id: { $in: ids.slice(0, 20) } })
    .select('firstName lastName')
    .lean()
  return users.map((u) => `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Patient')
}
