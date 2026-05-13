import { Patient } from '../models/Patient.js'
import { PatientAiStats } from '../models/PatientAiStats.js'

const DAYS = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
const MONTHS = ['JAN', 'FEB', 'MAR', 'APR', 'MAY', 'JUN', 'JUL', 'AUG', 'SEP', 'OCT', 'NOV', 'DEC']

function clampScore(points) {
  const p = Number(points) || 0
  return Math.min(100, Math.max(0, p))
}

export async function getPatientDashboard(userId) {
  const patient = await Patient.findOne({ userId: userId }).lean()
  const totalPoints = patient?.totalPoints ?? 0
  let stats = await PatientAiStats.findOne({ userId }).lean()

  if (!stats) {
    stats = await PatientAiStats.create({
      userId,
      taskScore: 0,
      weeklyTaskProgress: DAYS.map((name) => ({ name, value: 0 })),
      progressCenterPct: 0,
      progressBars: [
        { label: 'Mental Health', pct: 0 },
        { label: 'Self Care', pct: 0 },
        { label: 'Therapy', pct: 0 },
      ],
      reportLines: MONTHS.map((month) => ({ month, weekly: 0, monthly: 0, yearly: 0 })),
    })
    stats = stats.toObject()
  }

  const score = clampScore(stats.taskScore ?? 0)
  const remaining = 100 - score

  return {
    taskScore: stats.taskScore ?? totalPoints,
    scoreRadial: [
      { name: 'score', value: score, fill: '#1F5F4A' },
      { name: 'remaining', value: remaining, fill: '#E4E8DF' },
    ],
    weeklyTaskProgress: stats.weeklyTaskProgress?.length ? stats.weeklyTaskProgress : DAYS.map((name) => ({ name, value: 0 })),
    progressCenterPct: stats.progressCenterPct ?? 0,
    progressBars: stats.progressBars?.length
      ? stats.progressBars
      : [
          { label: 'Mental Health', pct: 0 },
          { label: 'Self Care', pct: 0 },
          { label: 'Therapy', pct: 0 },
        ],
    reportLines: stats.reportLines?.length
      ? stats.reportLines
      : MONTHS.map((month) => ({ month, weekly: 0, monthly: 0, yearly: 0 })),
  }
}
