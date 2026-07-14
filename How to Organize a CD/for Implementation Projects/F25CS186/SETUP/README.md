# Setup & Run — Benzi (F25CS186)

See `PREREQUISITES/README.md` first for what needs to be installed.

## 1. Install dependencies

```bash
cd SOURCE
npm install                          # root (concurrently runner)
cd benzi-server && npm install && cd ..
cd benzi-admin && npm install && cd ..
cd Fyp-To-Reduce-Mental-Health && npm install && cd ..
```

## 2. Configure environment

```bash
cd benzi-server
cp .env.example .env
# Edit .env: MONGODB_URI, JWT_SECRET, FRONTEND_URL, Redis, Ollama, Stripe, SMTP
```

## 3. Seed demo data (optional but recommended for a jury demo)

```bash
cd benzi-server
npm run seed:admin          # admin@benzi.com / admin123
npm run seed:therapists     # demo therapists
npm run seed:all            # plans + admin + therapists + demo data
```

## 4. LLM setup (AI chat)

Benzi runs the AI **locally via Ollama** — no API key needed for the demo path.

```bash
ollama serve
cd benzi-server
npm run ollama:pull-fast              # pulls llama3.2:3b (base model)
npm run ollama:build-benzi-finetuned  # builds "benzi-finetuned" from ollama/Modelfile.benzi-finetuned
npm run ollama:pull-embed             # nomic-embed-text, needed for RAG
```

In `.env`, set:

```env
LLM_PROVIDER=ollama
OLLAMA_MODEL=benzi-finetuned
RAG_ENABLED=true
OLLAMA_EMBED_MODEL=nomic-embed-text
```

`benzi-finetuned` is a **Modelfile tune** (system prompt + temperature/top_p) on top of `llama3.2:3b` — this is what runs in the live demo and needs no training, just the two commands above.

### Optional: the actual fine-tuned research model

Separately, `SOURCE/fyp-ml-demos/finetune/` contains a **QLoRA fine-tune** of Qwen2.5-3B-Instruct (the ML research artifact for this project, distinct from the Modelfile tune above). This is optional — not required to run or demo the app. See `PREREQUISITES/README.md` for hardware notes; short version: use Google Colab (`BENZI_Colab_Train.ipynb`), CPU training on a Mac is impractically slow. Once trained and merged, `finetune/export_ollama.py` imports it into Ollama as `benzi-empathetic-trained`, which can then be swapped in via `OLLAMA_MODEL=benzi-empathetic-trained`.

## 5. Run everything

**From `SOURCE/` (API + patient app together):**

```bash
npm run dev
```

**Admin app (separate terminal):**

```bash
cd benzi-admin && npm run dev
```

## Ports

| Service | URL |
|---|---|
| API | http://localhost:5000 |
| Patient / Therapist portal | http://localhost:5173 |
| Admin dashboard | http://localhost:5174 |

## Default login (after seeding)

| Role | Email | Password |
|---|---|---|
| Admin | admin@benzi.com | admin123 |
| Therapist (seed) | dr.fatima.seed@benzi.local | BenziTherapistDemo#2026 |

Full details, architecture, and jury Q&A: `SOURCE/README.md`.
