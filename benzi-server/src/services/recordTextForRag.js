/**
 * Extract plain text from a record file for RAG indexing (shared with aiContextBuilder logic).
 */
import fs from 'fs'
import path from 'path'
import { extractPdfText } from './pdfRedactionService.js'

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

export async function extractRecordTextForRag(record) {
  const metaParts = [
    record.title && `Title: ${record.title}`,
    record.description && `Description: ${record.description}`,
    record.therapistNotes && `Therapist notes: ${record.therapistNotes}`,
  ].filter(Boolean)

  const fallback = metaParts.join('\n')

  for (const diskPath of recordDiskPaths(record)) {
    if (!diskPath || !fs.existsSync(diskPath)) continue
    const isPdf =
      diskPath.toLowerCase().endsWith('.pdf') || String(record.mimeType || '').includes('pdf')
    if (!isPdf) continue
    try {
      const text = await extractPdfText(diskPath)
      if (text && text.trim().length >= 30) return text.trim()
    } catch (err) {
      console.warn('[RAG] PDF extract failed:', diskPath, err.message)
    }
  }

  return fallback
}
