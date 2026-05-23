# BENZI — Ollama on your Dell laptop (quick start)

## Is Ollama required?

- **For FYP demo / local ML:** Yes — install Ollama and set `LLM_PROVIDER=ollama`.
- **For cloud dev:** No — keep `LLM_PROVIDER=openrouter` (current default).

## 5-minute setup on Dell (8 GB RAM)

1. Clone/copy repo to the laptop.
2. Install [Ollama](https://ollama.com) → open the app.
3. In terminal: `ollama pull llama3.2:3b`
4. Edit `benzi-server/.env`:

```env
LLM_PROVIDER=ollama
OLLAMA_MODEL=llama3.2:3b
OLLAMA_BASE_URL=http://127.0.0.1:11434
```

5. Start API: `cd benzi-server && npm install && npm run dev`
6. Verify: `npm run test:ollama` and open `http://localhost:<PORT>/api/ai/health`

Full guide: [benzi-server/docs/OLLAMA_SETUP.md](benzi-server/docs/OLLAMA_SETUP.md)  
Python demos for teacher: [fyp-ml-demos/README.md](fyp-ml-demos/README.md)
