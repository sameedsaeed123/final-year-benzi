# BENZI — Ollama on your Dell laptop (quick start)

> **New machine?** Full install (MongoDB, Node, zip, admin): **[DELL_MACHINE_SETUP.md](DELL_MACHINE_SETUP.md)**  
> **Copy your current DB to Dell:** `db:export` → `db:import` — **[COPY_DATABASE_TO_LOCAL.md](benzi-server/docs/COPY_DATABASE_TO_LOCAL.md)**  
> **Demo data only:** `npm run seed:all` — **[SEED_DATABASE.md](benzi-server/docs/SEED_DATABASE.md)**  
> Requirements only: **[REQUIREMENTS.md](REQUIREMENTS.md)**

## Is Ollama required?

- **For FYP demo / local ML:** Yes — install Ollama and set `LLM_PROVIDER=ollama`.
- **For daily dev (fast Mac):** No — keep `LLM_PROVIDER=openrouter` and run `npm run ollama:quit` so Ollama does not use RAM.

**Mac 32 GB:** [benzi-server/docs/OLLAMA_HARDWARE.md](benzi-server/docs/OLLAMA_HARDWARE.md)  
**Fine-tune datasets:** [benzi-server/docs/OLLAMA_FINETUNE_DATASETS.md](benzi-server/docs/OLLAMA_FINETUNE_DATASETS.md)

## Stop Ollama while you work (Mac)

```bash
cd benzi-server
npm run ollama:quit      # frees RAM — use while coding UI/API
npm run ollama:start     # when you want to test BENZI AI again
npm run ollama:unload    # unload model only, keep app open
```

## Fast first setup (Mac 32 GB)

```bash
cd benzi-server
npm run ollama:pull-fast
```

In `.env`:

```env
LLM_PROVIDER=ollama
OLLAMA_MODEL=llama3.2:3b
OLLAMA_NUM_CTX=2048
```

Then `npm run ollama:start` and `npm run test:ollama`.

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
