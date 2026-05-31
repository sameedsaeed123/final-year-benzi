#!/usr/bin/env python3
"""Merge LoRA adapter into base model (HuggingFace folder)."""
from __future__ import annotations

import argparse
from pathlib import Path

ADAPTER_DIR = Path(__file__).resolve().parent / "adapters" / "benzi-lora"
MERGED_DIR = Path(__file__).resolve().parent / "merged" / "benzi-empathetic-hf"
DEFAULT_MODEL = "Qwen/Qwen2.5-3B-Instruct"


def _remove_broken_torchao() -> None:
    """Colab torchao wheels often break peft (wrong ABI). LoRA merge does not need torchao."""
    import subprocess
    import sys

    subprocess.run(
        [sys.executable, "-m", "pip", "uninstall", "-y", "torchao"],
        capture_output=True,
    )
    print("torchao removed (optional on Colab; avoids broken .so + peft errors)")


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--model", default=DEFAULT_MODEL, help="Must match the base used in train_qlora.py")
    p.add_argument("--quick", action="store_true", help="Merge quick-demo adapter (SmolLM2-360M)")
    p.add_argument("--adapter", default=str(ADAPTER_DIR))
    p.add_argument("--out", default=str(MERGED_DIR))
    args = p.parse_args()

    _remove_broken_torchao()

    import torch
    from peft import PeftModel
    from transformers import AutoModelForCausalLM, AutoTokenizer

    adapter = Path(args.adapter)
    adapter_config = adapter / "adapter_config.json"
    if not adapter_config.is_file():
        raise SystemExit(
            f"LoRA adapter not ready: missing {adapter_config}\n"
            "Run train_qlora.py to completion first (Step 2 in Colab). "
            "Do not run merge if training failed."
        )

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
    if out.exists():
        import shutil

        shutil.rmtree(out)
    out.mkdir(parents=True, exist_ok=True)

    import gc

    print("Moving to CPU before save (use merge_lora_colab.py on Colab if this hangs)…")
    model = model.cpu()
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

    print("Saving ~6GB in 500MB shards (15–40 min; do not Ctrl+C)…")
    model.save_pretrained(
        out,
        safe_serialization=True,
        max_shard_size="500MB",
    )
    tokenizer.save_pretrained(out)
    print(f"Merged model saved to {out}")
    print("Next: convert to GGUF for Ollama — see finetune/README.md")


if __name__ == "__main__":
    main()
