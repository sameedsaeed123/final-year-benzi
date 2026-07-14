import { Appointment } from '../models/Appointment.js'
import { User } from '../models/User.js'
import { Therapist } from '../models/Therapist.js'
import { Patient } from '../models/Patient.js'
import { DEFAULT_LIST_PAGE_SIZE } from '../utils/pagination.js'

function statusUi(s) {
  const m = { PENDING: 'Pending', CONFIRMED: 'Confirmed', COMPLETED: 'Completed', CANCELLED: 'Cancelled' }
    return m[s] || s
}

function paymentStatusUi(s) {
  const m = { PENDING: 'Pending', VERIFIED: 'Verified', REJECTED: 'Rejected' }
  return m[s] || s
}

function locationUi(loc) {
  const m = { online: 'Video Call', office: 'Office', clinic: 'Hospital' }
  return m[loc] || loc
}

function formatDateTime(d) {
  const dt = new Date(d)
  return dt.toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function timeToMinutes(t) {
  const [h, m] = t.split(':').map((n) => Number(n))
  return h * 60 + m
}

function minutesToTime(total) {
  const h = Math.floor(total / 60)
  const m = total % 60
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`
}

function buildSlotsForRange(start, end, durationMinutes) {
  const startMin = timeToMinutes(start)
  const endMin = timeToMinutes(end)
  if (!Number.isFinite(startMin) || !Number.isFinite(endMin) || endMin <= startMin) return []

  const slots = []
  const lastStart = endMin - durationMinutes
  for (let cur = startMin; cur <= lastStart; cur += durationMinutes) {
    slots.push({ start: minutesToTime(cur), end: minutesToTime(cur + durationMinutes) })
  }
  return slots
}

function overlaps(aStart, aEnd, bStart, bEnd) {
  return aStart < bEnd && aEnd > bStart
}

// ─── Fetch anonymous status map for a list of patient user IDs ───────────────
async function getAnonymousMap(patientUserIds) {
  if (!patientUserIds.length) return {}
  const records = await Patient.find({ userId: { $in: patientUserIds } })
    .select('userId anonymousModeEnabled anonymousAlias')
    .lean()
  return Object.fromEntries(
    records.map((p) => [
      String(p.userId),
      {
        isAnonymous: p.anonymousModeEnabled || false,
        alias: p.anonymousAlias || `Patient #${String(p.userId).slice(-4).toUpperCase()}`,
      },
    ])
  )
}

function paginationMeta(page, limit, total) {
  return {
    page,
    limit,
    total,
    totalPages: Math.max(1, Math.ceil(total / limit) || 1),
  }
}

export async function listAppointmentsForPatient(patientUserId, { page = 1, limit = DEFAULT_LIST_PAGE_SIZE } = {}) {
  const skip = (page - 1) * limit
  const filter = { patientUserId }
  const [list, total] = await Promise.all([
    Appointment.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
    Appointment.countDocuments(filter),
  ])

  const therapistIds = [...new Set(list.map((a) => String(a.therapistUserId)))]
  const therapists = await User.find({ _id: { $in: therapistIds } })
    .select('firstName lastName')
    .lean()
  // fetch therapist extensions to read location label overrides
  const therapistExt = await Therapist.find({ userId: { $in: therapistIds } })
    .select('userId availableLocationLabels availableLocations')
    .lean()
  const extByUser = Object.fromEntries((therapistExt || []).map((t) => [String(t.userId), t]))
  const nameById = Object.fromEntries(
    therapists.map((t) => [
      String(t._id),
      `${t.firstName || ''} ${t.lastName || ''}`.trim() || 'Therapist',
    ])
  )
  const appointments = list.map((a) => ({
    id: String(a._id).slice(-8).toUpperCase(),
    therapist: nameById[String(a.therapistUserId)] || 'Therapist',
    dateTime: formatDateTime(a.date),
    duration: `${a.durationMinutes} min`,
    paymentMethod: a.paymentMethod || 'onsite',
    paymentStatus: paymentStatusUi(a.paymentStatus),
    paymentScreenshotUrl: a.paymentScreenshotUrl || '',
    location: (() => {
      const ext = extByUser[String(a.therapistUserId)]
      if (ext && ext.availableLocationLabels && typeof ext.availableLocationLabels === 'object') {
        const label = ext.availableLocationLabels[a.location]
        if (label) return label
      }
      return locationUi(a.location)
    })(),
    status: statusUi(a.status),
    statusCode: a.status,
    locationCode: a.location,
    meetLink: a.meetLink || '',
    bookedAsAnonymous: Boolean(a.bookedAsAnonymous),
    meetJoinAlias: a.patientMeetDisplayName || '',
    videoProvider: a.videoProvider || 'google',
    action: a.meetLink ? 'meet' : 'mail',
  }))
  return {
    appointments,
    ...paginationMeta(page, limit, total),
  }
}

