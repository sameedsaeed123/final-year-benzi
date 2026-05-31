# Vector RAG integration plan (BENZI)

> **Status:** Phase 1 **implemented**. See [BENZI_VECTOR_RAG.md](./BENZI_VECTOR_RAG.md) for setup and accurate description.

**Can we do it?** Yes. Your app already has the right hooks: PDF extraction, per-patient records in MongoDB, and `buildPatientContext()` before every chat. Vector RAG replaces “dump last N PDFs into the prompt” with “retrieve the most relevant chunks for this question.”

---

## Current vs target

| | Today | With vector RAG |
|--|--------|------------------|
| Retrieval | Last 3–10 records by **date** | Top **k chunks** by **semantic similarity** |
| Storage | MongoDB + files on disk | Same + **vector index** (Chroma or MongoDB Atlas) |
| Chat | `aiContextBuilder` → prompt | `vectorSearch` → top chunks → prompt → Ollama |
| Fine-tune / Ollama | Unchanged | Unchanged |

---

## Recommended stack (FYP-friendly)

| Piece | Choice | Why |
|-------|--------|-----|
| Embeddings | **Ollama** `nomic-embed-text` or `mxbai-embed-large` | Local, no extra API cost, same machine as chat |
| Vector store | **Chroma** (local folder) **or** **MongoDB Atlas Vector Search** | Chroma = fastest to prototype; Atlas = one DB if you already use Atlas |
| Chunking | 500–800 tokens, 80–100 overlap | Good for clinical PDFs |
| Orchestration | **Node** in `benzi-server` (no separate Python service required) | Matches your API |

Alternative: small Python sidecar (`fyp-ml-demos/rag_service.py`) if you prefer LangChain — optional, not required.

---

## Where it plugs into your codebase

```text
recordController (upload PDF)
  → pdfRedactionService / extractPdfText  (already exists)
  → NEW: chunkText + embed + upsert vectors (patientUserId, recordId)

aiController.patientAiChat
  → buildPatientContext (keep goals, mood, short chat history)
  → NEW: vectorRetrieve(patientUserId, userMessage, k=5)
  → merge chunks into context.records
  → llmService → Ollama (unchanged)

aiContextBuilder.js
  → Use vector hits when RAG_ENABLED=true; else current date-based logic (fallback)
```

Env flags (future):

```env
RAG_ENABLED=true
RAG_PROVIDER=chroma
CHROMA_PATH=./data/chroma
OLLAMA_EMBED_MODEL=nomic-embed-text
RAG_TOP_K=5
```

---

## Phased rollout

### Phase 1 — Prototype (1–2 days, good for report “future work” demo)

- [ ] `ollama pull nomic-embed-text`
- [ ] On **one** record upload: chunk → embed → store in Chroma collection `benzi_patient_{patientUserId}`
- [ ] New `vectorRagService.js`: `indexRecord(recordId)`, `search(patientUserId, query, k)`
- [ ] In `patientAiChat`, if `RAG_ENABLED`, replace `records` slice with search results
- [ ] Log / return `ragChunksUsed` in API for demo transparency

**Demo script:** Upload 2 PDFs → ask “What medication was mentioned in my older report?” → show retrieved chunk titles in therapist/admin debug (optional).

### Phase 2 — Production hygiene (2–3 days)

- [ ] Re-index on record update/delete
- [ ] Background job (BullMQ — you already have Redis) for large PDFs so upload API stays fast
- [ ] Cache query embeddings for repeated questions (optional)
- [ ] Feature flag per therapist plan (`digitalContextAi` = full RAG)

### Phase 3 — Scale (post-FYP)

- [ ] MongoDB Atlas Vector Search instead of local Chroma
- [ ] Hybrid: vector top-k + OpenRouter brief only if total context still > threshold
- [ ] Evaluation set (10 Q&A pairs per patient type) for FYP metrics

---

## Performance on your Mac (2019 i9, 32 GB)

| Step | Rough time |
|------|------------|
| Embed 10-page PDF (~40 chunks) | ~30–90 s first time (CPU) |
| Per chat query (embed question + search) | ~1–3 s |
| Ollama reply | Same as now |

**Tip:** Index on upload in the background; chat only pays for **query embed + search**, not re-embedding whole PDFs.

---

## What to write in the FYP report

> We implemented **runtime context injection** from MongoDB and optional **document summarization** for long PDFs. **Semantic retrieval (vector RAG)** is designed and partially prototyped: clinical documents are chunked and embedded per patient; at query time the system retrieves the top-k relevant passages before local LLM inference (Ollama), improving accuracy when many reports exist.

If only Phase 1 is done, say **“architecture implemented; full rollout in future work.”**

---

## Dependencies (when you start Phase 1)

```bash
cd benzi-server
npm install chromadb
# Ollama: ollama pull nomic-embed-text
```

Chroma runs embedded (folder on disk). No cloud account required for the prototype.

---

## Risks / mitigations

| Risk | Mitigation |
|------|------------|
| Wrong chunks retrieved | Store `recordId`, `page`, `title` in metadata; show source in UI later |
| PHI in vector DB | Same access rules as MongoDB; encrypt disk; per-patient collection |
| Slow indexing | Async queue on upload |
| Ollama down | Fall back to date-based `aiContextBuilder` (keep current behavior) |

---

## Decision

| Goal | Recommendation |
|------|----------------|
| Viva in &lt; 2 weeks | Keep **hybrid Ollama + optional OpenRouter brief**; document this plan as **Phase 2** |
| Strong “ML pipeline” story | Do **Phase 1** prototype + 5-minute demo |
| Production | Phase 2 + Atlas vectors |

**Bottom line:** Integration is **straightforward** with your current architecture. You do not need to replace Ollama or MongoDB — you add an **indexing step on upload** and a **retrieval step before** `buildSystemInstruction`.
