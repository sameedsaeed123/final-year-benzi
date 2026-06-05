import { Patient } from '../models/Patient.js'
import { Therapist } from '../models/Therapist.js'
import { User } from '../models/User.js'

export async function getLinkedTherapistForPatient(userId) {
  const patient = await Patient.findOne({ userId }).select('assignedTherapistUserId').lean()
  const therapistUserId = patient?.assignedTherapistUserId
  if (!therapistUserId) {
    return { linked: false }
  }

  const [user, therapist] = await Promise.all([
    User.findById(therapistUserId).select('firstName lastName email profileImageUrl').lean(),
    Therapist.findOne({ userId: therapistUserId })
      .select('specializationTitle qualification city waitTimeLabel experienceYears avgRating profileImageUrl')
      .lean(),
  ])

  if (!user) {
    return { linked: false }
  }

  return {
    linked: true,
    therapist: {
      id: String(therapistUserId),
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Therapist',
      email: user.email || '',
      image: (user.profileImageUrl || therapist?.profileImageUrl || '').trim(),
      specializationTitle: therapist?.specializationTitle || '',
      qualification: therapist?.qualification || '',
      city: therapist?.city || '',
      waitTimeLabel: therapist?.waitTimeLabel || '',
      experienceYears: therapist?.experienceYears ?? 0,
      avgRating: typeof therapist?.avgRating === 'number' ? therapist.avgRating : 0,
    },
  }
}

export async function linkPatientToTherapistIfEmpty(patientUserId, therapistUserId) {
  const existing = await Patient.findOne({ userId: patientUserId })
    .select('assignedTherapistUserId')
    .lean()
  const isNewLink =
    !existing?.assignedTherapistUserId ||
    String(existing.assignedTherapistUserId) !== String(therapistUserId)

  if (isNewLink && !existing?.assignedTherapistUserId) {
    const { assertCanAddPatient } = await import('./subscriptionLimitsService.js')
    await assertCanAddPatient(therapistUserId)
  }

  const result = await Patient.updateOne(
    {
      userId: patientUserId,
      $or: [{ assignedTherapistUserId: { $exists: false } }, { assignedTherapistUserId: null }],
    },
    {
      $set: { assignedTherapistUserId: therapistUserId, assignedAt: new Date() },
    }
  )

  // If no document matched (patient record doesn't exist yet), create one
  if (result.matchedCount === 0) {
    const exists = await Patient.findOne({ userId: patientUserId }).select('_id').lean()
    if (!exists) {
      try {
        await Patient.create({
          userId: patientUserId,
          assignedTherapistUserId: therapistUserId,
          assignedAt: new Date(),
          totalPoints: 0,
        })
      } catch (e) {
        // Ignore duplicate key — another request already created the record
        if (e.code !== 11000) throw e
      }
    }
  }
}

export async function listClientsForTherapist(therapistUserId) {
  const { Appointment } = await import('../models/Appointment.js')

  const appointments = await Appointment.find({ therapistUserId })
    .sort({ date: -1 })
    .lean()

  if (!appointments.length) return []

  const seen = new Set()
  const uniquePatientIds = []
  for (const a of appointments) {
    const pid = String(a.patientUserId)
    if (!seen.has(pid)) {
      seen.add(pid)
      uniquePatientIds.push(a.patientUserId)
    }
  }

  const users = await User.find({ _id: { $in: uniquePatientIds } })
    .select('firstName lastName email phone profileImageUrl')
    .lean()
  const userById = Object.fromEntries(users.map((u) => [String(u._id), u]))

  // Fetch anonymous status for all patients
  const patientRecords = await Patient.find({ userId: { $in: uniquePatientIds } })
    .select('userId anonymousModeEnabled anonymousAlias')
    .lean()
  const patientById = Object.fromEntries(patientRecords.map((p) => [String(p.userId), p]))

  const statsMap = {}
  for (const a of appointments) {
    const pid = String(a.patientUserId)
    if (!statsMap[pid]) {
      statsMap[pid] = { total: 0, lastDate: null, lastStatus: null, statuses: new Set() }
    }
    statsMap[pid].total += 1
    statsMap[pid].statuses.add(a.status)
    if (!statsMap[pid].lastDate || new Date(a.date) > new Date(statsMap[pid].lastDate)) {
      statsMap[pid].lastDate = a.date
      statsMap[pid].lastStatus = a.status
    }
  }

  function formatDate(d) {
    if (!d) return '—'
    return new Date(d).toLocaleString('en-GB', {
      day: 'numeric', month: 'short', year: 'numeric',
      hour: 'numeric', minute: '2-digit', hour12: true,
    })
  }

  function deriveClientStatus(statuses, lastStatus) {
    if (statuses.has('CONFIRMED') || statuses.has('PENDING')) return 'Active'
    if (statuses.has('COMPLETED')) return 'Completed'
    if (statuses.has('CANCELLED')) return 'Cancelled'
    return lastStatus || 'Unknown'
  }

  return uniquePatientIds.map((patientUserId) => {
    const pid = String(patientUserId)
    const u = userById[pid]
    const p = patientById[pid]
    const stats = statsMap[pid] || { total: 0, lastDate: null, lastStatus: null, statuses: new Set() }
    const isAnonymous = p?.anonymousModeEnabled || false
    const alias = p?.anonymousAlias || `Patient #${pid.slice(-4).toUpperCase()}`

    return {
      id: pid,
      // Mask identity if anonymous
      name: isAnonymous ? alias : (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Patient' : 'Patient'),
      email: isAnonymous ? '' : (u?.email || ''),
      phone: isAnonymous ? '' : (u?.phone || ''),
      image: isAnonymous ? '' : (u?.profileImageUrl || ''),
      isAnonymous,
      totalSessions: stats.total,
      lastSessionDate: formatDate(stats.lastDate),
      status: deriveClientStatus(stats.statuses, stats.lastStatus),
    }
  })
}
