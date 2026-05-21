import fs from 'fs'
import path from 'path'
import { Patient } from '../models/Patient.js'
import { Record } from '../models/Record.js'
import { AiMessage } from '../models/AiMessage.js'
import { AiGoal } from '../models/AiGoal.js'
import { extractPdfText } from './pdfRedactionService.js'

const MAX_RECORDS = 10
const MAX_CHARS_PER_RECORD = 3500

function recordDiskPaths(record) {
  const paths = []
  if (record.fileName) {
    paths.push(path.join(process.cwd(), 'uploads', 'records', record.fileName))
  }
  const redactedMatch = String(record.redactedFileUrl || '').match(/records\/([^/?]+)/)
  if (redactedMatch) {
    paths.push(path.join(process.cwd(), 'uploads', 'records', redactedMatch[1]))
  }
  const urlMatch = String(record.fileUrl || '').match(/records\/([^/?]+)/)
  if (urlMatch) {
    paths.push(path.join(process.cwd(), 'uploads', 'records', urlMatch[1]))
  }
  return [...new Set(paths)]
}

async function extractRecordText(record) {
  const metaParts = [
    record.title && `Title: ${record.title}`,
    record.description && `Description: ${record.description}`,
    record.therapistNotes && `Therapist notes: ${record.therapistNotes}`,
    record.patientFeedback && `Patient notes: ${record.patientFeedback}`,
  ].filter(Boolean)

  const fallback = metaParts.join('\n') || 'No metadata for this file.'

  for (const diskPath of recordDiskPaths(record)) {
    if (!diskPath || !fs.existsSync(diskPath)) continue
    const isPdf =
      diskPath.toLowerCase().endsWith('.pdf') ||
      String(record.mimeType || '').includes('pdf')
    if (!isPdf) continue

    try {
      const text = await extractPdfText(diskPath)
      if (text && text.trim().length >= 30) {
        return text.trim()
      }
    } catch (err) {
      console.warn('[AiContext] PDF extract failed:', diskPath, err.message)
    }
  }

  return fallback
}

export async function buildPatientContext(patientUserId) {
  const patient = await Patient.findOne({ userId: patientUserId })
    .populate('userId', 'firstName lastName email')
    .lean()

  const recordDocs = await Record.find({ patientUserId, deletedAt: null })
    .sort({ createdAt: -1 })
    .limit(MAX_RECORDS)
    .lean()

  const records = []
  for (const record of recordDocs) {
    const extractedText = await extractRecordText(record)
    const hasPdfBody = extractedText.length >= 80 && !extractedText.startsWith('Title:')
    records.push({
      id: String(record._id),
      type: record.type,
      title: record.title || record.originalName || 'Untitled report',
      therapistNotes: record.therapistNotes || '',
      description: record.description || '',
      uploadedAt: record.createdAt,
      extractedText: String(extractedText).slice(0, MAX_CHARS_PER_RECORD),
      hasPdfBody,
    })
    if (!hasPdfBody) {
      console.warn(
        `[AiContext] Record ${record._id} (${record.title}): little or no PDF text — using metadata only`
      )
    }
  }

  const aiMsgs = await AiMessage.find({ patientUserId })
    .sort({ createdAt: -1 })
    .limit(20)
    .lean()

  const chatHistory = [...aiMsgs]
    .reverse()
    .map((msg) => ({
      role: msg.sender === 'patient' ? 'user' : 'model',
      parts: [{ text: msg.text }],
    }))

  const goals = await AiGoal.find({
    patientUserId,
    status: { $in: ['pending', 'in-progress'] },
  }).lean()

  return {
    patientId: patientUserId,
    chatHistory,
    records,
    goals,
    timezone: patient?.timezone || 'UTC',
    recordCount: records.length,
    recordsWithPdfText: records.filter((r) => r.hasPdfBody).length,
  }
}
