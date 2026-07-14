#!/usr/bin/env bash
# ~2–3h light LoRA (optional). Main gains: RAG + larger Ollama context (see CONTEXT_SETUP.md).
set -euo pipefail
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ML_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ML_DIR"
source .venv/bin/activate 2>/dev/null || { python3 -m venv .venv && source .venv/bin/activate && pip install -q -r requirements.txt -r requirements-finetune.txt; }

echo "=== BENZI lite train (~2–3h) ==="
python finetune/prepare_dataset.py --max-total 500
export PYTORCH_ENABLE_MPS_FALLBACK=0
python finetune/train_qlora.py --benzi-lite
python finetune/merge_lora.py --model Qwen/Qwen2.5-1.5B-Instruct
python finetune/export_ollama.py
echo "Optional: OLLAMA_MODEL=benzi-empathetic-trained (1.5B) OR keep benzi-finetuned (3B) + RAG for context"
