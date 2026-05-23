import { AiMessage } from '../models/AiMessage.js'
import { AiMoodLog } from '../models/AiMoodLog.js'
import { AiGoal } from '../models/AiGoal.js'
import { PatientAiStats } from '../models/PatientAiStats.js'
import { Appointment } from '../models/Appointment.js'
import { User } from '../models/User.js'
import { processAppointmentCompletions } from './appointmentCompletionService.js'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

function clampPct(n) {
  return Math.min(100, Math.max(0, Math.round(n)))
}

function startOfUtcDay(d = new Date()) {
  const x = new Date(d)
  x.setUTCHours(0, 0, 0, 0)
  return x
}

function dayName(date) {
  return DAYS[date.getDay() === 0 ? 6 : date.getDay() - 1]
}

export async function upsertTodayMoodLog(patientUserId, sentimentScore, sentimentLabel) {
  const todayStart = startOfUtcDay()
  let log = await AiMoodLog.findOne({ patientUserId, date: todayStart })
  if (!log) {
    await AiMoodLog.create({
      patientUserId,
      date: todayStart,
      averageSentiment: sentimentScore,
      messageCount: 1,
      dominantLabel: sentimentLabel,
    })
    return
  }
  const newCount = log.messageCount + 1
  const newAvg = (log.averageSentiment * log.messageCount + sentimentScore) / newCount
  log.messageCount = newCount
  log.averageSentiment = newAvg
  log.dominantLabel = newAvg > 0.05 ? 'positive' : newAvg < -0.05 ? 'negative' : 'neutral'
  await log.save()
}

export async function syncPatientAiStats(patientUserId) {
  const payload = await buildAiAnalytics(patientUserId)
  await PatientAiStats.findOneAndUpdate(
    { userId: patientUserId },
    {
      userId: patientUserId,
      taskScore: payload.taskScore,
      weeklyTaskProgress: payload.weeklyTaskProgress,
      progressCenterPct: payload.progressCenterPct,
      progressBars: payload.progressBars,
      reportLines: payload.reportLines,
    },
    { upsert: true, new: true }
  )
  return payload
}

