import { Service } from '../models/Service.js'
import { Therapist } from '../models/Therapist.js'
import { Appointment } from '../models/Appointment.js'
import { User } from '../models/User.js'
import { Patient } from '../models/Patient.js'
import { processAppointmentCompletions } from './appointmentCompletionService.js'

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
  await processAppointmentCompletions()

  const tuid = therapistUserId
  const now = new Date()
  const since30 = new Date(now.getTime() - 30 * MS_DAY)

  const [activeServices, newServices, therapistRow, allAppointments] = await Promise.all([
    Service.countDocuments({ therapistUserId: tuid, isActive: true }),
    Service.countDocuments({ therapistUserId: tuid, createdAt: { $gte: since30 } }),
    Therapist.findOne({ userId: tuid }).lean(),
    Appointment.find({ therapistUserId: tuid }).select('serviceId serviceName status paymentStatus servicePriceAtBooking date').lean(),
  ])

  const avgRating = therapistRow?.avgRating ?? 0
  const avgReply = therapistRow?.avgReplyTimeMinutes ?? 0
  const reviewCount = therapistRow?.reviewCount ?? 0

  // Calculate service statistics from appointments
  const serviceStats = {}
  let totalAppointments = 0
  
  for (const appt of allAppointments) {
    const serviceName = appt.serviceName || 'Unknown Service'
    if (!serviceStats[serviceName]) {
      serviceStats[serviceName] = { count: 0, revenue: 0 }
    }
    serviceStats[serviceName].count++
    totalAppointments++
    
    // Only count revenue for verified payments
    if (appt.paymentStatus === 'VERIFIED') {
      serviceStats[serviceName].revenue += (appt.servicePriceAtBooking || 0)
    }
  }

  // Convert to array and sort by count
  const sortedServices = Object.entries(serviceStats)
    .map(([name, stats]) => ({
      label: name,
      count: stats.count,
      revenue: stats.revenue,
      percentage: totalAppointments > 0 ? Math.round((stats.count / totalAppointments) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)

  // Get top 2 services for "Most Bought Package"
  const packageData = sortedServices.slice(0, 2).map(service => ({
    label: service.label,
    value: service.percentage,
    color: '#1F5F4A',
  }))

  // If no services, show defaults
  if (packageData.length === 0) {
    packageData.push(
      { label: 'No services booked yet', value: 0, color: '#1F5F4A' },
      { label: 'Add services to get started', value: 0, color: '#1F5F4A' }
    )
  } else if (packageData.length === 1) {
    packageData.push({ label: 'Other services', value: 0, color: '#1F5F4A' })
  }

  const start = new Date(now)
  start.setHours(0, 0, 0, 0)
  const end = new Date(start)
  end.setDate(end.getDate() + 1)

  const todayAppt = await Appointment.findOne({
    therapistUserId: tuid,
    date: { $gte: start, $lt: end },
    status: { $in: ['PENDING', 'CONFIRMED'] },
  })
    .sort({ date: 1 })
    .lean()

  let todayPatientName = ''
  let todayTopic = 'No sessions scheduled for today.'
  let todayMeetLink = ''
  let todayDateTime = ''
  let todayLocationCode = ''
  if (todayAppt) {
    const pu = await User.findById(todayAppt.patientUserId).select('firstName lastName').lean()
    const realName = pu ? `${pu.firstName || ''} ${pu.lastName || ''}`.trim() : 'Patient'
    // Check anonymous mode
    const anonRecord = await Patient.findOne({ userId: todayAppt.patientUserId })
      .select('anonymousModeEnabled anonymousAlias')
      .lean()
    if (todayAppt.bookedAsAnonymous || anonRecord?.anonymousModeEnabled) {
      todayPatientName = 'Anonymous patient'
    } else {
      todayPatientName = realName
    }
    todayTopic = `Session — ${todayAppt.status === 'COMPLETED' ? 'Completed' : 'Upcoming'}`
    todayMeetLink = todayAppt.bookedAsAnonymous
      ? todayAppt.therapistMeetLink || todayAppt.meetLink || ''
      : todayAppt.meetLink || ''
    todayDateTime = new Date(todayAppt.date).toLocaleString('en-GB', {
      day: 'numeric',
      month: 'short',
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    })
    todayLocationCode = todayAppt.location || ''
  }

  // Calculate revenue from VERIFIED payments only
  const verifiedAppointments = allAppointments.filter(a => a.paymentStatus === 'VERIFIED')

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

  for (const a of verifiedAppointments) {
    const cents = a.servicePriceAtBooking || 0
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
      meetLink: todayMeetLink,
      dateTime: todayDateTime,
      locationCode: todayLocationCode,
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

  // Fetch anonymous status for all
  const patientRecords = await Patient.find({ userId: { $in: ids.slice(0, 20) } })
    .select('userId anonymousModeEnabled anonymousAlias')
    .lean()
  const anonMap = Object.fromEntries(
    patientRecords.map((p) => [String(p.userId), p])
  )

  return users.map((u) => {
    const anon = anonMap[String(u._id)]
    if (anon?.anonymousModeEnabled) {
      return anon.anonymousAlias || `Patient #${String(u._id).slice(-4).toUpperCase()}`
    }
    return `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Patient'
  })
}
