import fs from 'fs'
import { getOpenRouterAttributionHeaders } from '../utils/appBranding.js'
import { normalizeOpenRouterError } from './openRouterService.js'

const OPENROUTER_URL = 'https://openrouter.ai/api/v1/chat/completions'

const MODERATION_MODEL =
  process.env.OPENROUTER_MODERATION_MODEL ||
  process.env.OPENROUTER_MODEL ||
  'openai/gpt-4o-mini'

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

export async function moderateChatImageFile(filePath, mimeType) {
  const key = process.env.OPENROUTER_API_KEY
  if (!key) {
    const err = new Error('Image safety check is unavailable. Set OPENROUTER_API_KEY on the server.')
    err.statusCode = 503
    throw err
  }

  const buffer = fs.readFileSync(filePath)
  if (buffer.length > 5 * 1024 * 1024) {
    const err = new Error('Image is too large for safety screening')
    err.statusCode = 400
    throw err
  }

  const dataUrl = `data:${mimeType};base64,${buffer.toString('base64')}`

  try {
    const res = await fetch(OPENROUTER_URL, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${key}`,
        'Content-Type': 'application/json',
        ...getOpenRouterAttributionHeaders(),
      },
      body: JSON.stringify({
        model: MODERATION_MODEL,
        messages: [
          {
            role: 'user',
            content: [
              { type: 'text', text: MODERATION_PROMPT },
              { type: 'image_url', image_url: { url: dataUrl } },
            ],
          },
        ],
        max_tokens: 256,
        temperature: 0,
      }),
    })

    const data = await res.json().catch(() => ({}))
    if (!res.ok) {
      const detail = data?.error?.message || data?.message || res.statusText
      const err = new Error(`OpenRouter ${res.status}: ${detail}`)
      err.statusCode = res.status >= 500 ? 503 : res.status
      throw err
    }

    const raw = data?.choices?.[0]?.message?.content
    const parsed = parseModerationJson(raw)
    if (!parsed || typeof parsed.safe !== 'boolean') {
      const err = new Error('Could not verify image safety. Please try another image.')
      err.statusCode = 503
      throw err
    }

    if (!parsed.safe) {
      const err = new Error(
        parsed.reason ||
          'This image was blocked because it may contain explicit or sexual content.'
      )
      err.statusCode = 400
      err.code = 'IMAGE_BLOCKED'
      throw err
    }

    return { safe: true }
  } catch (e) {
    if (e.code === 'IMAGE_BLOCKED') throw e
    throw normalizeOpenRouterError(e)
  }
}
