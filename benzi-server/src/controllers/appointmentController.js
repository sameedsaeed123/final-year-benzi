import { sendSuccess, sendError } from '../utils/responseUtils.js'
import { listAppointmentsForPatient, listAppointmentsForTherapist, getTherapistAvailabilitySlots } from '../services/appointmentService.js'
import { createAppointmentByPatient, updateAppointmentByTherapist } from '../services/appointmentMutationService.js'
import { createAppointmentSchema, patchAppointmentSchema, availabilityQuerySchema } from '../validators/appointmentValidators.js'
import { getLinkedTherapistForPatient } from '../services/patientService.js'

export async function patientAppointments(req, res, next) {
  try {
    const rows = await listAppointmentsForPatient(req.user.id)
    return sendSuccess(res, { appointments: rows, total: rows.length }, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function therapistAppointments(req, res, next) {
  try {
    const rows = await listAppointmentsForTherapist(req.user.id)
    return sendSuccess(res, { appointments: rows, total: rows.length }, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function patientCreateAppointment(req, res, next) {
  try {
    const { error, value } = createAppointmentSchema.validate(req.body, { abortEarly: false, stripUnknown: true })
    if (error) {
      return sendError(res, 'Validation failed', 400, error.details.map((d) => ({ field: d.path.join('.'), message: d.message })))
    }
    const screenshotUrl = req.file ? `/api/files/payments/${req.file.filename}` : ''
    const raw = await createAppointmentByPatient(req.user.id, {
      therapistUserId: value.therapistUserId,
      serviceId: value.serviceId || null,
      date: value.date,
      durationMinutes: value.durationMinutes,
      location: value.location,
      paymentMethod: value.paymentMethod || 'onsite',
      paymentScreenshotUrl: screenshotUrl,
    })
    return sendSuccess(
      res,
      {
        id: String(raw._id),
        therapistUserId: String(raw.therapistUserId),
        date: raw.date,
        status: raw.status,
        paymentMethod: raw.paymentMethod,
        paymentStatus: raw.paymentStatus,
        paymentScreenshotUrl: raw.paymentScreenshotUrl || '',
      },
      'Created',
      201
    )
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function therapistPatchAppointment(req, res, next) {
  try {
    const { error, value } = patchAppointmentSchema.validate(req.body, { abortEarly: false, stripUnknown: true })
    if (error) {
      return sendError(res, 'Validation failed', 400, error.details.map((d) => ({ field: d.path.join('.'), message: d.message })))
    }
    const raw = await updateAppointmentByTherapist(req.params.id, req.user.id, value)
    return sendSuccess(res, { id: String(raw._id), status: raw.status, paymentStatus: raw.paymentStatus }, 'Updated', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function therapistAvailabilitySlots(req, res, next) {
  try {
    const { error, value } = availabilityQuerySchema.validate(req.query || {}, { abortEarly: false, stripUnknown: true })
    if (error) {
      return sendError(res, 'Validation failed', 400, error.details.map((d) => ({ field: d.path.join('.'), message: d.message })))
    }
    const linked = await getLinkedTherapistForPatient(req.user.id)
    if (linked?.linked && String(linked.therapist?.id) !== String(req.params.therapistUserId)) {
      return sendError(res, 'You can only view availability for your assigned therapist', 403)
    }
    const data = await getTherapistAvailabilitySlots({
      therapistUserId: req.params.therapistUserId,
      date: value.date,
      durationMinutes: value.durationMinutes || 60,
    })
    return sendSuccess(res, data, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}
