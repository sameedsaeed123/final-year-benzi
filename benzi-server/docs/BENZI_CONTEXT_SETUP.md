# Better context (no 12-hour train) — recommended

Your replies are already good. For **more context** use **`benzi-finetuned`** (Llama 3.2 3B) + **RAG** + larger window — not full 3B retraining.

## 1. `.env` (copy this block)

```env
LLM_PROVIDER=ollama
OLLAMA_MODEL=benzi-finetuned
OLLAMA_NUM_CTX=4096
OLLAMA_MAX_TOKENS=280

OLLAMA_MAX_RECORDS=5
OLLAMA_RECORD_CHARS=2400
OLLAMA_HISTORY_MESSAGES=10

RAG_ENABLED=true
RAG_VECTOR_BACKEND=local
RAG_TOP_K=6
LLM_HELPER=openrouter
LLM_HELPER_MIN_CHARS=5000
```

Restart API after saving.

## 2. Index your PDFs (once)

```bash
cd benzi-server
npm run ollama:pull-embed
npm run rag:reindex
```

## 3. What each piece does

| Setting | Effect |
|---------|--------|
| `OLLAMA_NUM_CTX=4096` | Bigger prompt window (more history + records) |
| `OLLAMA_MAX_RECORDS` / `CHARS` | More report text per message |
| `RAG_TOP_K=6` | Semantic search pulls 6 best chunks |
| `LLM_HELPER` | Summarizes huge PDFs before Ollama |

## 4. Optional light train (~2–3h)

Only if you want a “we trained” checkpoint — **not required** for context:

```bash
cd fyp-ml-demos
./finetune/run_train_lite.sh
```

Uses **1.5B** model (~2–3h). For daily demo, keep **`benzi-finetuned`** + settings above.

## FYP wording

> We use **embedding-based RAG** and an enlarged context window for patient-specific retrieval; optional **LoRA** on a smaller instruct model validated the training pipeline.
