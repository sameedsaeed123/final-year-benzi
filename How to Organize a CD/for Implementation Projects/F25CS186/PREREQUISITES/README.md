# Prerequisites — Benzi (F25CS186)

## Runtime

- **Node.js 18+** and npm — runs `benzi-server`, `benzi-admin`, `Fyp-To-Reduce-Mental-Health`
- **MongoDB** — Atlas cloud cluster (recommended) or a local MongoDB instance. Connection string goes in `benzi-server/.env` as `MONGODB_URI`.
- **Redis** — used for the email queue (BullMQ) and admin read cache. `redis-server` locally, or `docker run -p 6379:6379 redis:7-alpine`.
- **Ollama** — local LLM runtime for the AI chat + RAG embeddings. Install from https://ollama.com, then:
  ```
  ollama serve
  ```

## Python (only needed for the ML demos / fine-tuning in `fyp-ml-demos/`)

- Python 3.10+
- `pip install -r fyp-ml-demos/requirements.txt` — sentiment/crisis/RAG demo scripts
- `pip install -r fyp-ml-demos/requirements-finetune.txt` — QLoRA fine-tuning (Qwen2.5-3B)

## System / hardware requirements

**To run the app + local AI chat (inference only, no training):**

| Resource | Minimum | Recommended |
|---|---|---|
| RAM | 8 GB | 16 GB+ (dev machine used: 32 GB Intel Mac) |
| Disk | ~5 GB free | for Ollama models (`llama3.2:3b` ≈ 2 GB, `nomic-embed-text` ≈ 274 MB), node_modules (~1 GB combined), MongoDB/Redis if run locally |
| CPU | Any modern x86/ARM | Apple Silicon or a recent multi-core CPU — Ollama runs the 3B model on CPU, no GPU required |
| GPU | Not required | — |

**To fine-tune your own model (optional — `fyp-ml-demos/finetune/`, research track only):**

- CPU-only QLoRA training on a Mac is possible but slow and **not the recommended path** — the training script's own `--benzi-3h` flag is documented as "12h+ CPU — not recommended on Mac" for the full Qwen2.5-3B run.
- **Recommended:** Google Colab (free GPU tier) — see `SOURCE/fyp-ml-demos/finetune/BENZI_Colab_Train.ipynb`. A GPU run finishes in well under an hour.
- For a quick local pipeline smoke-test only (not a real model): `train_qlora.py --quick` uses a tiny 360M model, ~15–40 min on CPU.
- Disk for training artifacts: LoRA adapter ~34 MB; a full merged model (`finetune/merged/`) is ~1.4 GB and is **not** included on this CD (excluded like `node_modules`, see `SOURCE/README.md`).

## Optional (only if the corresponding feature is being demoed)

- **Google Cloud OAuth credentials** — for Google Calendar / Meet integration (therapist online appointments)
- **Stripe account (test mode)** — for therapist subscription payments
- **Gmail SMTP app password** — for outgoing email (verification, notifications)

Full detail and copy-paste `.env` templates are in `SOURCE/benzi-server/.env.example`, `SOURCE/benzi-admin/.env.example`, and `SOURCE/Fyp-To-Reduce-Mental-Health/.env.example`.
