/** Shared prompts for BENZI AI (OpenRouter / Gemini). */

function formatRecordBlock(r, index) {
  const header = `--- CLINICAL DOCUMENT ${index + 1}: ${r.title} (${r.type}) ---`
  const meta = [
    r.description && `Summary: ${r.description}`,
    r.therapistNotes && `Therapist notes on file: ${r.therapistNotes}`,
  ]
    .filter(Boolean)
    .join('\n')

  const bodyLabel = r.hasPdfBody
    ? 'FULL TEXT EXTRACTED FROM PDF:'
    : 'PDF text unavailable — use metadata only:'

  return `${header}
${meta ? `${meta}\n` : ''}${bodyLabel}
${r.extractedText || '(empty)'}
--- end document ${index + 1} ---`
}

function formatAnalyticsBlock(summary) {
  if (!summary) return ''
  return `PATIENT WELLNESS SNAPSHOT (from BENZI chats & goals):
- Wellness score: ${summary.taskScore ?? 0}%
- Goal progress: ${summary.goalProgressPct ?? 0}%
- Recent mood trend: ${summary.dominantMood || 'neutral'}
- AI check-ins: ${summary.aiMessageCount ?? 0} messages
- Sentiment mix: +${summary.sentiment?.positive ?? 0} / neutral ${summary.sentiment?.neutral ?? 0} / −${summary.sentiment?.negative ?? 0}`
}

export function buildSystemInstruction(context) {
  const records = context.records || []
  const recordsBlock = records.map((r, i) => formatRecordBlock(r, i)).join('\n\n')

  const goalsBlock = (context.goals || [])
    .map((g) => `- ${g.title} (${g.status}, ${g.priority})${g.description ? `: ${g.description}` : ''}`)
    .join('\n')

  const analyticsBlock = formatAnalyticsBlock(context.analyticsSummary)

  return `You are BENZI — a warm human therapy companion (not a lecture bot). You sound like a skilled counselor in a secure messaging session.

VOICE & LENGTH (critical):
- Write like a real therapist in chat: short, natural, emotionally attuned.
- Usually **2–4 sentences** OR **1 short paragraph + 1 gentle question**.
- Use "you" language. Reflect feelings before giving information.
- Never use bullet essays unless the patient asked for a list.
- No "As an AI language model", no long disclaimers, no markdown headers.

WHAT YOU DO:
- Explain their reports/prescriptions in plain words when asked — use PDF extracts below.
- Connect insights to their active goals when relevant.
- Invite reflection with one question when appropriate.

${analyticsBlock}

CLINICAL DOCUMENTS:
${recordsBlock || 'No documents on file yet.'}

ACTIVE GOALS:
${goalsBlock || 'None yet.'}

RULES:
1. Ground answers in PDF extracts and goals — do not invent clinical facts.
2. You support understanding; you are not their licensed clinician.
3. Crisis/self-harm → urge emergency services and their therapist immediately.
4. If they ask what a report says, summarize key points from the PDF text clearly but briefly.`
}

export function buildGoalRecommendationPrompt(context, patientDraft = '') {
  const recordsBlock = (context.records || [])
    .map((r, i) => `Doc ${i + 1} [${r.type}] ${r.title}: ${(r.extractedText || r.description || '').slice(0, 900)}`)
    .join('\n')

  const goalsBlock = (context.goals || []).map((g) => `${g.title} (${g.status})`).join(', ')
  const stats = context.analyticsSummary
  const statsLine = stats
    ? `Stats: wellness ${stats.taskScore}%, goals ${stats.goalProgressPct}%, mood ${stats.dominantMood}, ${stats.aiMessageCount} AI chats.`
    : ''

  const draftLine = patientDraft
    ? `Patient is considering this personal goal: "${patientDraft}"`
    : ''

  return `Suggest exactly 3 small, actionable therapy goals for this patient. Keep titles short (max 6 words).

${statsLine}

DOCUMENTS:
${recordsBlock || 'None'}

EXISTING GOALS:
${goalsBlock || 'None'}

${draftLine}

Return ONLY JSON array. Do NOT wrap titles or descriptions in quotes or markdown (no **bold**, no "quotes"):
[{"title":"Limit Stressors","description":"one short sentence","priority":"high|medium|low"}]`
}

export function buildPatientInsightPrompt(context, patientDraft = '') {
  const topRecord = (context.records || []).find((r) => r.hasPdfBody)
  const snippet = topRecord?.extractedText?.slice(0, 400) || ''
  const stats = context.analyticsSummary || {}

  return `Write a brief personalized insight for a patient on a mental health app.

Their data:
- Wellness: ${stats.taskScore ?? 0}%, goal progress: ${stats.goalProgressPct ?? 0}%
- Mood from chats: ${stats.dominantMood || 'neutral'}
- Active goals: ${(context.goals || []).map((g) => g.title).join(', ') || 'none'}
${patientDraft ? `- Goal they are writing: "${patientDraft}"` : ''}
${snippet ? `- Latest report excerpt: ${snippet}` : ''}

Respond in JSON only:
{"insight":"2-3 warm sentences tying their data together","tips":["short tip 1","short tip 2"]}`
}
