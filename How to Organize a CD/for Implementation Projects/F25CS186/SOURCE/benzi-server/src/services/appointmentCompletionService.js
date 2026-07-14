import cron from 'node-cron'
import { Appointment } from '../models/Appointment.js'

/**
 * Mark CONFIRMED appointments as COMPLETED once their end time has passed.
 */
export async function processAppointmentCompletions() {
  const now = new Date()
  const confirmed = await Appointment.find({ status: 'CONFIRMED' })
    .select('_id date durationMinutes')
    .lean()

  const idsToComplete = confirmed
    .filter((a) => {
      const start = new Date(a.date)
      const endMs = start.getTime() + (a.durationMinutes || 60) * 60 * 1000
      return endMs <= now.getTime()
    })
    .map((a) => a._id)

  if (!idsToComplete.length) return { updated: 0 }

  const result = await Appointment.updateMany(
    { _id: { $in: idsToComplete } },
    { $set: { status: 'COMPLETED' } }
  )

  const updated = result.modifiedCount ?? idsToComplete.length
  if (updated > 0) {
    console.log(`[CompletionScheduler] Marked ${updated} appointment(s) as COMPLETED`)
  }
  return { updated }
}

let completionCronJob = null

export function initCompletionScheduler() {
  const schedule = process.env.COMPLETION_CRON_SCHEDULE || '*/5 * * * *'
  console.log(`[CompletionScheduler] Initializing with expression: "${schedule}"`)
  completionCronJob = cron.schedule(schedule, async () => {
    try {
      await processAppointmentCompletions()
    } catch (err) {
      console.error('[CompletionScheduler] Error:', err.message)
    }
  })
}

export function stopCompletionScheduler() {
  if (completionCronJob) {
    completionCronJob.stop()
    console.log('[CompletionScheduler] Stopped.')
  }
}

export default {
  processAppointmentCompletions,
  initCompletionScheduler,
  stopCompletionScheduler,
}
