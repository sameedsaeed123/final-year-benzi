import { Patient } from '../models/Patient.js'
import { Therapist } from '../models/Therapist.js'
import { User } from '../models/User.js'
import { Appointment } from '../models/Appointment.js'

function isActiveLink(link) {
  return link && !link.unlinkedAt
}

export function getActiveTherapistIds(patient) {
  if (!patient) return []
  const ids = new Set()
  for (const link of patient.therapistLinks || []) {
    if (isActiveLink(link)) ids.add(String(link.therapistUserId))
  }
  if (
    patient.assignedTherapistUserId &&
    ids.size === 0 &&
    !(patient.therapistLinks || []).some(
      (l) => String(l.therapistUserId) === String(patient.assignedTherapistUserId) && l.unlinkedAt
    )
  ) {
    ids.add(String(patient.assignedTherapistUserId))
  }
  return [...ids]
}

export function isPatientLinkedToTherapist(patient, therapistUserId) {
  if (!patient || !therapistUserId) return false
  const tid = String(therapistUserId)
  const explicit = (patient.therapistLinks || []).find((l) => String(l.therapistUserId) === tid)
  if (explicit) return isActiveLink(explicit)
  return (
    patient.assignedTherapistUserId &&
    String(patient.assignedTherapistUserId) === tid &&
    !(patient.therapistLinks || []).length
  )
}

async function buildTherapistCard(therapistUserId) {
  const [user, therapist] = await Promise.all([
    User.findById(therapistUserId).select('firstName lastName email profileImageUrl').lean(),
    Therapist.findOne({ userId: therapistUserId })
      .select('specializationTitle qualification city waitTimeLabel experienceYears avgRating profileImageUrl')
      .lean(),
  ])
  if (!user) return null
  return {
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
  }
}

function syncPrimaryTherapist(patientDoc) {
  const active = (patientDoc.therapistLinks || []).filter(isActiveLink)
  if (active.length === 0) {
    patientDoc.assignedTherapistUserId = null
    patientDoc.assignedAt = null
    return
  }
  const primaryId = String(active[0].therapistUserId)
  if (!patientDoc.assignedTherapistUserId || !active.some((l) => String(l.therapistUserId) === String(patientDoc.assignedTherapistUserId))) {
    patientDoc.assignedTherapistUserId = active[0].therapistUserId
    patientDoc.assignedAt = active[0].linkedAt || new Date()
  }
}

async function ensureLegacyLinkMigrated(patientDoc) {
  if (!patientDoc) return patientDoc
  const legacyId = patientDoc.assignedTherapistUserId
  if (!legacyId) return patientDoc
  const hasEntry = (patientDoc.therapistLinks || []).some(
    (l) => String(l.therapistUserId) === String(legacyId)
  )
  if (!hasEntry) {
    patientDoc.therapistLinks.push({
      therapistUserId: legacyId,
      linkedAt: patientDoc.assignedAt || new Date(),
      unlinkedAt: null,
    })
    await patientDoc.save()
  }
  return patientDoc
}

export async function patientHasPortalAccess(userId) {
  const patient = await Patient.findOne({ userId }).select('therapistLinks assignedTherapistUserId').lean()
  if (getActiveTherapistIds(patient).length > 0) return true
  const appt = await Appointment.findOne({ patientUserId: userId }).select('_id').lean()
  return Boolean(appt)
}

export async function countActiveLinkedPatients(therapistUserId) {
  const patients = await Patient.find({
    therapistLinks: {
      $elemMatch: { therapistUserId, unlinkedAt: null },
    },
  })
    .select('userId therapistLinks assignedTherapistUserId')
    .lean()

  const legacyOnly = await Patient.find({
    assignedTherapistUserId: therapistUserId,
    $or: [{ therapistLinks: { $exists: false } }, { therapistLinks: { $size: 0 } }],
  })
    .select('userId')
    .lean()

  const ids = new Set()
  for (const p of patients) {
    if (isPatientLinkedToTherapist(p, therapistUserId)) ids.add(String(p.userId))
  }
  for (const p of legacyOnly) {
    ids.add(String(p.userId))
  }
  return ids.size
}

