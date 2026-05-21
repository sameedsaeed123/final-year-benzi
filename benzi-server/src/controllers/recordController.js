import { sendSuccess, sendError } from '../utils/responseUtils.js'
import {
  listRecordsForPatient,
  listRecordsForTherapist,
  uploadRecord,
  updateRecordReview,
  addPatientFeedback,
  deleteRecord,
  toggleAnonymousMode,
  getAnonymousStatus,
  listTherapistPatients,
  retryRedactionForPatient,
} from '../services/recordService.js'

// ─── Patient: list own records ────────────────────────────────────────────────
export async function patientListRecords(req, res, next) {
  try {
    const records = await listRecordsForPatient(req.user.id)
    return sendSuccess(res, { records, total: records.length }, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

// ─── Therapist: list records for a specific patient ───────────────────────────
export async function therapistListPatientRecords(req, res, next) {
  try {
    const { patientUserId } = req.params
    const records = await listRecordsForTherapist(req.user.id, patientUserId)
    return sendSuccess(res, { records, total: records.length }, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

// ─── Upload record (patient or therapist) ────────────────────────────────────
export async function uploadRecordHandler(req, res, next) {
  try {
    if (!req.file) return sendError(res, 'No file uploaded', 400)

    // patientUserId: therapist passes it in body; patient uses own id
    const patientUserId = req.user.role === 'patient'
      ? req.user.id
      : (req.body.patientUserId || '')

    if (!patientUserId) return sendError(res, 'patientUserId is required', 400)

    const result = await uploadRecord({
      uploaderUserId: req.user.id,
      uploaderRole: req.user.role,
      patientUserId,
      file: req.file,
      title: req.body.title || '',
      description: req.body.description || '',
      type: req.body.type || 'patient_upload',
    })
    return sendSuccess(res, result, 'Uploaded', 201)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

// ─── Therapist: update review status ─────────────────────────────────────────
export async function therapistUpdateReview(req, res, next) {
  try {
    const { reviewStatus, therapistNotes } = req.body
    // route is /therapist/:id/review
    const recordId = req.params.id
    const result = await updateRecordReview(recordId, req.user.id, { reviewStatus, therapistNotes })
    return sendSuccess(res, result, 'Updated', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

// ─── Patient: add feedback ────────────────────────────────────────────────────
export async function patientAddFeedback(req, res, next) {
  try {
    const { feedback } = req.body
    const result = await addPatientFeedback(req.params.id, req.user.id, feedback)
    return sendSuccess(res, result, 'Updated', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

// ─── Delete record ────────────────────────────────────────────────────────────
export async function deleteRecordHandler(req, res, next) {
  try {
    const result = await deleteRecord(req.params.id, req.user.id, req.user.role)
    return sendSuccess(res, result, 'Deleted', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

// ─── Patient: toggle anonymous mode ──────────────────────────────────────────
export async function patientToggleAnonymous(req, res, next) {
  try {
    const { enable } = req.body
    const result = await toggleAnonymousMode(req.user.id, enable)
    return sendSuccess(res, result, 'Updated', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

// ─── Patient: get anonymous status ───────────────────────────────────────────
export async function patientGetAnonymousStatus(req, res, next) {
  try {
    const result = await getAnonymousStatus(req.user.id)
    return sendSuccess(res, result, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

// ─── Patient: retry redaction ─────────────────────────────────────────────────
export async function patientRetryRedaction(req, res, next) {
  try {
    const result = await retryRedactionForPatient(req.user.id)
    return sendSuccess(res, result, 'Redaction retry triggered', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}
export async function therapistListPatients(req, res, next) {
  try {
    const patients = await listTherapistPatients(req.user.id)
    return sendSuccess(res, { patients }, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}
