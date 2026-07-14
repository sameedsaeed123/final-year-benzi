#!/usr/bin/env bash
# ~3 hour BENZI 3B LoRA train + Ollama deploy (Intel Mac / CPU).
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ML_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVER_DIR="$(cd "$ML_DIR/../benzi-server" && pwd)"
cd "$ML_DIR"

echo "=== BENZI 3B training (~3h target) ==="
echo "Started: $(date)"

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
fi
source .venv/bin/activate
pip install -q --upgrade pip
pip install -q -r requirements.txt -r requirements-finetune.txt

echo "[1/4] Prepare dataset (1200 examples)…"
python finetune/prepare_dataset.py --max-total 1200

echo "[2/4] LoRA train Qwen2.5-3B (60 steps, CPU only — avoids Mac MPS OOM)…"
export PYTORCH_ENABLE_MPS_FALLBACK=0
python finetune/train_qlora.py --benzi-3h

echo "[3/4] Merge LoRA into full weights…"
python finetune/merge_lora.py

echo "[4/4] Import into Ollama as benzi-empathetic-trained…"
python finetune/export_ollama.py

echo ""
echo "Update benzi-server/.env:"
echo "  OLLAMA_MODEL=benzi-empathetic-trained"
echo "Finished: $(date)"
