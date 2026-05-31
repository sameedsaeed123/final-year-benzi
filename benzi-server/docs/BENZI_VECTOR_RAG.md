# Vector RAG (implemented)

## What it is (accurate)

**True semantic RAG** is enabled when `RAG_ENABLED=true`:

1. **Index** — On record upload (or after PDF redaction), text is chunked, embedded with **Ollama `nomic-embed-text`**, stored in MongoDB collection **`RecordChunk`**.
2. **Retrieve** — On each BENZI chat message, the patient’s question is embedded and matched by **cosine similarity** against their chunks (top **k**, default 5).
3. **Generate** — Retrieved excerpts are injected into the system prompt; **Ollama `benzi-finetuned`** writes the reply.

Vectors live in **MongoDB** (`RecordChunk`). Search modes:

- **Local** (your current server): cosine similarity in Node — **active now**
- **Atlas** (`$vectorSearch`): **implemented** — activates when `MONGODB_URI` is Atlas; see [ATLAS_VECTOR_SEARCH.md](./ATLAS_VECTOR_SEARCH.md)

If RAG is off, fails, or finds no matches, behavior falls back to **recent records by date** (previous design).

## Setup

```bash
# 1. Embedding model (once)
cd benzi-server
npm run ollama:pull-embed

# 2. .env
RAG_ENABLED=true
OLLAMA_EMBED_MODEL=nomic-embed-text

# 3. Index existing uploads
npm run rag:reindex

# 4. Restart API
npm run dev
```

## Verify

```bash
curl -s http://127.0.0.1:5000/api/ai/health | python3 -m json.tool
```

Look for `"rag": { "enabled": true, "ok": true, "chunkCount": ... }`.

After a BENZI chat message, API response may include:

```json
"rag": { "used": true, "chunks": 3 }
```

## Files

| File | Role |
|------|------|
| `src/models/RecordChunk.js` | Stored chunks + embeddings |
| `src/services/embeddingService.js` | Ollama `/api/embeddings` |
| `src/services/vectorRagService.js` | Chunk, index, search, delete |
| `src/services/recordTextForRag.js` | PDF text extraction for indexing |
| `src/services/aiContextBuilder.js` | Uses RAG hits when `ragQuery` set |
| `src/scripts/rag-reindex.mjs` | Backfill index |

## FYP wording

> We implemented **embedding-based retrieval (RAG)**: clinical documents are chunked and stored with **Ollama embeddings** in MongoDB; at query time the system retrieves semantically relevant passages before **local LLM inference**, improving answers when patients have multiple or older reports.

## Limits (honest)

- Search scans up to **400 chunks per patient** in Node (fine for FYP scale).
- First-time PDF indexing is **CPU-heavy** (runs in background after upload).
- Requires **Ollama** running with `nomic-embed-text`.

Future: MongoDB Atlas Vector Search or background queue (BullMQ) for large deployments.
