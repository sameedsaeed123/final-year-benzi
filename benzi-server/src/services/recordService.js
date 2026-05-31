import mongoose from 'mongoose'
import path from 'path'
import fs from 'fs'
import { Record } from '../models/Record.js'
import { Patient } from '../models/Patient.js'
import { User } from '../models/User.js'
import { Appointment } from '../models/Appointment.js'
import { processRecordForRedaction } from './pdfRedactionService.js'
import { scheduleRecordRagIndex, deleteRecordFromRag } from './vectorRagService.js'

function formatDate(d) {
  if (!d) return '—'
  return new Date(d).toLocaleString('en-GB', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    hour12: true,
  })
}

function reviewLabel(s) {
  const m = { NOT_REVIEWED: 'Not Reviewed', HALF_REVIEWED: 'Half Reviewed', REVIEWED: 'Reviewed' }
  return m[s] || s
}

// ─── Name scrubbing for anonymous mode ──────────────────────────────────────
// Removes common name patterns from text. Used on title/description/notes
// when a patient is in anonymous mode so the therapist cannot identify them.
function scrubName(text, realName) {
  if (!text || !realName) return text
  // Escape regex special chars in the name
  const escaped = realName.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  // Replace full name, first name, last name (case-insensitive)
  const parts = realName.trim().split(/\s+/).filter(Boolean)
  const patterns = [escaped, ...parts.map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'))]
  let result = text
  for (const p of patterns) {
    result = result.replace(new RegExp(p, 'gi'), '[REDACTED]')
  }
  return result
}

// ─── Trigger redaction for a single record (async, non-blocking) ─────────────
async function triggerRedactionForRecord(recordDoc, patientUser) {
  if (!recordDoc || recordDoc.deletedAt) return
  const ext = path.extname(recordDoc.originalName || '').toLowerCase()
  if (ext !== '.pdf') {
    await Record.findByIdAndUpdate(recordDoc._id, { redactionStatus: 'NOT_APPLICABLE' })
    return
  }

  const originalFilePath = path.join(process.cwd(), 'uploads', 'records', recordDoc.fileName)

  // Check file actually exists before attempting
  if (!fs.existsSync(originalFilePath)) {
    console.error('[recordService] Original file not found:', originalFilePath)
    await Record.findByIdAndUpdate(recordDoc._id, {
      redactionStatus: 'FAILED',
      redactionError: 'Original file not found on disk',
    })
    return
  }

  const patientFullName = patientUser
    ? `${patientUser.firstName || ''} ${patientUser.lastName || ''}`.trim()
    : ''

  try {
    console.log('[recordService] Starting redaction for record', String(recordDoc._id))
    await Record.findByIdAndUpdate(recordDoc._id, { redactionStatus: 'PROCESSING' })

    const redactedPath = await processRecordForRedaction({
      originalFilePath,
      originalFileName: recordDoc.fileName,
      patientFullName,
      patientEmail: patientUser?.email || '',
      patientPhone: patientUser?.phone || '',
    })

    if (!redactedPath) {
      console.log('[recordService] Redaction not applicable for record', String(recordDoc._id))
      const na = await Record.findByIdAndUpdate(
        recordDoc._id,
        { redactionStatus: 'NOT_APPLICABLE', redactedFileUrl: null },
        { new: true }
      ).lean()
      if (na) scheduleRecordRagIndex(na)
    } else {
      const redactedFileName = path.basename(redactedPath)
      const redactedFileUrl = `/api/files/records/${redactedFileName}`
      console.log('[recordService] Redaction complete for record', String(recordDoc._id), '→', redactedFileUrl)
      const updated = await Record.findByIdAndUpdate(
        recordDoc._id,
        { redactionStatus: 'DONE', redactedFileUrl },
        { new: true }
      ).lean()
      if (updated) scheduleRecordRagIndex(updated)
    }
  } catch (err) {
    console.error('[recordService] Redaction failed for record', String(recordDoc._id), err.message)
    console.error('[recordService] Stack trace:', err.stack)
    // Always update to FAILED — never leave stuck in PROCESSING
    try {
      await Record.findByIdAndUpdate(recordDoc._id, {
        redactionStatus: 'FAILED',
        redactionError: err.message,
      })
    } catch (updateErr) {
      console.error('[recordService] Could not update redaction status to FAILED:', updateErr.message)
    }
  }
}

// ─── Trigger redaction for ALL existing records of a patient ─────────────────
async function triggerRedactionForAllPatientRecords(patientUserId) {
  const patientUser = await User.findById(patientUserId)
    .select('firstName lastName email phone')
    .lean()

  const records = await Record.find({
    patientUserId,
    deletedAt: null,
    redactionStatus: { $in: ['PENDING', 'FAILED', 'PROCESSING'] },
  }).lean()

  for (const rec of records) {
    await triggerRedactionForRecord(rec, patientUser)
  }
}

// ─── Resolve display ID or full ObjectId to a Record document ────────────────
async function findRecordById(recordId) {
  if (mongoose.Types.ObjectId.isValid(recordId)) {
    return await Record.findById(recordId)
  }
  // 8-char display ID — scan for suffix match
  const upper = String(recordId).toUpperCase()
  const candidates = await Record.find({
    $expr: { $eq: [{ $toUpper: { $substr: [{ $toString: '$_id' }, 16, 8] } }, upper] },
  }).limit(1)
  return candidates[0] || null
}

// ─── Check if therapist is linked to patient ────────────────────────────────
async function assertTherapistLinkedToPatient(therapistUserId, patientUserId) {
  const appt = await Appointment.findOne({
    therapistUserId,
    patientUserId,
    status: { $in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
  })
    .select('_id')
    .lean()
  if (!appt) {
    const err = new Error('You are not linked to this patient')
    err.statusCode = 403
    throw err
  }
}

// ─── Get patient's anonymous status ─────────────────────────────────────────
async function getPatientAnonymousInfo(patientUserId) {
  const patient = await Patient.findOne({ userId: patientUserId })
    .select('anonymousModeEnabled anonymousAlias')
    .lean()
  return {
    isAnonymous: patient?.anonymousModeEnabled || false,
    alias: patient?.anonymousAlias || `Patient #${String(patientUserId).slice(-4).toUpperCase()}`,
  }
}

// ─── List records for patient (own view) ────────────────────────────────────
export async function listRecordsForPatient(patientUserId) {
  const records = await Record.find({ patientUserId, deletedAt: null })
    .sort({ createdAt: -1 })
    .lean()

  // Fetch uploader names
  const uploaderIds = [...new Set(records.map((r) => String(r.uploadedByUserId)))]
  const uploaders = await User.find({ _id: { $in: uploaderIds } })
    .select('firstName lastName role')
    .lean()
  const uploaderById = Object.fromEntries(uploaders.map((u) => [String(u._id), u]))

  return records.map((r) => {
    const uploader = uploaderById[String(r.uploadedByUserId)]
    const uploaderName = uploader
      ? `${uploader.firstName || ''} ${uploader.lastName || ''}`.trim() || 'Unknown'
      : 'Unknown'
    return {
      id: String(r._id),
      displayId: String(r._id).slice(-8).toUpperCase(),
      title: r.title || r.originalName,
      description: r.description || '',
      fileName: r.originalName,
      fileUrl: r.fileUrl,
      mimeType: r.mimeType,
      type: r.type,
      reviewStatus: reviewLabel(r.reviewStatus),
      reviewStatusCode: r.reviewStatus,
      therapistNotes: r.therapistNotes || '',
      patientFeedback: r.patientFeedback || '',
      uploadedBy: uploaderName,
      uploadedByRole: r.uploadedByRole,
      isAnonymous: r.isAnonymous,
      createdAt: formatDate(r.createdAt),
      rawCreatedAt: r.createdAt,
    }
  })
}

// ─── List records for therapist (masked if anonymous) ───────────────────────
export async function listRecordsForTherapist(therapistUserId, patientUserId) {
  // Verify therapist is linked to this patient
  await assertTherapistLinkedToPatient(therapistUserId, patientUserId)

  const records = await Record.find({ patientUserId, deletedAt: null })
    .sort({ createdAt: -1 })
    .lean()

  const { isAnonymous, alias } = await getPatientAnonymousInfo(patientUserId)

  // Get patient real name (for scrubbing if anonymous)
  let patientRealName = ''
  if (isAnonymous) {
    const pu = await User.findById(patientUserId).select('firstName lastName').lean()
    patientRealName = pu ? `${pu.firstName || ''} ${pu.lastName || ''}`.trim() : ''
  }

  return records.map((r) => {
    let title = r.title || r.originalName
    let description = r.description || ''
    let therapistNotes = r.therapistNotes || ''

    if (isAnonymous) {
      title = scrubName(title, patientRealName)
      description = scrubName(description, patientRealName)
      therapistNotes = scrubName(therapistNotes, patientRealName)
    }

    // When anonymous, serve the redacted PDF if available
    let fileUrl = r.fileUrl
    let downloadBlocked = false
    if (isAnonymous) {
      // Patient is currently anonymous — apply redaction rules
      if (r.redactionStatus === 'DONE' && r.redactedFileUrl) {
        fileUrl = r.redactedFileUrl
      } else if (r.redactionStatus === 'NOT_APPLICABLE') {
        // Non-PDF or scanned image — block download entirely
        fileUrl = ''
        downloadBlocked = true
      } else {
        // Still processing or failed — block download
        fileUrl = ''
        downloadBlocked = true
      }
    }
    // If patient is NOT anonymous, always serve the original file unblocked

    return {
      id: String(r._id),
      displayId: String(r._id).slice(-8).toUpperCase(),
      patientName: isAnonymous ? alias : null,
      title,
      description,
      fileName: r.originalName,
      fileUrl,
      downloadBlocked,
      redactionStatus: r.redactionStatus || 'PENDING',
      mimeType: r.mimeType,
      type: r.type,
      reviewStatus: reviewLabel(r.reviewStatus),
      reviewStatusCode: r.reviewStatus,
      therapistNotes,
      uploadedByRole: r.uploadedByRole,
      isAnonymous,
      createdAt: formatDate(r.createdAt),
      rawCreatedAt: r.createdAt,
    }
  })
}

// ─── Upload a record (therapist or patient) ──────────────────────────────────
export async function uploadRecord({ uploaderUserId, uploaderRole, patientUserId, file, title, description, type }) {
  if (!file) {
    const err = new Error('No file provided')
    err.statusCode = 400
    throw err
  }

  // If therapist is uploading, verify they are linked to the patient
  if (uploaderRole === 'therapist') {
    await assertTherapistLinkedToPatient(uploaderUserId, patientUserId)
  }

  // If patient is uploading, they can only upload for themselves
  if (uploaderRole === 'patient' && String(uploaderUserId) !== String(patientUserId)) {
    const err = new Error('Patients can only upload their own records')
    err.statusCode = 403
    throw err
  }

  // Check patient anonymous status
  const { isAnonymous } = await getPatientAnonymousInfo(patientUserId)

  const fileUrl = `/api/files/records/${file.filename}`

  const doc = await Record.create({
    patientUserId,
    uploadedByUserId: uploaderUserId,
    uploadedByRole: uploaderRole,
    fileName: file.filename,
    originalName: file.originalname,
    fileUrl,
    mimeType: file.mimetype,
    fileSizeBytes: file.size,
    type: type || 'patient_upload',
    title: title || file.originalname,
    description: description || '',
    reviewStatus: 'NOT_REVIEWED',
    isAnonymous,
    redactionStatus: 'PENDING',
  })

  // If patient is already anonymous, trigger redaction immediately (async)
  if (isAnonymous) {
    const patientUser = await User.findById(patientUserId)
      .select('firstName lastName email phone')
      .lean()
    void triggerRedactionForRecord(doc.toObject(), patientUser)
  } else {
    scheduleRecordRagIndex(doc.toObject())
  }

  return {
    id: String(doc._id),
    displayId: String(doc._id).slice(-8).toUpperCase(),
    fileUrl: doc.fileUrl,
    fileName: doc.originalName,
    title: doc.title,
    reviewStatus: reviewLabel(doc.reviewStatus),
    createdAt: formatDate(doc.createdAt),
  }
}

// ─── Update review status (therapist only) ───────────────────────────────────
export async function updateRecordReview(recordId, therapistUserId, { reviewStatus, therapistNotes }) {
  const doc = await findRecordById(recordId)
  if (!doc || doc.deletedAt) {
    const err = new Error('Record not found')
    err.statusCode = 404
    throw err
  }
  await assertTherapistLinkedToPatient(therapistUserId, doc.patientUserId)
  if (reviewStatus) doc.reviewStatus = reviewStatus
  if (therapistNotes !== undefined) doc.therapistNotes = therapistNotes
  await doc.save()
  return { id: String(doc._id), reviewStatus: reviewLabel(doc.reviewStatus) }
}

// ─── Add patient feedback ─────────────────────────────────────────────────────
export async function addPatientFeedback(recordId, patientUserId, feedback) {
  const doc = await findRecordById(recordId)
  if (!doc || doc.deletedAt || String(doc.patientUserId) !== String(patientUserId)) {
    const err = new Error('Record not found')
    err.statusCode = 404
    throw err
  }
  doc.patientFeedback = feedback || ''
  await doc.save()
  return { id: String(doc._id) }
}

// ─── Soft delete (patient can delete own, therapist can delete own uploads) ──
export async function deleteRecord(recordId, requestingUserId, requestingRole) {
  const doc = await findRecordById(recordId)
  if (!doc || doc.deletedAt) {
    const err = new Error('Record not found')
    err.statusCode = 404
    throw err
  }

  if (requestingRole === 'patient') {
    if (String(doc.patientUserId) !== String(requestingUserId)) {
      const err = new Error('Forbidden')
      err.statusCode = 403
      throw err
    }
  } else if (requestingRole === 'therapist') {
    if (String(doc.uploadedByUserId) !== String(requestingUserId)) {
      const err = new Error('You can only delete records you uploaded')
      err.statusCode = 403
      throw err
    }
  }

  doc.deletedAt = new Date()
  doc.deletedByRole = requestingRole
  await doc.save()
  void deleteRecordFromRag(doc._id)
  return { id: String(doc._id) }
}

// ─── Toggle anonymous mode ────────────────────────────────────────────────────
export async function toggleAnonymousMode(patientUserId, enable) {
  let patient = await Patient.findOne({ userId: patientUserId })
  if (!patient) {
    patient = new Patient({ userId: patientUserId })
  }
  patient.anonymousModeEnabled = !!enable
  if (!patient.anonymousAlias) {
    patient.anonymousAlias = `Patient #${String(patientUserId).slice(-4).toUpperCase()}`
  }
  await patient.save()

  if (enable) {
    // Reset any stuck PROCESSING records to PENDING first, then trigger redaction
    await Record.updateMany(
      { patientUserId, deletedAt: null, redactionStatus: 'PROCESSING' },
      { $set: { redactionStatus: 'PENDING' } }
    )
    // Trigger redaction for all records that need it (async — don't block the response)
    void triggerRedactionForAllPatientRecords(patientUserId)
  } else {
    // Disabling anonymous mode — clear redacted URLs so therapist gets original immediately
    await Record.updateMany(
      { patientUserId, deletedAt: null },
      {
        $set: {
          isAnonymous: false,
          redactionStatus: 'PENDING',
          redactedFileUrl: null,
          redactionError: '',
        },
      }
    )
  }

  return {
    anonymousModeEnabled: patient.anonymousModeEnabled,
    anonymousAlias: patient.anonymousAlias,
  }
}

// ─── Retry redaction for all patient records (patient triggers manually) ─────
export async function retryRedactionForPatient(patientUserId) {
  // Reset stuck/failed records to PENDING
  await Record.updateMany(
    {
      patientUserId,
      deletedAt: null,
      redactionStatus: { $in: ['PROCESSING', 'FAILED'] },
    },
    { $set: { redactionStatus: 'PENDING', redactionError: '' } }
  )
  // Trigger async
  void triggerRedactionForAllPatientRecords(patientUserId)
  return { triggered: true }
}
export async function getAnonymousStatus(patientUserId) {
  const patient = await Patient.findOne({ userId: patientUserId })
    .select('anonymousModeEnabled anonymousAlias')
    .lean()
  return {
    anonymousModeEnabled: patient?.anonymousModeEnabled || false,
    anonymousAlias: patient?.anonymousAlias || `Patient #${String(patientUserId).slice(-4).toUpperCase()}`,
  }
}

// ─── List patients for therapist (with anonymous masking) ────────────────────
// Used by therapist to pick which patient to upload a report for
export async function listTherapistPatients(therapistUserId) {
  const appts = await Appointment.find({
    therapistUserId,
    status: { $in: ['PENDING', 'CONFIRMED', 'COMPLETED'] },
  })
    .distinct('patientUserId')

  if (!appts.length) return []

  const users = await User.find({ _id: { $in: appts } })
    .select('firstName lastName profileImageUrl')
    .lean()

  const patients = await Patient.find({ userId: { $in: appts } })
    .select('userId anonymousModeEnabled anonymousAlias')
    .lean()

  const patientMap = Object.fromEntries(patients.map((p) => [String(p.userId), p]))

  return users.map((u) => {
    const p = patientMap[String(u._id)]
    const isAnon = p?.anonymousModeEnabled || false
    const alias = p?.anonymousAlias || `Patient #${String(u._id).slice(-4).toUpperCase()}`
    return {
      id: String(u._id),
      name: isAnon ? alias : `${u.firstName || ''} ${u.lastName || ''}`.trim() || 'Patient',
      image: isAnon ? '' : (u.profileImageUrl || ''),
      isAnonymous: isAnon,
    }
  })
}
