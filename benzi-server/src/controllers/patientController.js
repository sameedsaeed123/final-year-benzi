import { sendSuccess } from '../utils/responseUtils.js'
import { getPatientDashboard } from '../services/patientDashboardService.js'
import { getLinkedTherapistForPatient } from '../services/patientService.js'

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