export async function getLinkedTherapistForPatient(userId) {
  let patient = await Patient.findOne({ userId })
  if (patient) patient = await ensureLegacyLinkMigrated(patient)

  const portalAccess = await patientHasPortalAccess(userId)
  const activeIds = new Set(getActiveTherapistIds(patient))

  const apptTherapists = await Appointment.find({
    patientUserId: userId,
    status: { $in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
  })
    .select('therapistUserId')
    .lean()
  for (const a of apptTherapists) {
    if (a.therapistUserId) activeIds.add(String(a.therapistUserId))
  }

  const idList = [...activeIds]
  if (!portalAccess && idList.length === 0) {
    return { linked: false, therapists: [] }
  }

  const therapists = []
  for (const tid of idList) {
    const card = await buildTherapistCard(tid)
    if (card) therapists.push(card)
  }

  return {
    linked: portalAccess || therapists.length > 0,
    therapist: therapists[0] || null,
    therapists,
    primaryTherapistId: patient?.assignedTherapistUserId ? String(patient.assignedTherapistUserId) : null,
  }
}

export async function getLinkedTherapistsForPatient(userId) {
  const data = await getLinkedTherapistForPatient(userId)
  return { therapists: data.therapists || [], primaryTherapistId: data.primaryTherapistId || null }
}

export async function linkPatientToTherapist(patientUserId, therapistUserId) {
  let patient = await Patient.findOne({ userId: patientUserId })
  if (!patient) {
    const { assertCanAddPatient } = await import('./subscriptionLimitsService.js')
    await assertCanAddPatient(therapistUserId)
    patient = await Patient.create({
      userId: patientUserId,
      therapistLinks: [{ therapistUserId, linkedAt: new Date(), unlinkedAt: null }],
      assignedTherapistUserId: therapistUserId,
      assignedAt: new Date(),
      totalPoints: 0,
    })
    return
  }

  await ensureLegacyLinkMigrated(patient)

  const existing = (patient.therapistLinks || []).find(
    (l) => String(l.therapistUserId) === String(therapistUserId)
  )

  if (existing) {
    if (isActiveLink(existing)) return
    existing.unlinkedAt = null
    existing.linkedAt = new Date()
  } else {
    const { assertCanAddPatient } = await import('./subscriptionLimitsService.js')
    await assertCanAddPatient(therapistUserId)
    patient.therapistLinks.push({
      therapistUserId,
      linkedAt: new Date(),
      unlinkedAt: null,
    })
  }

  if (!patient.assignedTherapistUserId) {
    patient.assignedTherapistUserId = therapistUserId
    patient.assignedAt = new Date()
  }

  syncPrimaryTherapist(patient)
  await patient.save()
}

/** @deprecated use linkPatientToTherapist */
export async function linkPatientToTherapistIfEmpty(patientUserId, therapistUserId) {
  return linkPatientToTherapist(patientUserId, therapistUserId)
}

export async function unlinkPatientFromTherapist(patientUserId, therapistUserId) {
  const patient = await Patient.findOne({ userId: patientUserId })
  if (!patient) {
    const err = new Error('Patient not found')
    err.statusCode = 404
    throw err
  }

  await ensureLegacyLinkMigrated(patient)

  const link = (patient.therapistLinks || []).find(
    (l) => String(l.therapistUserId) === String(therapistUserId) && isActiveLink(l)
  )

  if (!link && !isPatientLinkedToTherapist(patient, therapistUserId)) {
    const err = new Error('Patient is not linked to you')
    err.statusCode = 404
    throw err
  }

  if (link) {
    link.unlinkedAt = new Date()
  } else {
    patient.therapistLinks.push({
      therapistUserId,
      linkedAt: patient.assignedAt || new Date(),
      unlinkedAt: new Date(),
    })
  }

  syncPrimaryTherapist(patient)
  await patient.save()
  return { patientUserId: String(patientUserId), therapistUserId: String(therapistUserId) }
}

export async function listClientsForTherapist(therapistUserId) {
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

  const patientRecords = await Patient.find({ userId: { $in: uniquePatientIds } })
    .select('userId anonymousModeEnabled anonymousAlias therapistLinks assignedTherapistUserId')
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
    const isLinked = isPatientLinkedToTherapist(p, therapistUserId)

    return {
      id: pid,
      name: isAnonymous ? alias : (u ? `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Patient' : 'Patient'),
      email: isAnonymous ? '' : (u?.email || ''),
      phone: isAnonymous ? '' : (u?.phone || ''),
      image: isAnonymous ? '' : (u?.profileImageUrl || ''),
      isAnonymous,
      isLinked,
      totalSessions: stats.total,
      lastSessionDate: formatDate(stats.lastDate),
      status: deriveClientStatus(stats.statuses, stats.lastStatus),
    }
  })
}
