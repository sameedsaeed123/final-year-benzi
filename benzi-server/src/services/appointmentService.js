import { Appointment } from '../models/Appointment.js'
import { User } from '../models/User.js'
import { Therapist } from '../models/Therapist.js'

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

export async function listAppointmentsForPatient(patientUserId) {
  const list = await Appointment.find({ patientUserId })
    .sort({ date: -1 })
    .limit(100)
    .lean()

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
  return list.map((a) => ({
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
    action: 'mail',
  }))
}
export async function listAppointmentsForTherapist(therapistUserId) {
  const list = await Appointment.find({ therapistUserId })
    .sort({ date: -1 })
    .limit(100)
    .lean()

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

  const therapistExt = await Therapist.findOne({ userId: therapistUserId })
    .select('availableLocationLabels availableLocations')
    .lean()

  return list.map((a) => ({
    id: String(a._id).slice(-8).toUpperCase(),
    patient: nameById[String(a.patientUserId)] || 'Patient',
    dateTime: formatDateTime(a.date),
    duration: `${a.durationMinutes} min`,
    paymentMethod: a.paymentMethod || 'onsite',
    paymentStatus: paymentStatusUi(a.paymentStatus),
    paymentScreenshotUrl: a.paymentScreenshotUrl || '',
    // use therapist extension label overrides when present
    location: (() => {
      if (therapistExt && therapistExt.availableLocationLabels && typeof therapistExt.availableLocationLabels === 'object') {
        const label = therapistExt.availableLocationLabels[a.location]
        if (label) return label
      }
      return locationUi(a.location)
    })(),
    status: statusUi(a.status),
    action: 'mail',
  }))
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
    const start = timeToMinutes(slot.start)
    const end = timeToMinutes(slot.end)
    return !bookedRanges.some((b) => overlaps(start, end, b.start, b.end))
  })

  return { date, durationMinutes, slots: available }
}
