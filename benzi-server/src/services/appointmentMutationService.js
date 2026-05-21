import mongoose from 'mongoose'
import { Appointment } from '../models/Appointment.js'
import { User } from '../models/User.js'
import { Service } from '../models/Service.js'
import { linkPatientToTherapistIfEmpty } from './patientService.js'
import { Patient } from '../models/Patient.js'
import { sendAppointmentConfirmation, sendAppointmentPaymentUpdate, sendTherapistAppointmentNotification, sendAppointmentStatusUpdate } from './emailService.js'
import { ensureMeetLinkForAppointment } from './googleCalendarService.js'

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

  // Service is now REQUIRED
  const rawSid = payload.serviceId
  if (!rawSid || String(rawSid).trim() === '' || !mongoose.Types.ObjectId.isValid(String(rawSid))) {
    const err = new Error('Service selection is required')
    err.statusCode = 400
    throw err
  }

  const service = await Service.findOne({
    _id: rawSid,
    therapistUserId,
    isActive: true,
  }).lean()
  
  if (!service) {
    const err = new Error('Service not found for this therapist')
    err.statusCode = 400
    throw err
  }

  const date = new Date(payload.date)
  if (Number.isNaN(date.getTime())) {
    const err = new Error('Invalid date')
    err.statusCode = 400
    throw err
  }

  // Enforce that the slot has not passed in Pakistan Time (UTC+5)
  const dateStr = String(payload.date || '')
  if (dateStr) {
    const match = /^(\d{4}-\d{2}-\d{2})T(\d{2}:\d{2})/.exec(dateStr)
    if (match) {
      const [, ymd, hm] = match
      const slotTimePKT = new Date(`${ymd}T${hm}:00+05:00`)
      if (slotTimePKT.getTime() <= Date.now()) {
        const err = new Error('Selected time slot has already passed')
        err.statusCode = 400
        throw err
      }
    }
  }

  const durationMinutes = service.durationMinutes || 60
  const location = LOCATIONS.includes(payload.location) ? payload.location : 'online'
  const paymentMethod = PAYMENT_METHODS.includes(payload.paymentMethod) ? payload.paymentMethod : 'onsite'
  const paymentScreenshotUrl = String(payload.paymentScreenshotUrl || '').trim()

  if (paymentMethod === 'online' && !paymentScreenshotUrl) {
    const err = new Error('Payment screenshot is required for online payments')
    err.statusCode = 400
    throw err
  }

  const patient = await Patient.findOne({ userId: patientUserId })
    .select('assignedTherapistUserId anonymousModeEnabled anonymousAlias')
    .lean()
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

  const bookedAsAnonymous = Boolean(patient?.anonymousModeEnabled)
  const patientMeetDisplayName = bookedAsAnonymous
    ? (patient?.anonymousAlias?.trim() || `Patient #${String(patientUserId).slice(-4).toUpperCase()}`)
    : ''

  const doc = await Appointment.create({
    patientUserId,
    therapistUserId,
    serviceId: service._id,
    serviceName: service.name,
    servicePriceAtBooking: service.pricePerSession || 0,
    date,
    durationMinutes,
    location,
    status: 'PENDING',
    paymentMethod,
    paymentScreenshotUrl,
    paymentStatus: 'PENDING',
    bookedAsAnonymous,
    patientMeetDisplayName,
  })

  await linkPatientToTherapistIfEmpty(patientUserId, therapistUserId)

  try {
    if (doc.location === 'online') {
      await ensureMeetLinkForAppointment(doc)
    }
  } catch (err) {
    console.error('[GoogleCalendar] Meet link creation failed:', err.message, err.response?.data || err.errors || '')
  }

  // Send confirmation email to patient
  try {
    const patientUser = await User.findById(patientUserId).select('email firstName lastName').lean()
    const therapistUser = await User.findById(therapistUserId).select('email firstName lastName').lean()
    if (patientUser && therapistUser) {
      const formattedDate = date.toLocaleDateString('en-US', {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      })
      const formattedTime = date.toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      })
      const appointmentUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/appointments/${doc._id}`

      // Send to Patient
      void sendAppointmentConfirmation(
        patientUser.email,
        `${patientUser.firstName} ${patientUser.lastName}`,
        `Dr. ${therapistUser.firstName} ${therapistUser.lastName}`,
        formattedDate,
        formattedTime,
        doc.status,
        doc.location,
        doc.servicePriceAtBooking,
        doc.paymentMethod,
        appointmentUrl,
        doc.meetLink || '',
        doc.bookedAsAnonymous,
        doc.patientMeetDisplayName || ''
      )

      // Send to Therapist (Notification of new booking)
      const therapistAppUrl = `${process.env.THERAPIST_PORTAL_URL || 'http://localhost:3000'}/therapist/appointments`
      const therapistPatientLabel = doc.bookedAsAnonymous
        ? 'Anonymous patient'
        : `${patientUser.firstName} ${patientUser.lastName}`
      const therapistVideoLink = doc.bookedAsAnonymous
        ? doc.therapistMeetLink || doc.meetLink || ''
        : doc.meetLink || ''
      void sendTherapistAppointmentNotification(
        therapistUser.email,
        `Dr. ${therapistUser.firstName} ${therapistUser.lastName}`,
        therapistPatientLabel,
        formattedDate,
        formattedTime,
        doc.location,
        doc.servicePriceAtBooking,
        doc.paymentMethod,
        therapistAppUrl,
        therapistVideoLink,
        doc.bookedAsAnonymous
      )
    }
  } catch (err) {
    console.error('[EmailService] Appointment booking notification email error:', err.message)
  }

  return doc.toObject()
}

export async function updateAppointmentByTherapist(appointmentId, therapistUserId, body) {
  // Support both full 24-char ObjectId and the 8-char display id
  let doc = null
  if (mongoose.Types.ObjectId.isValid(appointmentId)) {
    doc = await Appointment.findOne({ _id: appointmentId, therapistUserId })
  } else {
    // Resolve 8-char display id → full document
    const all = await Appointment.find({ therapistUserId }).select('_id').lean()
    const match = all.find((a) => String(a._id).slice(-8).toUpperCase() === String(appointmentId).toUpperCase())
    if (match) {
      doc = await Appointment.findOne({ _id: match._id, therapistUserId })
    }
  }

  if (!doc) {
    const err = new Error('Appointment not found')
    err.statusCode = 404
    throw err
  }
  const originalStatus = doc.status
  const originalPaymentStatus = doc.paymentStatus
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

  // Generate Meet link when confirming online session (or if link missing)
  try {
    if (doc.location === 'online') {
      const hasOldGoogleAnonymous =
        doc.meetLink &&
        doc.bookedAsAnonymous &&
        (doc.videoProvider !== 'jitsi' || String(doc.meetLink).includes('meet.google.com'))
      if (hasOldGoogleAnonymous) {
        doc.meetLink = ''
        doc.therapistMeetLink = ''
      }
      if (!doc.meetLink || (doc.bookedAsAnonymous && !doc.therapistMeetLink)) {
        await ensureMeetLinkForAppointment(doc)
      }
    }
  } catch (err) {
    console.error('[GoogleCalendar] Meet link on update failed:', err.message, err.response?.data || err.errors || '')
  }

  await doc.save()

  // Send status update email if either appointment status or payment status changed
  const statusChanged = body.status !== undefined && body.status !== originalStatus
  const paymentStatusChanged = body.paymentStatus !== undefined && body.paymentStatus !== originalPaymentStatus

  if (statusChanged || paymentStatusChanged) {
    try {
      const patientUser = await User.findById(doc.patientUserId).select('email firstName lastName').lean()
      const therapistUser = await User.findById(doc.therapistUserId).select('firstName lastName').lean()
      if (patientUser && therapistUser) {
        const formattedDate = new Date(doc.date).toLocaleDateString('en-US', {
          weekday: 'long',
          year: 'numeric',
          month: 'long',
          day: 'numeric',
        })
        const formattedTime = new Date(doc.date).toLocaleTimeString('en-US', {
          hour: '2-digit',
          minute: '2-digit',
        })
        const appointmentUrl = `${process.env.FRONTEND_URL || 'http://localhost:3000'}/appointments/${doc._id}`

        void sendAppointmentStatusUpdate(
          patientUser.email,
          `${patientUser.firstName} ${patientUser.lastName}`,
          `Dr. ${therapistUser.firstName} ${therapistUser.lastName}`,
          formattedDate,
          formattedTime,
          doc.status,
          doc.paymentStatus,
          doc.servicePriceAtBooking,
          appointmentUrl,
          doc.meetLink || '',
          doc.bookedAsAnonymous,
          doc.patientMeetDisplayName || ''
        )
      }
    } catch (err) {
      console.error('[EmailService] Appointment status update email error:', err.message)
    }
  }

  return doc.toObject()
}
