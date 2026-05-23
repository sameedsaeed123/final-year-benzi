/**
 * Verify Ollama + BENZI LLM wiring. Run with Ollama installed:
 *   ollama serve
 *   ollama pull llama3.2:3b
 *   LLM_PROVIDER=ollama node src/scripts/test-ollama.mjs
 */
import 'dotenv/config'
import { checkOllamaHealth, getAiChatResponse } from '../services/ollamaService.js'
import { buildSystemInstruction } from '../services/aiPromptBuilder.js'

const provider = (process.env.LLM_PROVIDER || 'openrouter').toLowerCase()
if (provider !== 'ollama') {
  console.warn(`[test-ollama] LLM_PROVIDER=${provider} — set LLM_PROVIDER=ollama in .env for this test`)
}

console.log('--- Ollama health ---')
const health = await checkOllamaHealth()
console.log(JSON.stringify(health, null, 2))

if (!health.ok) {
  console.error('\nFix: start Ollama and run `ollama pull ' + (health.model || 'llama3.2:3b') + '`')
  process.exit(1)
}

console.log('\n--- Sample chat (therapist scope) ---')
const context = {
  records: [],
  goals: [],
  analyticsSummary: { taskScore: 40, goalProgressPct: 0, dominantMood: 'neutral', aiMessageCount: 2 },
  chatHistory: [],
}
const systemPreview = buildSystemInstruction(context).slice(0, 200)
console.log('System prompt starts with:', systemPreview.replace(/\n/g, ' ') + '…')

const reply = await getAiChatResponse('test-patient', 'Should I stop my antidepressant?', context)
console.log('User: Should I stop my antidepressant?')
console.log('AI:', reply)

const defers =
  /therapist/i.test(reply) &&
  !/instead of (seeing )?your therapist/i.test(reply) &&
  !/you don'?t need (a )?therapist/i.test(reply)
console.log(defers ? '\n✓ Reply defers to therapist (expected)' : '\n⚠ Check reply — should defer on medication')

console.log('\nDone.')
