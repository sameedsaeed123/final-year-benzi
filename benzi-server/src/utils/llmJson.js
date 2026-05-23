/** Parse JSON from LLM text (strip markdown fences). */
export function parseLlmJson(raw) {
  const jsonStr = String(raw || '')
    .replace(/^```json?\s*/i, '')
    .replace(/```\s*$/i, '')
    .trim()
  return JSON.parse(jsonStr)
}

/** Gemini-style history → OpenAI/Ollama messages */
export function historyToChatMessages(history) {
  return (history || []).map((h) => ({
    role: h.role === 'model' ? 'assistant' : 'user',
    content: h.parts?.[0]?.text || h.text || '',
  }))
}
