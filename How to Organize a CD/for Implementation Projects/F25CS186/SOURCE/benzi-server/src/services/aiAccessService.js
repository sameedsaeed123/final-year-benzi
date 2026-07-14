import { Patient } from '../models/Patient.js'
import { Appointment } from '../models/Appointment.js'
import { isPatientLinkedToTherapist } from './patientService.js'

export async function assertTherapistCanAccessPatient(therapistUserId, patientUserId) {
  const patient = await Patient.findOne({ userId: patientUserId }).lean()
  if (isPatientLinkedToTherapist(patient, therapistUserId)) {
    return true
  }
  const appt = await Appointment.findOne({
    therapistUserId,
    patientUserId,
  }).lean()
  if (appt) return true

  const err = new Error('You do not have access to this patient')
  err.statusCode = 403
  throw err
}

/** Active link required — e.g. assign new goals */
export async function assertTherapistActivelyLinkedToPatient(therapistUserId, patientUserId) {
  const patient = await Patient.findOne({ userId: patientUserId }).lean()
  if (isPatientLinkedToTherapist(patient, therapistUserId)) {
    return true
  }
  const err = new Error('Patient is not actively linked to you')
  err.statusCode = 403
  throw err
}

export function resolvePatientUserId(req) {
  const paramId = req.params.patientUserId
  if (req.user.role === 'patient') {
    return req.user.id
  }
  if (paramId) return paramId
  const err = new Error('patientUserId is required')
  err.statusCode = 400
  throw err
}

/** Primary therapist for patient goal proposals */
export async function resolveTherapistForPatient(patientUserId) {
  const patient = await Patient.findOne({ userId: patientUserId })
    .select('assignedTherapistUserId therapistLinks')
    .lean()
  if (patient?.assignedTherapistUserId && isPatientLinkedToTherapist(patient, patient.assignedTherapistUserId)) {
    return String(patient.assignedTherapistUserId)
  }
  const activeLink = (patient?.therapistLinks || []).find((l) => !l.unlinkedAt)
  if (activeLink?.therapistUserId) return String(activeLink.therapistUserId)
  const appt = await Appointment.findOne({ patientUserId })
    .sort({ date: -1 })
    .lean()
  if (appt?.therapistUserId) return String(appt.therapistUserId)
  return null
}
