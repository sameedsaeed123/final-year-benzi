import { readFile } from 'fs/promises'
import { join, dirname } from 'path'
import { fileURLToPath } from 'url'

const __dirname = dirname(fileURLToPath(import.meta.url))
const LOGO_PATH = join(__dirname, '../assets/benzi-email-logo.png')

export const EMAIL_LOGO_CID = 'benzi-logo@benzi'

let cachedAttachment = null

export async function getBenziLogoAttachment() {
  if (cachedAttachment) return cachedAttachment
  try {
    const content = await readFile(LOGO_PATH)
    cachedAttachment = {
      filename: 'benzi-logo.png',
      content,
      cid: EMAIL_LOGO_CID,
      contentType: 'image/png',
      contentDisposition: 'inline',
    }
    return cachedAttachment
  } catch (err) {
    console.warn('[EmailLogo] Could not load logo file:', err.message)
    return null
  }
}

export function getBenziLogoCidSrc() {
  return `cid:${EMAIL_LOGO_CID}`
}