export async function listAppointmentsForTherapist(therapistUserId, { page = 1, limit = DEFAULT_LIST_PAGE_SIZE } = {}) {
  const skip = (page - 1) * limit
  const filter = { therapistUserId }
  const [list, total] = await Promise.all([
    Appointment.find(filter).sort({ date: -1 }).skip(skip).limit(limit).lean(),
    Appointment.countDocuments(filter),
  ])

  const patientIds = [...new Set(list.map((a) => String(a.patientUserId)))]
  const patients = await User.find({ _id: { $in: patientIds } })
    .select('firstName lastName')
    .lean()
  const nameById = Object.fromEntries(
    patients.map((p) => [
      String(p._id),
      `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Patient',
    ])
  )

  // Anonymous masking
  const anonMap = await getAnonymousMap(patientIds)

  const therapistExt = await Therapist.findOne({ userId: therapistUserId })
    .select('availableLocationLabels availableLocations')
    .lean()

  const rows = list.map((a) => {
    const pid = String(a.patientUserId)
    const anon = anonMap[pid] || { isAnonymous: false, alias: 'Patient' }
    const isAnonSession = Boolean(a.bookedAsAnonymous || anon.isAnonymous)

    const priceFormatted = a.servicePriceAtBooking
      ? `PKR ${Math.round(a.servicePriceAtBooking / 100)}`
      : 'N/A'

    return {
      id: String(a._id).slice(-8).toUpperCase(),
      patient: isAnonSession ? 'Anonymous patient' : (nameById[pid] || 'Patient'),
      isAnonymous: isAnonSession,
      serviceName: a.serviceName || 'General Session',
      servicePrice: priceFormatted,
      servicePriceRaw: a.servicePriceAtBooking || 0,
      dateTime: formatDateTime(a.date),
      duration: `${a.durationMinutes} min`,
      paymentMethod: a.paymentMethod || 'onsite',
      paymentStatus: a.paymentStatus || 'PENDING',
      paymentStatusLabel: paymentStatusUi(a.paymentStatus),
      paymentScreenshotUrl: a.paymentScreenshotUrl || '',
      location: (() => {
        if (therapistExt && therapistExt.availableLocationLabels && typeof therapistExt.availableLocationLabels === 'object') {
          const label = therapistExt.availableLocationLabels[a.location]
          if (label) return label
        }
        return locationUi(a.location)
      })(),
      status: statusUi(a.status),
      statusCode: a.status,
      locationCode: a.location,
      meetLink: isAnonSession ? (a.therapistMeetLink || a.meetLink || '') : (a.meetLink || ''),
      bookedAsAnonymous: Boolean(a.bookedAsAnonymous),
      videoProvider: a.videoProvider || 'google',
      action: a.meetLink ? 'meet' : 'mail',
    }
  })
  return {
    appointments: rows,
    ...paginationMeta(page, limit, total),
  }
}

export async function listAppointmentsForAdmin({ page = 1, limit = DEFAULT_LIST_PAGE_SIZE } = {}) {
  const skip = (page - 1) * limit
  const [list, total] = await Promise.all([
    Appointment.find({}).sort({ date: -1 }).skip(skip).limit(limit).lean(),
    Appointment.countDocuments({}),
  ])

  const patientIds = [...new Set(list.map((a) => String(a.patientUserId)))]
  const therapistIds = [...new Set(list.map((a) => String(a.therapistUserId)))]

  const [patients, therapists] = await Promise.all([
    User.find({ _id: { $in: patientIds } }).select('firstName lastName email').lean(),
    User.find({ _id: { $in: therapistIds } }).select('firstName lastName email').lean(),
  ])

  const patientNameById = Object.fromEntries(
    patients.map((p) => [String(p._id), `${p.firstName || ''} ${p.lastName || ''}`.trim() || 'Patient'])
  )
  const therapistNameById = Object.fromEntries(
    therapists.map((t) => [String(t._id), `Dr. ${t.firstName || ''} ${t.lastName || ''}`.trim() || 'Therapist'])
  )

  const appointments = list.map((a) => ({
    id: String(a._id).slice(-8).toUpperCase(),
    fullId: String(a._id),
    patient: patientNameById[String(a.patientUserId)] || 'Patient',
    therapist: therapistNameById[String(a.therapistUserId)] || 'Therapist',
    serviceName: a.serviceName || 'Session',
    dateTime: formatDateTime(a.date),
    duration: `${a.durationMinutes} min`,
    location: locationUi(a.location),
    locationCode: a.location,
    status: statusUi(a.status),
    statusCode: a.status,
    paymentStatus: paymentStatusUi(a.paymentStatus),
    meetLink: a.meetLink || '',
  }))
  return {
    appointments,
    ...paginationMeta(page, limit, total),
  }
}

export async function getTherapistAvailabilitySlots({ therapistUserId, date, durationMinutes = 60 }) {
  const therapist = await Therapist.findOne({ userId: therapistUserId })
    .select('weeklyAvailability')
    .lean()

  const availability = therapist?.weeklyAvailability && typeof therapist.weeklyAvailability === 'object'
    ? therapist.weeklyAvailability
    : {}

  const dt = new Date(`${date}T00:00:00`)
  if (Number.isNaN(dt.getTime())) {
    const err = new Error('Invalid date')
    err.statusCode = 400
    throw err
  }

  const dayKeys = ['sun', 'mon', 'tue', 'wed', 'thu', 'fri', 'sat']
  const dayKey = dayKeys[dt.getDay()]
  const daySlots = Array.isArray(availability[dayKey]) ? availability[dayKey] : []

  if (!daySlots.length) {
    return { date, durationMinutes, slots: [] }
  }

  const dayStart = new Date(`${date}T00:00:00`)
  const dayEnd = new Date(`${date}T23:59:59`)
  const booked = await Appointment.find({
    therapistUserId,
    status: { $in: ['PENDING', 'CONFIRMED'] },
    date: { $gte: dayStart, $lte: dayEnd },
  })
    .select('date durationMinutes')
    .lean()

  const bookedRanges = booked.map((a) => {
    const ad = new Date(a.date)
    const start = ad.getHours() * 60 + ad.getMinutes()
    const end = start + (a.durationMinutes || 60)
    return { start, end }
  })

  const candidateSlots = daySlots.flatMap((s) => buildSlotsForRange(s.start, s.end, durationMinutes))

  const available = candidateSlots.filter((slot) => {
    // Check if the slot has already passed in Pakistan time (UTC+5)
    const slotDateTime = new Date(`${date}T${slot.start}:00+05:00`)
    if (slotDateTime.getTime() <= Date.now()) {
      return false
    }

    const start = timeToMinutes(slot.start)
    const end = timeToMinutes(slot.end)
    return !bookedRanges.some((b) => overlaps(start, end, b.start, b.end))
  })

  return { date, durationMinutes, slots: available }
}

export async function getAppointmentDetail(appointmentId, requestingUserId, requestingRole) {
  if (!appointmentId || appointmentId.length < 8) {
    const err = new Error('Invalid appointment id')
    err.statusCode = 400
    throw err
  }

  // Support both full ObjectId and the 8-char display id
  let doc = null
  const mongoose = (await import('mongoose')).default
  if (mongoose.Types.ObjectId.isValid(appointmentId)) {
    doc = await Appointment.findById(appointmentId).lean()
  } else {
    // search by last 8 chars of _id (display id)
    const all = await Appointment.find({}).select('_id').lean()
    const match = all.find((a) => String(a._id).slice(-8).toUpperCase() === appointmentId.toUpperCase())
    if (match) doc = await Appointment.findById(match._id).lean()
  }

  if (!doc) {
    const err = new Error('Appointment not found')
    err.statusCode = 404
    throw err
  }

  // RBAC: patient can only see own, therapist can only see own
  if (requestingRole === 'patient' && String(doc.patientUserId) !== String(requestingUserId)) {
    const err = new Error('Forbidden')
    err.statusCode = 403
    throw err
  }
  if (requestingRole === 'therapist' && String(doc.therapistUserId) !== String(requestingUserId)) {
    const err = new Error('Forbidden')
    err.statusCode = 403
    throw err
  }

  const [patientUser, therapistUser] = await Promise.all([
    User.findById(doc.patientUserId).select('firstName lastName email phone').lean(),
    User.findById(doc.therapistUserId).select('firstName lastName email').lean(),
  ])

  // Check anonymous mode — mask patient identity from therapist
  let patientName = patientUser ? `${patientUser.firstName || ''} ${patientUser.lastName || ''}`.trim() : 'Patient'
  let patientEmail = patientUser?.email || ''
  let patientPhone = patientUser?.phone || ''

  if (requestingRole === 'therapist') {
    if (doc.bookedAsAnonymous) {
      patientName = 'Anonymous patient'
      patientEmail = ''
      patientPhone = ''
    } else {
      const anonRecord = await Patient.findOne({ userId: doc.patientUserId })
        .select('anonymousModeEnabled anonymousAlias')
        .lean()
      if (anonRecord?.anonymousModeEnabled) {
        patientName = 'Anonymous patient'
        patientEmail = ''
        patientPhone = ''
      }
    }
  }

  return {
    id: String(doc._id).slice(-8).toUpperCase(),
    fullId: String(doc._id),
    patient: patientName,
    patientEmail,
    patientPhone,
    therapist: therapistUser ? `${therapistUser.firstName || ''} ${therapistUser.lastName || ''}`.trim() : 'Therapist',
    therapistEmail: therapistUser?.email || '',
    dateTime: formatDateTime(doc.date),
    rawDate: doc.date,
    duration: `${doc.durationMinutes} min`,
    durationMinutes: doc.durationMinutes,
    location: locationUi(doc.location),
    locationCode: doc.location,
    status: statusUi(doc.status),
    statusCode: doc.status,
    paymentMethod: doc.paymentMethod || 'onsite',
    paymentStatus: paymentStatusUi(doc.paymentStatus),
    paymentStatusCode: doc.paymentStatus,
    paymentScreenshotUrl: doc.paymentScreenshotUrl || '',
    meetLink:
      requestingRole === 'therapist' && doc.bookedAsAnonymous
        ? doc.therapistMeetLink || doc.meetLink || ''
        : doc.meetLink || '',
    bookedAsAnonymous: Boolean(doc.bookedAsAnonymous),
    videoProvider: doc.videoProvider || 'google',
    createdAt: doc.createdAt,
  }
}

export async function getTherapistAppointmentDates(therapistUserId, year, month) {
  // month is 1-based (1=Jan, 12=Dec)
  if (!year || !month || month < 1 || month > 12) {
    const now = new Date()
    year = now.getFullYear()
    month = now.getMonth() + 1
  }
  const start = new Date(year, month - 1, 1)
  const end = new Date(year, month, 1)

  const appointments = await Appointment.find({
    therapistUserId,
    status: { $in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
    date: { $gte: start, $lt: end },
  })
    .select('date status')
    .lean()

  // Return set of day numbers that have appointments
  const bookedDays = [...new Set(appointments.map((a) => new Date(a.date).getDate()))]
  const pendingDays = [...new Set(
    appointments
      .filter((a) => a.status === 'PENDING')
      .map((a) => new Date(a.date).getDate())
  )]
  const confirmedDays = [...new Set(
    appointments
      .filter((a) => a.status === 'CONFIRMED')
      .map((a) => new Date(a.date).getDate())
  )]

  return { year, month, bookedDays, pendingDays, confirmedDays }
}
