import { Appointment } from '../models/Appointment.js'
import { Patient } from '../models/Patient.js'
import { isPatientLinkedToTherapist } from './patientService.js'

export async function assertChatAllowed(therapistUserId, patientUserId) {
  const appt = await Appointment.findOne({
    therapistUserId,
    patientUserId,
    status: { $in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
  })
    .select('_id')
    .lean()
  if (appt) return

  const patient = await Patient.findOne({ userId: patientUserId })
    .select('therapistLinks assignedTherapistUserId')
    .lean()
  if (isPatientLinkedToTherapist(patient, therapistUserId)) return

  const err = new Error('Chat not allowed — no appointment relationship')
  err.statusCode = 403
  throw err
}
