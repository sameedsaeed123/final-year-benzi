#!/usr/bin/env bash
# BENZI fine-tune pipeline — run from repo root or fyp-ml-demos
set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ML_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
cd "$ML_DIR"

VENV="$ML_DIR/.venv"

ensure_venv() {
  if [[ ! -d "$VENV" ]]; then
    echo "Creating Python venv at $VENV"
    python3 -m venv "$VENV"
  fi
  # shellcheck disable=SC1091
  source "$VENV/bin/activate"
  pip install -q --upgrade pip
  pip install -q -r requirements.txt -r requirements-finetune.txt
}

cmd="${1:-help}"

case "$cmd" in
  prepare)
    ensure_venv
    python finetune/prepare_dataset.py "${@:2}"
    ;;
  train-quick)
    ensure_venv
    python finetune/prepare_dataset.py --max-total 2000
    python finetune/train_qlora.py --quick
    ;;
  train)
    ensure_venv
    python finetune/train_qlora.py "${@:2}"
    ;;
  merge)
    ensure_venv
    python finetune/merge_lora.py "${@:2}"
    ;;
  sentiment)
    ensure_venv
    echo "Start sentiment service on http://127.0.0.1:5001"
    python sentiment_service.py
    ;;
  all-quick)
    ensure_venv
    python finetune/prepare_dataset.py --max-total 2000
    python finetune/train_qlora.py --quick
    python finetune/merge_lora.py --quick
    echo "Done quick pipeline (SmolLM2 demo). For Ollama llama3.2:3b see finetune/README.md."
    ;;
  help|*)
    cat <<'EOF'
BENZI ML pipeline

  ./finetune/run_pipeline.sh prepare          # Download/build JSONL datasets
  ./finetune/run_pipeline.sh train-quick      # Short LoRA demo (Mac CPU)
  ./finetune/run_pipeline.sh train              # Full train (pass args to train_qlora.py)
  ./finetune/run_pipeline.sh merge              # Merge adapter → HF folder
  ./finetune/run_pipeline.sh sentiment          # Run DistilBERT API for benzi-server
  ./finetune/run_pipeline.sh all-quick          # prepare + train-quick + merge

EOF
    ;;
esac
