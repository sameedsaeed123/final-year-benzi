import { Appointment } from '../models/Appointment.js'

export async function assertChatAllowed(therapistUserId, patientUserId) {
  const appt = await Appointment.findOne({
    therapistUserId,
    patientUserId,
    status: { $in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
  }).select('_id').lean()
  if (!appt) {
    const err = new Error('Chat not allowed — no appointment relationship')
    err.statusCode = 403
    throw err
  }
}
