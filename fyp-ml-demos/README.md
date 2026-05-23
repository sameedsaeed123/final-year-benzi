# BENZI FYP — Python ML demos

Standalone scripts for your supervisor + optional **sentiment microservice** for `benzi-server`.

## Setup (Dell laptop, 8 GB RAM)

```bash
cd fyp-ml-demos
python3 -m venv .venv
source .venv/bin/activate          # Windows: .venv\Scripts\activate
pip install -r requirements.txt
```

Install Ollama separately: https://ollama.com → `ollama pull llama3.2:3b`

## Scripts

| File | Purpose |
|------|---------|
| `crisis_demo.py` | Crisis phrase detection (mirrors server rules concept) |
| `sentiment_demo.py` | DistilBERT sentiment on sample sentences |
| `sentiment_service.py` | Flask API on port 5001 for Node integration |
| `rag_ollama_demo.py` | Context + Ollama chat (full pipeline demo) |
| `eval_ollama_demo.py` | Latency + safety checklist for report tables |

## Run demos

```bash
python crisis_demo.py
python sentiment_demo.py
python rag_ollama_demo.py      # requires Ollama running
python eval_ollama_demo.py     # writes eval_results.json
```

## Connect sentiment to benzi-server

Terminal 1:

```bash
python sentiment_service.py
```

In `benzi-server/.env`:

```env
SENTIMENT_SERVICE_URL=http://127.0.0.1:5001
```

Restart Node — patient AI chat will use DistilBERT scores when the service is up; falls back to keywords if down.