export async function buildAiAnalytics(patientUserId) {
  const [moodLogs, goals, patientMessages] = await Promise.all([
    AiMoodLog.find({ patientUserId }).sort({ date: -1 }).limit(90).lean(),
    AiGoal.find({ patientUserId }).lean(),
    AiMessage.find({ patientUserId, sender: 'patient' }).lean(),
  ])

  const activeGoals = goals.filter((g) => g.status !== 'rejected')
  const completedGoals = activeGoals.filter((g) => g.status === 'completed').length
  const totalGoals = activeGoals.length || 1
  const goalPct = clampPct((completedGoals / totalGoals) * 100)

  const inProgress = activeGoals.filter((g) => g.status === 'in-progress').length
  const pending = activeGoals.filter((g) => g.status === 'pending').length

  const avgMood =
    moodLogs.length > 0
      ? moodLogs.reduce((s, m) => s + (m.averageSentiment || 0), 0) / moodLogs.length
      : 0

  const taskScore = clampPct(((avgMood + 1) / 2) * 50 + goalPct * 0.5)

  const weeklyTaskProgress = DAYS.map((name) => {
    const logsForDay = moodLogs.filter((m) => dayName(new Date(m.date)) === name)
    const val =
      logsForDay.length > 0
        ? clampPct(
            ((logsForDay.reduce((s, l) => s + (l.averageSentiment || 0), 0) / logsForDay.length + 1) / 2) *
              100
          )
        : 0
    return { name, value: val }
  })

  const progressBars = [
    { label: 'Mental Health', pct: clampPct(((avgMood + 1) / 2) * 100) },
    { label: 'Self Care', pct: clampPct(goalPct) },
    { label: 'Therapy', pct: clampPct(inProgress > 0 ? 60 + pending * 5 : pending * 10) },
  ]

  const reportLines = MONTHS.map((month, idx) => {
    const monthLogs = moodLogs.filter((m) => new Date(m.date).getMonth() === idx)
    const avg =
      monthLogs.length > 0
        ? monthLogs.reduce((s, l) => s + (l.messageCount || 0), 0)
        : 0
    const sentimentAvg =
      monthLogs.length > 0
        ? monthLogs.reduce((s, l) => s + (l.averageSentiment || 0), 0) / monthLogs.length
        : 0
    const scaled = clampPct(((sentimentAvg + 1) / 2) * 100)
    return {
      month,
      weekly: Math.round(avg * 10),
      monthly: scaled,
      yearly: clampPct(scaled + avg * 2),
    }
  })

  let negative = 0
  let neutral = 0
  let positive = 0
  for (const m of patientMessages) {
    if (m.sentimentLabel === 'positive') positive += 1
    else if (m.sentimentLabel === 'negative') negative += 1
    else neutral += 1
  }

  const last14Mood = [...moodLogs]
    .sort((a, b) => new Date(a.date) - new Date(b.date))
    .slice(-14)
    .map((m) => ({
      date: m.date,
      averageSentiment: m.averageSentiment,
      messageCount: m.messageCount,
      dominantLabel: m.dominantLabel,
    }))

  const overallProgress = last14Mood.map((m) => ({
    month: new Date(m.date).toLocaleString('en-US', { month: 'short' }),
    value: clampPct(((m.averageSentiment + 1) / 2) * 100),
  }))

  const now = new Date()
  const benziUsageData = []
  for (let i = 3; i >= 0; i -= 1) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1)
    const count = patientMessages.filter(
      (msg) =>
        new Date(msg.createdAt).getMonth() === d.getMonth() &&
        new Date(msg.createdAt).getFullYear() === d.getFullYear()
    ).length
    benziUsageData.push({
      name: d.toLocaleString('en-US', { month: 'short' }),
      value: count,
    })
  }

  const weekStart = new Date(now)
  weekStart.setDate(weekStart.getDate() - 6)
  const chatbotUsageData = DAYS.map((day) => {
    const count = patientMessages.filter(
      (msg) => dayName(new Date(msg.createdAt)) === day && new Date(msg.createdAt) >= weekStart
    ).length
    return { day, value: count }
  })

  const highPriorityGoals = goals.filter((g) => g.priority === 'high' && g.status !== 'completed')
  const individualStats = [
    { label: 'Mood balance', value: clampPct(((avgMood + 1) / 2) * 100), color: '#1F5F4A' },
    { label: 'Goal progress', value: goalPct, color: '#527f62' },
    { label: 'AI engagement', value: clampPct(Math.min(100, patientMessages.length * 5)), color: '#97BFA5' },
    {
      label: 'Active goals',
      value: clampPct(goals.filter((g) => g.status !== 'completed').length * 20),
      color: '#c9d8cb',
    },
  ]

  return {
    taskScore,
    scoreRadial: [
      { name: 'score', value: taskScore, fill: '#1F5F4A' },
      { name: 'remaining', value: 100 - taskScore, fill: '#E4E8DF' },
    ],
    weeklyTaskProgress,
    progressCenterPct: goalPct,
    progressBars,
    reportLines,
    moodLogs: last14Mood,
    sentimentCounts: { negative, neutral, positive },
    goals: goals.map((g) => ({
      id: String(g._id),
      title: g.title,
      description: g.description,
      priority: g.priority,
      status: g.status,
      aiRecommended: g.aiRecommended,
      submittedBy: g.submittedBy || 'therapist',
      createdAt: g.createdAt,
    })),
    overallProgress,
    benziUsageData,
    chatbotUsageData,
    individualStats,
    aiMessageCount: patientMessages.length,
    highPriorityGoals: highPriorityGoals.length,
  }
}

export async function getPatientAiDashboard(patientUserId) {
  await processAppointmentCompletions()
  const analytics = await syncPatientAiStats(patientUserId)

  const now = new Date()
  const nextAppt = await Appointment.findOne({
    patientUserId,
    status: { $in: ['PENDING', 'CONFIRMED'] },
    date: { $gte: now },
  })
    .sort({ date: 1 })
    .lean()

  let nextAppointment = null
  if (nextAppt) {
    const therapist = await User.findById(nextAppt.therapistUserId).select('firstName lastName').lean()
    nextAppointment = {
      id: String(nextAppt._id).slice(-8).toUpperCase(),
      therapist: therapist
        ? `Dr. ${therapist.firstName || ''} ${therapist.lastName || ''}`.trim()
        : 'Therapist',
      dateTime: new Date(nextAppt.date).toLocaleString('en-GB', {
        day: 'numeric',
        month: 'short',
        year: 'numeric',
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
      }),
      status: nextAppt.status,
      location: nextAppt.location,
      meetLink: nextAppt.meetLink || '',
      bookedAsAnonymous: Boolean(nextAppt.bookedAsAnonymous),
      meetJoinAlias: nextAppt.patientMeetDisplayName || '',
      videoProvider: nextAppt.videoProvider || 'google',
    }
  }

  return { ...analytics, nextAppointment }
}

export async function getTherapistPatientAiSummary(patientUserId) {
  const analytics = await buildAiAnalytics(patientUserId)
  return {
    taskScore: analytics.taskScore,
    progressCenterPct: analytics.progressCenterPct,
    aiMessageCount: analytics.aiMessageCount,
    sentimentCounts: analytics.sentimentCounts,
    activeGoals: analytics.goals.filter((g) => g.status !== 'completed').length,
    dominantMood: analytics.moodLogs.at(-1)?.dominantLabel || 'neutral',
  }
}
