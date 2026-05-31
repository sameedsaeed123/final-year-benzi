# BENZI LLM strategy — speed + context (recommended)

## Recommended setup (your Mac + FYP)

| Layer | Tool | Role |
|-------|------|------|
| **Patient chat replies** | **Ollama** `benzi-finetuned` | Local, private, demo-friendly |
| **Output safety** | **Rules** (`textSanitize.js`, crisis rules) | Free, instant — not OpenRouter |
| **Mood from chat** | **DistilBERT** or keywords | Optional `SENTIMENT_SERVICE_URL` |
| **Large PDF context** | **OpenRouter** (optional helper) | One cheap call to **summarize** reports, then Ollama chats on the brief |
| **Goals / JSON** | Ollama or OpenRouter | Keep Ollama if possible; use OpenRouter only if JSON quality suffers |

OpenRouter is **not** used for every message — only when report text is large (see below).

## `.env` — balanced (speed + context)

```env
LLM_PROVIDER=ollama
OLLAMA_MODEL=benzi-finetuned
OLLAMA_NUM_CTX=2048
OLLAMA_MAX_TOKENS=220
OLLAMA_MAX_RECORDS=4
OLLAMA_RECORD_CHARS=1800
OLLAMA_HISTORY_MESSAGES=8

# Optional: compress huge reports once, then fast Ollama chat
LLM_HELPER=openrouter
LLM_HELPER_MIN_CHARS=4500
OPENROUTER_API_KEY=your_key
OPENROUTER_MODEL=openai/gpt-4o-mini
```

Restart API after changes.

## What “sanitize” means today

- **Input:** crisis detection (rules), trim length, optional PDF brief (helper).
- **Output:** `sanitizeChatReply()` strips markdown/quotes and enforces therapist boundaries.

No need for OpenRouter to “sanitize” normal chat — that adds latency and cost.

## Hybrid flow (when `LLM_HELPER=openrouter`)

```text
Patient message
  → Build context (MongoDB records, goals, history)
  → If total PDF text > LLM_HELPER_MIN_CHARS:
        OpenRouter writes a short factual brief (cached per patient)
  → Ollama generates reply (short, local)
  → Rule-based sanitize + save sentiment / mood log
```

First message with big reports: slower (brief + Ollama). Later messages: brief cached → faster.

## Modes

| Mode | When |
|------|------|
| **Ollama only** | No `LLM_HELPER`, or small reports — fastest |
| **Hybrid** | Many/long PDFs — best context on slow hardware |
| **OpenRouter only** | `LLM_PROVIDER=openrouter` — fastest cloud, not “local AI” for viva |

## Check health

```bash
curl -s http://127.0.0.1:5000/api/ai/health
```

Look for `"provider": "ollama"` and `"helper": "openrouter"` when hybrid is on.
