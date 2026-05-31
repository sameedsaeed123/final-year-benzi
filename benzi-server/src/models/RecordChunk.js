import mongoose from 'mongoose'

const recordChunkSchema = new mongoose.Schema(
  {
    patientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    recordId: { type: mongoose.Schema.Types.ObjectId, ref: 'Record', required: true, index: true },
    chunkIndex: { type: Number, required: true },
    text: { type: String, required: true },
    embedding: { type: [Number], required: true },
    title: { type: String, default: '' },
    recordType: { type: String, default: '' },
  },
  { timestamps: true }
)

recordChunkSchema.index({ patientUserId: 1, recordId: 1, chunkIndex: 1 }, { unique: true })

export const RecordChunk = mongoose.model('RecordChunk', recordChunkSchema)
