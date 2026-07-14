import { sendSuccess } from '../utils/responseUtils.js'
import { getPatientDashboard } from '../services/patientDashboardService.js'
import { getLinkedTherapistForPatient, getLinkedTherapistsForPatient } from '../services/patientService.js'
import { Patient } from '../models/Patient.js'

export async function patientDashboard(req, res, next) {
  try {
    const data = await getPatientDashboard(req.user.id)
    return sendSuccess(res, data, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function patientLinkedTherapist(req, res, next) {
  try {
    const data = await getLinkedTherapistForPatient(req.user.id)
    return sendSuccess(res, data, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function patientLinkedTherapists(req, res, next) {
  try {
    const data = await getLinkedTherapistsForPatient(req.user.id)
    return sendSuccess(res, data, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function getReminderPreferences(req, res, next) {
  try {
    const patient = await Patient.findOne({ userId: req.user.id })
    const preferences = patient?.reminderPreferences || {
      email24h: true,
      email10h: true,
      email5h: true,
      email3h: true,
      email2h: true,
      masterEnabled: true,
    }
    const timezone = patient?.timezone || 'UTC'
    return sendSuccess(res, { reminderPreferences: preferences, timezone }, 'Preferences retrieved successfully', 200)
  } catch (e) {
    next(e)
  }
}

export async function updateReminderPreferences(req, res, next) {
  try {
    const { reminderPreferences, timezone } = req.body

    const patient = await Patient.findOneAndUpdate(
      { userId: req.user.id },
      {
        $set: {
          ...(reminderPreferences ? { reminderPreferences } : {}),
          ...(timezone ? { timezone } : {}),
        }
      },
      { new: true, upsert: true }
    )

    return sendSuccess(res, {
      reminderPreferences: patient.reminderPreferences,
      timezone: patient.timezone,
    }, 'Preferences updated successfully', 200)
  } catch (e) {
    next(e)
  }
}
