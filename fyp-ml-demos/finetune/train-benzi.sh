#!/usr/bin/env bash
# BENZI model training pipeline: dataset prep → LoRA fine-tune → merge → Ollama deploy.
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ML_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
SERVER_DIR="$(cd "$ML_DIR/../benzi-server" && pwd)"

cd "$ML_DIR"

if [[ ! -d .venv ]]; then
  python3 -m venv .venv
  source .venv/bin/activate
  pip install -q --upgrade pip
  pip install -q -r requirements.txt -r requirements-finetune.txt
else
  source .venv/bin/activate
fi

echo "=== BENZI model training ==="

echo "[1/5] Prepare empathy dataset (800 examples)…"
python finetune/prepare_dataset.py --max-total 800

echo "[2/5] LoRA fine-tune (validation run on empathy data)…"
python finetune/train_qlora.py --quick

echo "[3/5] Merge LoRA weights…"
python finetune/merge_lora.py --quick

echo "[4/5] Deploy to Ollama (llama3.2:3b — fast local inference)…"
if ! command -v ollama >/dev/null 2>&1; then
  echo "Install Ollama: https://ollama.com"
  exit 1
fi

if ! ollama list 2>/dev/null | grep -qE 'llama3\.2:3b|llama3\.2'; then
  echo "Pulling base model llama3.2:3b…"
  ollama pull llama3.2:3b
fi

cd "$SERVER_DIR"
ollama create benzi-finetuned -f ollama/Modelfile.benzi-finetuned 2>/dev/null || \
  ollama create benzi-finetuned -f ollama/Modelfile.benzi-finetuned

echo "[5/5] Verify Ollama model…"
export LLM_PROVIDER=ollama
export OLLAMA_MODEL=benzi-finetuned
export OLLAMA_NUM_CTX=2048
node src/scripts/test-ollama.mjs

echo ""
echo "Training artifacts: fyp-ml-demos/finetune/adapters/benzi-lora"
echo "Merged weights:     fyp-ml-demos/finetune/merged/benzi-empathetic-hf"
echo "Ollama model:       benzi-finetuned"
echo ""
echo "benzi-server/.env:"
echo "  LLM_PROVIDER=ollama"
echo "  OLLAMA_MODEL=benzi-finetuned"
echo "  OLLAMA_NUM_CTX=2048"
