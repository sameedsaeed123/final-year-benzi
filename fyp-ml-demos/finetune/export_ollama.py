#!/usr/bin/env python3
"""Merge LoRA (if needed) and register model in Ollama."""
from __future__ import annotations

import subprocess
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
MERGED = ROOT / "merged" / "benzi-empathetic-hf"
MODELFILE = ROOT / "Modelfile.benzi-empathetic-trained"
OLLAMA_NAME = "benzi-empathetic-trained"
BASE_MODEL = "Qwen/Qwen2.5-3B-Instruct"

BENZI_SYSTEM = """You are BENZI AI — a warm mental wellness companion between therapy sessions.
You are NOT a therapist. You do NOT diagnose, prescribe, or replace professional care.
Acknowledge feelings first; keep replies to 2-4 sentences unless they ask for more.
Always encourage involving their licensed therapist for clinical decisions, medication, or crisis.
If unsure, say you do not have enough on file and they should ask their therapist."""


def main() -> None:
    adapter = ROOT / "adapters" / "benzi-lora"
    if not MERGED.is_dir() or not (MERGED / "config.json").exists():
        if not adapter.is_dir():
            print("Run training first: ./finetune/run_train_3h.sh")
            sys.exit(1)
        print("Merging LoRA…")
        subprocess.run(
            [sys.executable, str(ROOT / "merge_lora.py"), "--model", BASE_MODEL],
            check=True,
        )

    merged_abs = MERGED.resolve()
    modelfile_text = f"""# BENZI LoRA-merged Qwen2.5-3B (empathy fine-tune)
FROM {merged_abs}

PARAMETER temperature 0.65
PARAMETER top_p 0.9
PARAMETER num_ctx 2048
PARAMETER repeat_penalty 1.1

SYSTEM \"\"\"{BENZI_SYSTEM}\"\"\"
"""
    MODELFILE.write_text(modelfile_text, encoding="utf-8")
    print(f"Wrote {MODELFILE}")

    print(f"Creating Ollama model `{OLLAMA_NAME}` (may take several minutes)…")
    r = subprocess.run(
        ["ollama", "create", OLLAMA_NAME, "-f", str(MODELFILE)],
        capture_output=False,
    )
    if r.returncode != 0:
        print(
            "\nOllama create failed. Try manually:\n"
            f"  ollama create {OLLAMA_NAME} -f {MODELFILE}\n"
            "Or keep OLLAMA_MODEL=benzi-finetuned (Modelfile on llama3.2:3b)."
        )
        sys.exit(r.returncode)

    print(f"\nSuccess. Test: ollama run {OLLAMA_NAME} \"I feel anxious before therapy\"")
    print(f"Set in benzi-server/.env: OLLAMA_MODEL={OLLAMA_NAME}")


if __name__ == "__main__":
    main()
