/**
 * PDF Redaction Service
 *
 * Strategy:
 * 1. Extract raw text from the original PDF using pdf-parse
 * 2. Apply regex redaction patterns (name, phone, email, address)
 * 3. Rebuild a clean text-only PDF using pdf-lib with redacted content
 * 4. Save the redacted PDF alongside the original
 *
 * The original PDF is never modified — the patient always has access to it.
 * The therapist always receives the redacted version when anonymous mode is on.
 *
 * Limitations:
 * - Works on text-layer PDFs (not scanned image PDFs)
 * - Layout/formatting is not preserved — output is clean plain text PDF
 * - For scanned PDFs, we fall back to blocking the download entirely
 */

import fs from 'fs'
import path from 'path'
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib'

// ─── Regex patterns for PII detection ────────────────────────────────────────

// Email addresses
const EMAIL_REGEX = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/g

// Phone numbers — covers:
// Pakistani: 0300-1234567, 03001234567, +923001234567, 0092-300-1234567
// International: +1 (555) 123-4567, +44 7911 123456
// Generic: sequences of 7-15 digits with optional separators
const PHONE_REGEX = /(?:\+?(?:92|1|44|971|966|20|91)\s?[-.\s]?)?(?:\(?\d{2,4}\)?[\s.\-]?)?\d{3,4}[\s.\-]?\d{3,4}[\s.\-]?\d{0,4}/g

// Pakistani CNIC: 12345-1234567-1
const CNIC_REGEX = /\d{5}-\d{7}-\d/g

// Street addresses — common patterns
// "House No 5, Street 3, Gulberg" / "Flat 4B, Block C" / "123 Main Street"
const ADDRESS_REGEX = /(?:house|flat|apartment|apt|plot|block|sector|street|road|avenue|lane|phase|dha|gulberg|bahria|clifton|defence|f-\d|g-\d|i-\d|h-\d)\s*[#\-]?\s*[\w\d,.\s]{3,60}/gi

// ─── Core redaction function ──────────────────────────────────────────────────

/**
 * Redact PII from a text string.
 * @param {string} text - Raw extracted text
 * @param {string[]} knownNames - Array of name strings to redact (e.g. ["John Doe", "John", "Doe"])
 * @returns {string} - Redacted text
 */
export function redactText(text, knownNames = []) {
  let result = text

  // 1. Redact known names first (most specific)
  for (const name of knownNames) {
    if (!name || name.trim().length < 2) continue
    const escaped = name.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
    result = result.replace(new RegExp(escaped, 'gi'), '[NAME REDACTED]')
  }

  // 2. Redact email addresses
  result = result.replace(EMAIL_REGEX, '[EMAIL REDACTED]')

  // 3. Redact CNIC
  result = result.replace(CNIC_REGEX, '[ID REDACTED]')

  // 4. Redact phone numbers
  // We apply phone regex carefully — avoid redacting years like "2024" or short numbers
  result = result.replace(PHONE_REGEX, (match) => {
    const digits = match.replace(/\D/g, '')
    // Only redact if it looks like a real phone number (7+ digits)
    if (digits.length >= 7) return '[PHONE REDACTED]'
    return match
  })

  // 5. Redact address patterns
  result = result.replace(ADDRESS_REGEX, '[ADDRESS REDACTED]')

  return result
}

// ─── Extract text from PDF ────────────────────────────────────────────────────

/**
 * Extract raw text from a PDF file.
 * Returns null if the PDF has no text layer (scanned image PDF).
 */
export async function extractPdfText(filePath) {
  try {
    const { createRequire } = await import('module')
    const require = createRequire(import.meta.url)
    const pdfjsLib = require('pdfjs-dist/legacy/build/pdf.js')
    const buffer = fs.readFileSync(filePath)
    const uint8 = new Uint8Array(buffer)
    const doc = await pdfjsLib.getDocument({ data: uint8 }).promise
    let text = ''
    for (let i = 1; i <= doc.numPages; i++) {
      const page = await doc.getPage(i)
      const content = await page.getTextContent()
      text += content.items.map((item) => item.str).join(' ') + '\n'
    }
    const trimmed = text.trim()
    // If less than 50 chars extracted, it's likely a scanned image PDF
    return trimmed.length >= 50 ? trimmed : null
  } catch (err) {
    console.error('[pdfRedaction] Text extraction failed:', err.message)
    console.error('[pdfRedaction] Stack trace:', err.stack)
    return null
  }
}

// ─── Build a redacted PDF from plain text ─────────────────────────────────────

/**
 * Create a new PDF containing the redacted text.
 * Uses pdf-lib to build a clean, readable document.
 * @param {string} redactedText
 * @param {string} outputPath - Where to save the redacted PDF
 */
export async function buildRedactedPdf(redactedText, outputPath) {
  const pdfDoc = await PDFDocument.create()
  const font = await pdfDoc.embedFont(StandardFonts.Helvetica)
  const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold)

  const PAGE_WIDTH = 595
  const PAGE_HEIGHT = 842
  const MARGIN = 50
  const LINE_HEIGHT = 14
  const FONT_SIZE = 10
  const MAX_WIDTH = PAGE_WIDTH - MARGIN * 2

  // Strip any non-latin1 characters that Helvetica cannot render
  // pdf-lib standard fonts only support WinAnsi (latin-1) code points
  function sanitize(str) {
    return (str || '').replace(/[^\x00-\xFF]/g, '?')
  }

  const rawLines = redactedText.split('\n')
  const wrappedLines = []

  for (const rawLine of rawLines) {
    const trimmed = sanitize(rawLine.trimEnd())
    if (trimmed.length === 0) {
      wrappedLines.push('')
      continue
    }
    const words = trimmed.split(' ')
    let currentLine = ''
    for (const word of words) {
      const testLine = currentLine ? `${currentLine} ${word}` : word
      const testWidth = font.widthOfTextAtSize(testLine, FONT_SIZE)
      if (testWidth > MAX_WIDTH && currentLine) {
        wrappedLines.push(currentLine)
        currentLine = word
      } else {
        currentLine = testLine
      }
    }
    if (currentLine) wrappedLines.push(currentLine)
  }

  // ASCII-safe header (no Unicode box-drawing chars)
  const separator = '-'.repeat(70)
  const headerLines = [
    '! REDACTED DOCUMENT - Anonymous Mode Active',
    'Personal identifiers have been removed to protect patient privacy.',
    separator,
    '',
  ]
  const allLines = [...headerLines, ...wrappedLines]

  let page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
  let y = PAGE_HEIGHT - MARGIN

  for (let i = 0; i < allLines.length; i++) {
    if (y < MARGIN + LINE_HEIGHT) {
      page = pdfDoc.addPage([PAGE_WIDTH, PAGE_HEIGHT])
      y = PAGE_HEIGHT - MARGIN
    }

    const line = allLines[i]
    if (!line) { y -= LINE_HEIGHT; continue }

    const isHeader = i < 3
    const usedFont = isHeader ? boldFont : font
    const color = isHeader ? rgb(0.6, 0.1, 0.1) : rgb(0.1, 0.1, 0.1)

    try {
      page.drawText(line, {
        x: MARGIN,
        y,
        size: isHeader ? FONT_SIZE + 1 : FONT_SIZE,
        font: usedFont,
        color,
      })
    } catch {
      // Skip lines that still cause encoding issues after sanitization
    }
    y -= LINE_HEIGHT
  }

  const pdfBytes = await pdfDoc.save()
  fs.writeFileSync(outputPath, pdfBytes)
}

