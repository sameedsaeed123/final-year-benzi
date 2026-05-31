/**
 * Optional OpenRouter helper: compress large record text before Ollama chat.
 * Keeps Ollama as the only model patients "talk to"; cloud used only for briefing.
 *
 * Enable: LLM_PROVIDER=ollama + LLM_HELPER=openrouter + OPENROUTER_API_KEY
 */
import { summarizeRecordsBrief } from './openRouterService.js'

const briefCache = new Map()

function recordsFingerprint(records) {
  return (records || [])
    .map((r) => `${r.id || r.title}:${String(r.extractedText || '').length}`)
    .join('|')
}

function helperEnabled() {
  return (
    (process.env.LLM_HELPER || '').toLowerCase() === 'openrouter' &&
    Boolean(process.env.OPENROUTER_API_KEY)
  )
}

function totalRecordChars(records) {
  return (records || []).reduce((s, r) => s + String(r.extractedText || '').length, 0)
}

/**
 * When reports are very long, replace raw PDF dumps with a short factual brief (cached per patient).
 */
export async function prepareContextForOllama(patientUserId, context) {
  if (!helperEnabled()) return context

  const records = context.records || []
  const minChars = Number(process.env.LLM_HELPER_MIN_CHARS || 4500)
  if (totalRecordChars(records) < minChars) return context

  const fp = recordsFingerprint(records)
  const cached = briefCache.get(String(patientUserId))
  if (cached?.fp === fp) {
    return { ...context, records: cached.records, contextBriefFromHelper: true }
  }

  try {
    const brief = await summarizeRecordsBrief(records)
    if (!brief || brief.length < 40) return context

    const summaryRecords = [
      {
        id: 'helper-brief',
        type: 'summary',
        title: 'Summary of your clinical documents',
        description: 'Compressed for faster local AI; full files remain on file.',
        extractedText: brief.slice(0, 2800),
        hasPdfBody: true,
        therapistNotes: '',
      },
      ...records.slice(0, 1).map((r) => ({
        ...r,
        extractedText: String(r.extractedText || '').slice(0, 900),
      })),
    ]

    briefCache.set(String(patientUserId), { fp, records: summaryRecords })
    return { ...context, records: summaryRecords, contextBriefFromHelper: true }
  } catch (err) {
    console.warn('[ContextBrief] OpenRouter helper failed, using direct Ollama context:', err.message)
    return context
  }
}
