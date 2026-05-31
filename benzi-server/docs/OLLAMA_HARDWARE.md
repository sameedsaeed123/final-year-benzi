# Ollama — which machine, daily workflow, fast setup

## Which laptop?

| Machine | RAM | Best for |
|---------|-----|----------|
| **MacBook 2019 i9** | **32 GB** | Daily dev, faster Ollama, empathy **fine-tuning** (QLoRA) |
| **Dell Inspiron** | 8 GB + 2 GB GPU | FYP **demo only** — small models (`llama3.2:3b`, `gemma2:2b`) |

**Recommendation:** Code on the **Mac**. Use the **Dell** only when you must show “local ML, no cloud” to an examiner.

---

## Stop Ollama so your Mac stays fast (daily work)

Ollama uses RAM even when idle (loaded model + background server). You have **three** levels:

### Option A — Best for normal coding (no AI testing)

Keep Ollama **quit** and use cloud AI in `.env`:

```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your_key
```

Comment out or remove `LLM_PROVIDER=ollama`. Your app works; BENZI AI uses the cloud. **Zero local LLM RAM.**

### Option B — Unload the model from RAM (keep Ollama app open)

Frees several GB without quitting the app:

```bash
cd benzi-server
npm run ollama:unload
```

Or manually:

```bash
ollama ps
ollama stop llama3.2:3b   # use the name shown in ollama ps
```

### Option C — Fully quit Ollama (maximum RAM back)

```bash
cd benzi-server
npm run ollama:quit
```

**macOS:** Menu bar → Ollama icon → **Quit Ollama**, or run the command above.

**When you need AI again:**

```bash
cd benzi-server
npm run ollama:start    # opens Ollama app on Mac
npm run test:ollama     # verify
```

---

## First setup on Mac (32 GB) — fast responses

### 1. Install Ollama

https://ollama.com → install → **do not** leave it running 24/7 if you want a fast laptop.

### 2. Pull a **fast** model (start here)

```bash
cd benzi-server
npm run ollama:pull-fast
```

This pulls **`llama3.2:3b`** (good default). For even faster (slightly weaker) replies:

```bash
ollama pull gemma2:2b
```

### 3. Copy fast Mac profile into `.env`

```bash
cp benzi-server/.env.example benzi-server/.env
```

Use this block when testing local AI:

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_NUM_CTX=2048
```

`OLLAMA_NUM_CTX=2048` is enough for BENZI’s context builder and keeps generation **snappier** than 4096. Raise to `4096` only for demos if quality matters more than speed.

### 4. Verify once

```bash
cd benzi-server
npm run ollama:start
npm run test:ollama
```

### 5. When done testing — free RAM

```bash
npm run ollama:unload
# or
npm run ollama:quit
```

---

## Model speed vs quality (Mac 32 GB)

| Model | Speed | Quality | When to use |
|-------|-------|---------|-------------|
| `gemma2:2b` | Fastest | OK | Quick UI tests |
| **`llama3.2:3b`** | **Fast** | **Good** | **Default FYP + daily AI tests** |
| `phi3:mini` | Fast | Good empathy tone | Try if you want warmer short replies |
| `qwen2.5:3b-instruct` | Medium | Strong instruct | Alternative base for fine-tune |
| `llama3.1:8b` | Slower | Better | Mac only, close other apps |

---

## Context-aware in BENZI (no extra model needed)

Your app already injects patient context (reports, goals, chat history) **before** Ollama runs. A **3B** model + `OLLAMA_NUM_CTX=2048` + good prompts is enough for FYP **inference**.

Empathy **fine-tuning** is a separate step — see [OLLAMA_FINETUNE_DATASETS.md](./OLLAMA_FINETUNE_DATASETS.md).

---

## Dell 8 GB reminder

- Only `llama3.2:3b` or `gemma2:2b`
- `OLLAMA_NUM_CTX=2048`
- Quit browsers while demoing
- Do **not** fine-tune on the Dell

---

## Related docs

- [OLLAMA_SETUP.md](./OLLAMA_SETUP.md) — install & health checks  
- [OLLAMA_FINETUNE_DATASETS.md](./OLLAMA_FINETUNE_DATASETS.md) — datasets & QLoRA on Mac  
- [../../FYP_OLLAMA_QUICKSTART.md](../../FYP_OLLAMA_QUICKSTART.md) — quick commands  
