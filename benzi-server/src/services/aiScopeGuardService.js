/**
 * Guardrails for BENZI AI when patient context is empty or a message is out of scope.
 */

export const ZERO_CONTEXT_OUT_OF_SCOPE_REPLY =
  "That's not in my context yet — I don't have your reports or therapy notes on file. Please speak with your therapist about this."

export const OUT_OF_SCOPE_THERAPIST_REPLY =
  "That's outside what I can help with safely. Please ask your therapist — they know your care best."

const CLINICAL_PATTERNS = [
  /\b(diagnos(e|is|ed|ing)?|disorder|schizophren|bipolar|ocd|adhd|ptsd|autism|psychosis)\b/i,
  /\b(medication|medicine|meds|dosage|dose|prescri(ption|be|bed)?|antidepress|antipsych|benzo|ssri|snri)\b/i,
  /\b(xanax|prozac|lexapro|zoloft|sertraline|fluoxetine|escitalopram|bupropion|lamotrigine)\b/i,
  /\b(should i (stop|start|take|change|increase|decrease|switch|quit))\b/i,
  /\b(side effect|withdrawal|taper(ing)?|cold turkey)\b/i,
  /\b(treatment plan|therapy plan|care plan)\b/i,
  /\b(am i (depressed|anxious|bipolar|sick)|do i have)\b/i,
]

const RECORDS_PATTERNS = [
  /\b(my (report|prescription|diagnosis|records|test results|lab|scan|file|document))\b/i,
  /\b(explain|summarize|what does|tell me about) .{0,40}(report|prescription|document|pdf|record)\b/i,
  /\b(what (did|does) (my )?(doctor|therapist|psychiatrist) (say|write|prescribe))\b/i,
]

const OFF_TOPIC_PATTERNS = [
  /\b(weather|recipe|cook|football|cricket|bitcoin|crypto|stock market)\b/i,
  /\b(python|javascript|code|programming|homework|math problem|equation)\b/i,
  /\b(who (is|was|are)|capital of|tell me about (history|science|politics|celebrity))\b/i,
  /\b(legal|lawyer|custody|lawsuit|court case)\b/i,
  /\b(covid|vaccine|surgery|chemotherapy|insulin|blood pressure|diabetes)\b/i,
]

const SIMPLE_CHECKIN_PATTERNS = [
  /^(hi|hello|hey|salam|assalam|good morning|good evening|good night|thanks|thank you|ok|okay|yes|no)[!.?\s]*$/i,
  /\b(feeling (sad|down|low|anxious|stressed|overwhelmed|lonely|tired)|bad day|rough day|hard day)\b/i,
  /\b(can'?t sleep|didn'?t sleep|feeling low|not okay|not ok)\b/i,
]

/** True when there is usable patient data for context-aware replies. */
export function hasPatientAiContext(context = {}) {
  const hasPdfRecords = (context.records || []).some((r) => r.hasPdfBody)
  const hasRag = Boolean(context.ragUsed && context.ragChunkCount > 0)
  const hasGoals = (context.goals || []).length > 0
  const hasHistory = (context.chatHistory || []).length > 0
  return hasPdfRecords || hasRag || hasGoals || hasHistory
}

export function isSimpleEmotionalCheckIn(text) {
  const t = String(text || '').trim()
  if (!t) return false
  if (t.length > 220) return false
  return SIMPLE_CHECKIN_PATTERNS.some((p) => p.test(t))
}

export function isClinicalOrTherapistQuestion(text) {
  const t = String(text || '').trim()
  if (!t) return false
  return CLINICAL_PATTERNS.some((p) => p.test(t))
}

export function isRecordsQuestion(text) {
  const t = String(text || '').trim()
  if (!t) return false
  return RECORDS_PATTERNS.some((p) => p.test(t))
}

export function isOffTopicQuestion(text) {
  const t = String(text || '').trim()
  if (!t) return false
  return OFF_TOPIC_PATTERNS.some((p) => p.test(t))
}

/**
 * Decide whether to skip the LLM and return a fixed therapist-deferral reply.
 * @returns {{ refuse: boolean, reason?: string, reply?: string }}
 */
export function evaluateAiScopeGuard(text, context = {}) {
  const trimmed = String(text || '').trim()
  if (!trimmed) return { refuse: false }

  const hasContext = hasPatientAiContext(context)
  const clinical = isClinicalOrTherapistQuestion(trimmed)
  const records = isRecordsQuestion(trimmed)
  const offTopic = isOffTopicQuestion(trimmed)
  const simpleCheckIn = isSimpleEmotionalCheckIn(trimmed)

  // Always defer clinical / medication / diagnosis questions to therapist.
  if (clinical) {
    return {
      refuse: true,
      reason: 'clinical',
      reply: hasContext ? OUT_OF_SCOPE_THERAPIST_REPLY : ZERO_CONTEXT_OUT_OF_SCOPE_REPLY,
    }
  }

  // No reports on file — don't pretend to know their documents.
  if (records && !hasContext) {
    return { refuse: true, reason: 'records_no_context', reply: ZERO_CONTEXT_OUT_OF_SCOPE_REPLY }
  }

  // Cold start with zero context: only allow brief emotional check-ins, not general Q&A.
  if (!hasContext && !simpleCheckIn) {
    if (offTopic) {
      return {
        refuse: true,
        reason: 'off_topic_no_context',
        reply: ZERO_CONTEXT_OUT_OF_SCOPE_REPLY,
      }
    }
    // Substantive questions without any patient data on file.
    if (trimmed.includes('?') || trimmed.length > 120) {
      return {
        refuse: true,
        reason: 'question_no_context',
        reply: ZERO_CONTEXT_OUT_OF_SCOPE_REPLY,
      }
    }
  }

  if (offTopic) {
    return {
      refuse: true,
      reason: 'off_topic',
      reply: OUT_OF_SCOPE_THERAPIST_REPLY,
    }
  }

  return { refuse: false }
}
