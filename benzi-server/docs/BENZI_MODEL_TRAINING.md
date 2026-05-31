# BENZI model — training & deployment

## Model choice (local, fast, context-aware)

| Setting | Value | Why |
|---------|--------|-----|
| **Base** | `llama3.2:3b` | Best speed/quality on 32 GB Intel Mac; same family as Ollama default |
| **Context window** | `2048` (`OLLAMA_NUM_CTX`) | Faster replies; app injects patient records in the prompt |
| **Deployed name** | `benzi-finetuned` | Custom Ollama model for demos and `.env` |
| **App context** | `aiContextBuilder` + `aiPromptBuilder` | PDF text, goals, chat history — true context awareness |

Gemma 2B is faster but weaker for empathy/clinical boundaries. Larger 7B+ models are too slow on this hardware.

## Run full pipeline (Mac)

```bash
cd fyp-ml-demos
chmod +x finetune/train-benzi.sh
./finetune/train-benzi.sh
```

Or from repo root:

```bash
npm run train:benzi
```

## What this does

1. **Dataset** — Empathetic Dialogues + Counsel Chat (~800 pairs) → `finetune/data/`
2. **LoRA fine-tune** — empathy/guardrail alignment → `finetune/adapters/benzi-lora`
3. **Merge** — combined weights → `finetune/merged/benzi-empathetic-hf`
4. **Ollama** — `benzi-finetuned` from `llama3.2:3b` + BENZI system profile
5. **Smoke test** — medication-boundary check via `test-ollama.mjs`

## Use in the app

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=benzi-finetuned
OLLAMA_NUM_CTX=2048
```

```bash
cd benzi-server && npm run dev
```

## Tell your advisor

> We fine-tuned on curated mental-health dialogue data (LoRA) and deployed a local **Llama 3.2 3B** model as **benzi-finetuned** in Ollama. Patient-specific context is injected at runtime from MongoDB (records, goals, history), with crisis detection and sentiment analytics in the API layer.

Artifacts to show: `finetune/data/benzi_train.jsonl`, `finetune/adapters/benzi-lora`, `ollama list` showing `benzi-finetuned`.
