#!/usr/bin/env python3
"""Merge LoRA adapter into base model (HuggingFace folder)."""
from __future__ import annotations

import argparse
from pathlib import Path

ADAPTER_DIR = Path(__file__).resolve().parent / "adapters" / "benzi-lora"
MERGED_DIR = Path(__file__).resolve().parent / "merged" / "benzi-empathetic-hf"
DEFAULT_MODEL = "Qwen/Qwen2.5-3B-Instruct"


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--model", default=DEFAULT_MODEL, help="Must match the base used in train_qlora.py")
    p.add_argument("--quick", action="store_true", help="Merge quick-demo adapter (SmolLM2-360M)")
    p.add_argument("--adapter", default=str(ADAPTER_DIR))
    p.add_argument("--out", default=str(MERGED_DIR))
    args = p.parse_args()

    import torch
    from peft import PeftModel
    from transformers import AutoModelForCausalLM, AutoTokenizer

    adapter = Path(args.adapter)
    if not adapter.is_dir():
        raise SystemExit(f"Adapter not found: {adapter}. Run train_qlora.py first.")

    model_id = "HuggingFaceTB/SmolLM2-360M-Instruct" if args.quick else args.model
    print(f"Loading base {model_id}…")
    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    base = AutoModelForCausalLM.from_pretrained(
        model_id,
        torch_dtype=torch.float16 if torch.cuda.is_available() else torch.float32,
        low_cpu_mem_usage=True,
        trust_remote_code=True,
    )
    model = PeftModel.from_pretrained(base, str(adapter))
    print("Merging LoRA weights…")
    model = model.merge_and_unload()

    out = Path(args.out)
    out.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(out)
    tokenizer.save_pretrained(out)
    print(f"Merged model saved to {out}")
    print("Next: convert to GGUF for Ollama — see finetune/README.md")


if __name__ == "__main__":
    main()
