import mongoose from 'mongoose'
import { Appointment } from '../models/Appointment.js'
import { User } from '../models/User.js'
import { Service } from '../models/Service.js'
import { linkPatientToTherapistIfEmpty } from './patientService.js'
import { Patient } from '../models/Patient.js'

const STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']
const LOCATIONS = ['online', 'office', 'clinic']
const PAYMENT_METHODS = ['online', 'onsite']
const PAYMENT_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED']

export async function createAppointmentByPatient(patientUserId, payload) {
  const therapistUserId = payload.therapistUserId
  if (!mongoose.Types.ObjectId.isValid(therapistUserId)) {
    const err = new Error('Invalid therapist')
    err.statusCode = 400
    throw err
  }
  const therapist = await User.findById(therapistUserId).select('role').lean()
  if (!therapist || therapist.role !== 'therapist') {
    const err = new Error('Therapist not found')
    err.statusCode = 404
    throw err
  }

  let serviceId = null
  const rawSid = payload.serviceId
  if (rawSid != null && String(rawSid).trim() !== '' && mongoose.Types.ObjectId.isValid(String(rawSid))) {
    const svc = await Service.findOne({
      _id: rawSid,
      therapistUserId,
      isActive: true,
    }).lean()
    if (!svc) {
      const err = new Error('Service not found for this therapist')
      err.statusCode = 400
      throw err
    }
    serviceId = svc._id
  }

  const date = new Date(payload.date)
  if (Number.isNaN(date.getTime())) {
    const err = new Error('Invalid date')
    err.statusCode = 400
    throw err
  }

  const durationMinutes = Math.max(15, Math.min(240, Number(payload.durationMinutes) || 60))
  const location = LOCATIONS.includes(payload.location) ? payload.location : 'online'
  const paymentMethod = PAYMENT_METHODS.includes(payload.paymentMethod) ? payload.paymentMethod : 'onsite'
  const paymentScreenshotUrl = String(payload.paymentScreenshotUrl || '').trim()

  if (paymentMethod === 'online' && !paymentScreenshotUrl) {
    const err = new Error('Payment screenshot is required for online payments')
    err.statusCode = 400
    throw err
  }

  const patient = await Patient.findOne({ userId: patientUserId }).select('assignedTherapistUserId').lean()
  if (patient?.assignedTherapistUserId && String(patient.assignedTherapistUserId) !== String(therapistUserId)) {
    const err = new Error('You can only book appointments with your assigned therapist')
    err.statusCode = 403
    throw err
  }

  const start = new Date(date)
  const end = new Date(start.getTime() + durationMinutes * 60 * 1000)
  const dayStart = new Date(start)
  dayStart.setHours(0, 0, 0, 0)
  const dayEnd = new Date(start)
  dayEnd.setHours(23, 59, 59, 999)

  const existing = await Appointment.find({
    therapistUserId,
    status: { $in: ['PENDING', 'CONFIRMED'] },
    date: { $gte: dayStart, $lte: dayEnd },
  })
    .select('date durationMinutes')
    .lean()

  const hasConflict = existing.some((a) => {
    const s = new Date(a.date)
    const e = new Date(s.getTime() + (a.durationMinutes || 60) * 60 * 1000)
    return s < end && e > start
  })

  if (hasConflict) {
    const err = new Error('Selected time slot is no longer available')
    err.statusCode = 409
    throw err
  }

  const doc = await Appointment.create({
    patientUserId,
    therapistUserId,
    serviceId,
    date,
    durationMinutes,
    location,
    status: 'PENDING',
    paymentMethod,
    paymentScreenshotUrl,
    paymentStatus: PAYMENT_STATUSES.includes('PENDING') ? 'PENDING' : 'PENDING',
  })

  await linkPatientToTherapistIfEmpty(patientUserId, therapistUserId)

  return doc.toObject()
}

export async function updateAppointmentByTherapist(appointmentId, therapistUserId, body) {
  if (!mongoose.Types.ObjectId.isValid(appointmentId)) {
    const err = new Error('Invalid appointment id')
    err.statusCode = 400
    throw err
  }
  const doc = await Appointment.findOne({ _id: appointmentId, therapistUserId })
  if (!doc) {
    const err = new Error('Appointment not found')
    err.statusCode = 404
    throw err
  }
  if (body.status !== undefined) {
    if (!STATUSES.includes(body.status)) {
      const err = new Error('Invalid status')
      err.statusCode = 400
      throw err
    }
    doc.status = body.status
  }
  if (body.paymentStatus !== undefined) {
    if (!PAYMENT_STATUSES.includes(body.paymentStatus)) {
      const err = new Error('Invalid payment status')
      err.statusCode = 400
      throw err
    }
    doc.paymentStatus = body.paymentStatus
  }
  await doc.save()
  return doc.toObject()
}
