# BENZI AI — Local Ollama setup (FYP / Dell laptop)

Use this when presenting **local ML inference** (Ollama) instead of cloud OpenRouter/Gemini.

**Also read:**

- [OLLAMA_HARDWARE.md](./OLLAMA_HARDWARE.md) — Mac vs Dell, **stop Ollama** so your laptop stays fast, fast Mac setup  
- [OLLAMA_FINETUNE_DATASETS.md](./OLLAMA_FINETUNE_DATASETS.md) — empathy fine-tuning datasets (Mac 32 GB)  

**npm scripts:** `ollama:quit` · `ollama:start` · `ollama:unload` · `ollama:pull-fast` · `test:ollama`

## Architecture

```
Patient UI → benzi-server (Node)
              ├─ aiContextBuilder (PDFs, goals, chat history)  ← "context-aware"
              ├─ aiPromptBuilder (therapist scope rules)
              ├─ crisisDetectionService (rules)
              ├─ sentimentService → optional Python :5001 (DistilBERT)
              └─ ollamaService → Ollama :11434 (llama3.2:3b)
```

## 1. Install Ollama (Dell Inspiron, 8 GB RAM)

1. Download: https://ollama.com  
2. Install and open the app (starts `ollama serve` on Windows/macOS).  
3. Pull the recommended model (fits 8 GB RAM + 2 GB GPU):

```bash
ollama pull llama3.2:3b
```

Alternatives if slow or out-of-memory:

```bash
ollama pull gemma2:2b
# then set OLLAMA_MODEL=gemma2:2b in .env
```

Avoid `llama3.1:8b` on 8 GB RAM while MongoDB + IDE are open.

## 2. Configure benzi-server

In `benzi-server/.env`:

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_NUM_CTX=4096

# Optional: Python sentiment (see fyp-ml-demos/README.md)
# SENTIMENT_SERVICE_URL=http://127.0.0.1:5001
```

Restart the API:

```bash
cd benzi-server
npm run dev
```

## 3. Verify

```bash
# Health (no login)
curl http://localhost:3000/api/ai/health

# Full chat test (needs Ollama running)
npm run test:ollama
```

Expected health when ready:

```json
{
  "provider": "ollama",
  "ok": true,
  "ollamaReachable": true,
  "modelAvailable": true,
  "model": "llama3.2:3b"
}
```

## 4. Optional Python ML demos (for supervisor)

From repo root:

```bash
cd fyp-ml-demos
python3 -m venv .venv
source .venv/bin/activate   # Windows: .venv\Scripts\activate
pip install -r requirements.txt
python sentiment_service.py   # port 5001
```

Then uncomment `SENTIMENT_SERVICE_URL` in `.env`.

Standalone demos (no Node):

```bash
python crisis_demo.py
python rag_ollama_demo.py
```

## 5. FYP report wording

- **ML components:** rule-based crisis detection, optional DistilBERT sentiment, RAG-style context from clinical PDFs, local transformer LLM via Ollama.  
- **Not claimed:** training foundation models from scratch.  
- **Ethics:** AI supports therapy; therapist remains primary clinician; crisis → therapist alert.

## 6. Switch back to cloud

```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=...
```

## Troubleshooting

| Issue | Fix |
|--------|-----|
| `ECONNREFUSED` | Run Ollama app or `ollama serve` |
| Model not found | `ollama pull <OLLAMA_MODEL>` |
| Very slow / freeze | Use `gemma2:2b`, close browsers, lower `OLLAMA_NUM_CTX` to 2048 |
| Empty AI replies | Check `npm run test:ollama` logs |
