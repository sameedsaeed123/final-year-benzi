import mongoose from 'mongoose'

const RECORD_TYPES = ['session_notes', 'prescription', 'clinical_report', 'lab_result', 'patient_upload']
const REVIEW_STATUSES = ['NOT_REVIEWED', 'HALF_REVIEWED', 'REVIEWED']

const recordSchema = new mongoose.Schema(
  {
    // Who the report belongs to
    patientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    // Who uploaded it (therapist or patient themselves)
    uploadedByUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    uploadedByRole: { type: String, enum: ['therapist', 'patient'], required: true },

    // File info (stored on local disk for now, S3 path later)
    fileName: { type: String, required: true },
    originalName: { type: String, required: true },
    fileUrl: { type: String, required: true },   // e.g. /api/files/records/uuid.pdf
    mimeType: { type: String, default: 'application/pdf' },
    fileSizeBytes: { type: Number, default: 0 },

    type: { type: String, enum: RECORD_TYPES, default: 'patient_upload' },
    title: { type: String, default: '' },
    description: { type: String, default: '' },

    // Review workflow
    reviewStatus: { type: String, enum: REVIEW_STATUSES, default: 'NOT_REVIEWED' },
    therapistNotes: { type: String, default: '' },
    patientFeedback: { type: String, default: '' },

    // Soft delete
    deletedAt: { type: Date, default: null },
    deletedByRole: { type: String, default: null },

    // Anonymous flag — if patient is in anonymous mode when this was uploaded,
    // the therapist view will mask patient identity
    isAnonymous: { type: Boolean, default: false },

    // Redacted PDF — generated when patient enables anonymous mode
    // null = not yet processed, '' = processing failed / not applicable
    redactedFileUrl: { type: String, default: null },
    redactionStatus: {
      type: String,
      enum: ['PENDING', 'PROCESSING', 'DONE', 'FAILED', 'NOT_APPLICABLE'],
      default: 'PENDING',
    },
    redactionError: { type: String, default: '' },
  },
  { timestamps: true }
)

recordSchema.index({ patientUserId: 1, createdAt: -1 })
recordSchema.index({ uploadedByUserId: 1, createdAt: -1 })

export const Record = mongoose.model('Record', recordSchema)
export { RECORD_TYPES, REVIEW_STATUSES }
