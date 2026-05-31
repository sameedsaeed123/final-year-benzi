# BENZI FYP — completion status (honest %)

_Last updated for planning / viva — not a grade guarantee._

## Overall project

| Area | Done | Notes |
|------|------|--------|
| **Full platform** (patient / therapist / admin, auth, Stripe, chat, appointments) | **~92%** | Production-style FYP scope |
| **BENZI AI pipeline** (context, Ollama, RAG, crisis, mood) | **~88%** | Core path works; polish optional |
| **ML model training** (full 3B LoRA in Ollama weights) | **~25%** | Demo + Modelfile; not merged GGUF in Ollama |
| **Vector RAG** | **~85%** | Local search **done**; Atlas **coded**, needs Atlas cluster to activate |

### **Overall FYP readiness: ~85–90%** for demo + report  
### **Remaining for “100% research vision”: ~10–15%** (optional items below)

---

## “Training” — what is actually trained?

| Item | % complete | What you have |
|------|------------|----------------|
| **LoRA fine-tune (empathy data)** | **~40–90%** | Run `./fyp-ml-demos/finetune/run_train_3h.sh` → **~90%** when `benzi-empathetic-trained` exists |
| **Production 3B LoRA → Ollama** | **~10–85%** | After `run_train_3h.sh` + `OLLAMA_MODEL=benzi-empathetic-trained` |
| **Ollama `benzi-finetuned`** | **~70%** | Custom Modelfile + `llama3.2:3b` (prompt/params, **not** new weights) |
| **DistilBERT sentiment** | **~80%** | Service exists; optional `SENTIMENT_SERVICE_URL` |
| **Crisis rules** | **~95%** | Rule-based, wired in chat |
| **RAG embeddings** | **~90%** | Index + search; run `rag:reindex` |

**Honest sentence for examiner:**  
> “We **fine-tuned a small model** to validate the LoRA pipeline and curated empathy datasets; the **deployed** assistant uses **Llama 3.2 3B** with a **BENZI-aligned Ollama profile**, **embedding-based RAG**, and **server-side safety** layers.”

---

## Context awareness — what works today

| Layer | Status |
|-------|--------|
| MongoDB records + PDF text | Yes |
| Goals + chat history in prompt | Yes |
| Vector RAG (semantic chunks) | Yes (local cosine on your DB) |
| OpenRouter brief for huge PDFs | Yes (optional `LLM_HELPER`) |
| Atlas vector search | **Code yes** — **active only on Atlas URI** |

---

## Remaining work (priority order)

| Priority | Task | Effort | Impact |
|----------|------|--------|--------|
| 1 | Run `npm run rag:reindex` + test RAG in chat | 30 min | High |
| 2 | Viva demo script + 5 test questions | 1 h | High |
| 3 | Migrate to **MongoDB Atlas** + create vector index | 2–4 h | Enables Atlas search |
| 4 | Full **3B LoRA → GGUF → Ollama** (Colab) | 1–2 days | “Fully trained” claim |
| 5 | UI: show “Using your records (RAG)” on chat | 2–3 h | UX |
| 6 | BullMQ background indexer | 1 day | Scale |

---

## Your Mac vs Atlas

- **Now:** Local RAG + Ollama = good FYP demo on self-hosted Mongo.
- **Smoother at scale:** Atlas + `$vectorSearch` when you move `MONGODB_URI` to Atlas.

Code path: `vectorRagSearch.js` → Atlas try → **fallback** local cosine.
