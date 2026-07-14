/**
 * Context preparation for local Ollama chat.
 *
 * Patients only ever "talk to" the local Ollama model. Records are trimmed for
 * the local context window directly in ollamaService (trimContextForOllama);
 * no cloud LLM is used to pre-summarise clinical text.
 */
export async function prepareContextForOllama(_patientUserId, context) {
  return context
}
