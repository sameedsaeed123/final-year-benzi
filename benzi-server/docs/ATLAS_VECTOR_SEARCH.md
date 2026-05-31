# MongoDB Atlas Vector Search (BENZI RAG)

## Important: your current database

Your `.env` uses a **self-hosted** MongoDB (`187.124.144.177`). **Atlas Vector Search does not run there.**

| Database | Vector search |
|----------|----------------|
| Self-hosted MongoDB (current) | **Local cosine** in Node (`RAG_VECTOR_BACKEND=local` or `auto`) |
| **MongoDB Atlas** M10+ | **Atlas `$vectorSearch`** (implemented in code) |

The app **auto-falls back** to local search if Atlas index is missing or DB is not Atlas.

---

## Enable Atlas (when you migrate)

1. Create **MongoDB Atlas** cluster (M10 or higher for vector search).
2. Migrate data or point `MONGODB_URI` to `mongodb+srv://...mongodb.net/...`
3. In Atlas UI → **Search** → Create vector index on collection `recordchunks`:

```json
{
  "name": "benzi_record_chunks_vector",
  "type": "vectorSearch",
  "definition": {
    "fields": [
      {
        "type": "vector",
        "path": "embedding",
        "numDimensions": 768,
        "similarity": "cosine"
      },
      {
        "type": "filter",
        "path": "patientUserId"
      }
    ]
  }
}
```

4. `.env`:

```env
RAG_ENABLED=true
RAG_VECTOR_BACKEND=atlas
RAG_ATLAS_INDEX=benzi_record_chunks_vector
MONGODB_URI=mongodb+srv://...
```

5. Reindex: `npm run rag:reindex`

---

## Verify

```bash
curl -s http://127.0.0.1:5000/api/ai/health
```

`"rag": { "vectorSearch": "atlas-with-local-fallback", ... }`

---

## Smooth experience tips

- Run `npm run rag:reindex` once after enabling RAG.
- Keep **Ollama** running; first chat after idle is slower.
- Use `LLM_HELPER=openrouter` only for very large PDF sets.
- On Atlas, vector search scales better than local cosine for many chunks.
