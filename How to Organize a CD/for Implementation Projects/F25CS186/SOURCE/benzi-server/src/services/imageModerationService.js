import fs from 'fs'
import { normalizeOllamaError } from './ollamaService.js'

/**
 * Local image safety screening for therapist-chat uploads via an Ollama vision
 * model (e.g. llava / llama3.2-vision). Keeps moderation on our own server — no
 * image is sent to a third-party cloud API.
 *
 * Requires: ollama pull llava   (or set OLLAMA_VISION_MODEL)
 */

const DEFAULT_BASE = 'http://127.0.0.1:11434'

function ollamaBase() {
  return (process.env.OLLAMA_BASE_URL || DEFAULT_BASE).replace(/\/$/, '')
}

function visionModel() {
  return process.env.OLLAMA_VISION_MODEL || 'llava'
}

const MODERATION_PROMPT = `You are a strict content safety classifier for a clinical therapy chat app.
Analyze the image. Reply with JSON only, no markdown:
{"safe":true|false,"reason":"short explanation"}

Set safe to false if the image contains ANY of:
- nudity or exposed genitals/breasts
- sexual acts or pornography
- sexually explicit or suggestive posing meant to arouse
- hate symbols or graphic violence (also unsafe)

Set safe to true for: normal photos, medical/clinical images without nudity, documents, nature, faces fully clothed, therapy-related content.`

function parseModerationJson(raw) {
  const text = String(raw || '').trim()
  const start = text.indexOf('{')
  const end = text.lastIndexOf('}')
  if (start === -1 || end === -1) return null
  try {
    return JSON.parse(text.slice(start, end + 1))
  } catch {
    return null
  }
}

export async function moderateChatImageFile(filePath, _mimeType) {
  const buffer = fs.readFileSync(filePath)
  if (buffer.length > 5 * 1024 * 1024) {
    const err = new Error('Image is too large for safety screening')
    err.statusCode = 400
    throw err
  }

  // Ollama expects raw base64 (no data: prefix) in the images array.
  const base64 = buffer.toString('base64')

  try {
    const res = await fetch(`${ollamaBase()}/api/chat`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        model: visionModel(),
        stream: false,
        messages: [{ role: 'user', content: MODERATION_PROMPT, images: [base64] }],
        options: { temperature: 0 },
      }),
      signal: AbortSignal.timeout(60000),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const detail = data?.error || data?.message || res.statusText
      const err = new Error(`Ollama vision ${res.status}: ${detail}`)
      err.statusCode = res.status >= 500 ? 503 : res.status
      throw err
    }

    const raw = data?.message?.content
    const parsed = parseModerationJson(raw)
    if (!parsed || typeof parsed.safe !== 'boolean') {
      const err = new Error('Could not verify image safety. Please try another image.')
      err.statusCode = 503
      throw err
    }

    if (!parsed.safe) {
      const err = new Error(
        parsed.reason || 'This image was blocked because it may contain explicit or sexual content.'
      )
      err.statusCode = 400
      err.code = 'IMAGE_BLOCKED'
      throw err
    }

    return { safe: true }
  } catch (e) {
    if (e.code === 'IMAGE_BLOCKED') throw e
    throw normalizeOllamaError(e)
  }
}
