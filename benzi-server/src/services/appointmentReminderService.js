import cron from 'node-cron'
import { Appointment } from '../models/Appointment.js'
import { Patient } from '../models/Patient.js'
import { User } from '../models/User.js'
import { AppointmentReminder } from '../models/AppointmentReminder.js'
import { sendAppointmentReminder } from './emailService.js'
import { reminderIntervals } from '../config/email.js'
import { env } from '../config/environment.js'

/**
 * Scan upcoming appointments and send reminders
 */
export async function processAppointmentReminders() {
  console.log('[ReminderScheduler] Scanning for upcoming appointment reminders...')
  try {
    const now = new Date()
    // Find all confirmed appointments in the next 26 hours (buffer)
    const maxTime = new Date(now.getTime() + 26 * 60 * 60 * 1000)

    const appointments = await Appointment.find({
      status: 'CONFIRMED',
      date: { $gte: now, $lte: maxTime },
    })

    console.log(`[ReminderScheduler] Found ${appointments.length} confirmed appointments in next 26 hours.`)

    for (const appt of appointments) {
      const patientUser = await User.findById(appt.patientUserId)
      const therapistUser = await User.findById(appt.therapistUserId)

      if (!patientUser || !therapistUser) {
        console.warn(`[ReminderScheduler] Missing patient or therapist user for appointment ${appt._id}`)
        continue
      }

      // Fetch Patient preferences
      const patient = await Patient.findOne({ userId: appt.patientUserId })
      const prefs = patient?.reminderPreferences || {
        email24h: true,
        email10h: true,
        email5h: true,
        email3h: true,
        email2h: true,
        email1h: true,
        masterEnabled: true,
      }

      // If patient disabled all reminders, skip
      if (prefs.masterEnabled === false) {
        continue
      }

      // Time difference in hours
      const diffMs = appt.date.getTime() - now.getTime()
      const diffHours = diffMs / (1000 * 60 * 60)

      // Evaluate each interval
      for (const interval of reminderIntervals) {
        const label = `${interval}h`
        // Toggle flag based on interval
        const prefKey = `email${interval}h`
        const isPrefEnabled = prefs[prefKey] !== false

        if (!isPrefEnabled) {
          continue // Patient opted out of this specific reminder
        }

        // We check if we are in the triggering window: [interval - 0.5, interval]
        // Since cron runs every 15 minutes, a 30-minute window will execute exactly once.
        const isInWindow = diffHours <= interval && diffHours >= (interval - 0.5)

        if (isInWindow) {
          // Check if already scheduled/sent to prevent duplication
          const exists = await AppointmentReminder.findOne({
            appointmentId: appt._id,
            hoursBeforeAppointment: interval,
          })

          if (!exists) {
            try {
              // Create the tracking record first to prevent race conditions
              const tracking = new AppointmentReminder({
                appointmentId: appt._id,
                hoursBeforeAppointment: interval,
                scheduledFor: appt.date,
                sent: false,
              })
              await tracking.save()

              const dateObj = new Date(appt.date)
              const tz = patient?.timezone || 'UTC'

              // Format date and time separately
              const formattedDate = dateObj.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
                timeZone: tz,
              })

              const formattedTime = dateObj.toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                timeZone: tz,
              })

              const appointmentUrl = `${env.FRONTEND_URL || 'http://localhost:3000'}/appointments/${appt._id}`
              const preferencesUrl = `${env.FRONTEND_URL || 'http://localhost:3000'}/patient/reminder-preferences/me`

              // Queue the reminder email
              const emailResult = await sendAppointmentReminder(
                patientUser.email,
                `${patientUser.firstName} ${patientUser.lastName}`,
                `Dr. ${therapistUser.firstName} ${therapistUser.lastName}`,
                formattedDate,
                formattedTime,
                interval.toString(),
                appt.location || 'Online Video Call Session',
                appointmentUrl,
                preferencesUrl
              )

              // Mark as sent
              tracking.sent = true
              tracking.sentAt = new Date()
              tracking.emailLogId = emailResult.logId
              await tracking.save()

              console.log(`[ReminderScheduler] Successfully dispatched ${label} reminder for appointment ${appt._id} to patient`)
            } catch (err) {
              if (err.code === 11000) {
                // Duplicate key error — another process/thread handled it
                console.log(`[ReminderScheduler] Duplicate reminder avoided for appointment ${appt._id} at ${interval}h`)
              } else {
                console.error(`[ReminderScheduler] Error sending reminder for appointment ${appt._id}:`, err.message)
              }
            }
          }
        }
      }
    }
  } catch (err) {
    console.error('[ReminderScheduler] Error running reminder cron job:', err.message)
  }
}

/**
 * Initialize node-cron Scheduler
 * Runs every 15 minutes by default
 */
let reminderCronJob = null

export function initReminderScheduler() {
  const schedule = process.env.REMINDER_CRON_SCHEDULE || '*/15 * * * *'
  
  console.log(`[ReminderScheduler] Initializing reminder cron scheduler with expression: "${schedule}"`)
  
  reminderCronJob = cron.schedule(schedule, async () => {
    await processAppointmentReminders()
  })
}

export function stopReminderScheduler() {
  if (reminderCronJob) {
    reminderCronJob.stop()
    console.log('[ReminderScheduler] Scheduler stopped.')
  }
}

export default {
  processAppointmentReminders,
  initReminderScheduler,
  stopReminderScheduler,
}
