import { sendSuccess, sendError } from '../utils/responseUtils.js'
import { listAppointmentsForPatient, listAppointmentsForTherapist, getTherapistAvailabilitySlots, getAppointmentDetail, getTherapistAppointmentDates } from '../services/appointmentService.js'
import { processAppointmentCompletions } from '../services/appointmentCompletionService.js'
import { createAppointmentByPatient, updateAppointmentByTherapist } from '../services/appointmentMutationService.js'
import { Appointment } from '../models/Appointment.js'
import { ensureMeetLinkForAppointment } from '../services/googleCalendarService.js'
import mongoose from 'mongoose'
import { createAppointmentSchema, patchAppointmentSchema, availabilityQuerySchema } from '../validators/appointmentValidators.js'
import { parsePaginationQuery } from '../utils/pagination.js'

export async function patientAppointments(req, res, next) {
  try {
    await processAppointmentCompletions()
    const { page, limit } = parsePaginationQuery(req.query)
    const result = await listAppointmentsForPatient(req.user.id, { page, limit })
    return sendSuccess(res, result, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function therapistAppointments(req, res, next) {
  try {
    await processAppointmentCompletions()
    const { page, limit } = parsePaginationQuery(req.query)
    const result = await listAppointmentsForTherapist(req.user.id, { page, limit })
    return sendSuccess(res, result, 'OK', 200)
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

export async function regenerateAppointmentVideo(req, res, next) {
  try {
    const appointmentId = req.params.id
    let doc = null
    if (mongoose.Types.ObjectId.isValid(appointmentId)) {
      doc = await Appointment.findById(appointmentId)
    } else {
      const all = await Appointment.find({}).select('_id')
      const match = all.find((a) => String(a._id).slice(-8).toUpperCase() === appointmentId.toUpperCase())
      if (match) doc = await Appointment.findById(match._id)
    }
    if (!doc) return sendError(res, 'Appointment not found', 404)
    if (req.user.role === 'patient' && String(doc.patientUserId) !== String(req.user.id)) {
      return sendError(res, 'Forbidden', 403)
    }
    if (req.user.role === 'therapist' && String(doc.therapistUserId) !== String(req.user.id)) {
      return sendError(res, 'Forbidden', 403)
    }
    if (doc.location !== 'online') return sendError(res, 'Not an online appointment', 400)

    doc.meetLink = ''
    doc.therapistMeetLink = ''
    await ensureMeetLinkForAppointment(doc)

    const isTherapist = req.user.role === 'therapist'
    const isAnon = Boolean(doc.bookedAsAnonymous)
    return sendSuccess(
      res,
      {
        meetLink: isTherapist && isAnon ? doc.therapistMeetLink || doc.meetLink || '' : doc.meetLink || '',
        therapistMeetLink: doc.therapistMeetLink || '',
        videoProvider: doc.videoProvider || 'google',
        bookedAsAnonymous: isAnon,
      },
      'OK',
      200
    )
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function getAppointmentById(req, res, next) {
  try {
    await processAppointmentCompletions()
    const data = await getAppointmentDetail(req.params.id, req.user.id, req.user.role)
    return sendSuccess(res, data, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function therapistCalendarDates(req, res, next) {
  try {
    const { year, month } = req.query
    const data = await getTherapistAppointmentDates(req.user.id, Number(year), Number(month))
    return sendSuccess(res, data, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}