// ─── Main: process a record file for redaction ───────────────────────────────

/**
 * Given a record file path and patient info, produce a redacted PDF.
 * Returns the redacted file path, or null if the file cannot be processed
 * (e.g. scanned image PDF, non-PDF file).
 *
 * @param {object} opts
 * @param {string} opts.originalFilePath - Absolute path to the uploaded file
 * @param {string} opts.originalFileName - Stored filename (e.g. "abc123.pdf")
 * @param {string} opts.patientFullName - e.g. "John Doe"
 * @param {string} opts.patientEmail - e.g. "john@example.com"
 * @param {string} opts.patientPhone - e.g. "03001234567"
 * @returns {Promise<string|null>} - Absolute path to redacted PDF, or null
 */
export async function processRecordForRedaction({
  originalFilePath,
  originalFileName,
  patientFullName,
  patientEmail,
  patientPhone,
}) {
  // Only process PDFs for now
  const ext = path.extname(originalFileName).toLowerCase()
  if (ext !== '.pdf') {
    // For images/Word docs, we can't redact content — return null
    // The caller will block download for non-PDF files when anonymous
    return null
  }

  // Extract text
  const rawText = await extractPdfText(originalFilePath)
  if (!rawText) {
    // Scanned PDF — no text layer, cannot redact
    return null
  }

  // Build list of known PII to redact
  const knownNames = []
  if (patientFullName) {
    knownNames.push(patientFullName)
    // Also add individual name parts
    const parts = patientFullName.trim().split(/\s+/).filter((p) => p.length > 1)
    knownNames.push(...parts)
  }
  if (patientEmail) knownNames.push(patientEmail)
  if (patientPhone) knownNames.push(patientPhone)

  // Redact
  const redactedText = redactText(rawText, knownNames)

  // Build output path: same dir, filename prefixed with "redacted_"
  const dir = path.dirname(originalFilePath)
  const baseName = path.basename(originalFileName, ext)
  const redactedFileName = `redacted_${baseName}.pdf`
  const redactedFilePath = path.join(dir, redactedFileName)

  // Build the redacted PDF
  await buildRedactedPdf(redactedText, redactedFilePath)

  return redactedFilePath
}
