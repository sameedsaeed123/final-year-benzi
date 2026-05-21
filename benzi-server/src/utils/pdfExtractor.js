import fs from 'fs'
import { extractPdfText } from '../services/pdfRedactionService.js'

/** Extract text from a PDF on disk (uses pdfjs — reliable in this project). */
export async function extractTextFromPDF(filePath) {
  const text = await extractPdfText(filePath)
  return text || ''
}

export async function extractTextFromBuffer(buffer) {
  const os = await import('os')
  const path = await import('path')
  const tmp = path.join(os.tmpdir(), `benzi-pdf-${Date.now()}.pdf`)
  try {
    fs.writeFileSync(tmp, buffer)
    return await extractTextFromPDF(tmp)
  } finally {
    try {
      fs.unlinkSync(tmp)
    } catch {
      /* ignore */
    }
  }
}
