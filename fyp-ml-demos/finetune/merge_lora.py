#!/usr/bin/env python3
"""Merge LoRA adapter into base model (HuggingFace folder)."""
from __future__ import annotations

import argparse
from pathlib import Path

ADAPTER_DIR = Path(__file__).resolve().parent / "adapters" / "benzi-lora"
MERGED_DIR = Path(__file__).resolve().parent / "merged" / "benzi-empathetic-hf"
DEFAULT_MODEL = "Qwen/Qwen2.5-3B-Instruct"


def _fix_torchao_for_peft() -> None:
    """Colab often has torchao 0.10; peft requires >=0.16 or no torchao at all."""
    import subprocess
    import sys

    try:
        import torchao  # noqa: F401
        from importlib.metadata import version as pkg_version

        ver = pkg_version("torchao")
    except Exception:
        return

    def parse_major_minor(v: str) -> tuple[int, int]:
        parts = v.split(".")
        return int(parts[0]), int(parts[1]) if len(parts) > 1 else 0

    major, minor = parse_major_minor(ver)
    if (major, minor) < (0, 16):
        print(f"Upgrading torchao {ver} → >=0.16 for peft merge…")
        subprocess.check_call(
            [sys.executable, "-m", "pip", "install", "-q", "torchao>=0.16.0"],
        )


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--model", default=DEFAULT_MODEL, help="Must match the base used in train_qlora.py")
    p.add_argument("--quick", action="store_true", help="Merge quick-demo adapter (SmolLM2-360M)")
    p.add_argument("--adapter", default=str(ADAPTER_DIR))
    p.add_argument("--out", default=str(MERGED_DIR))
    args = p.parse_args()

    _fix_torchao_for_peft()

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
    out.mkdir(parents=True, exist_ok=True)
    model.save_pretrained(out)
    tokenizer.save_pretrained(out)
    print(f"Merged model saved to {out}")
    print("Next: convert to GGUF for Ollama — see finetune/README.md")


if __name__ == "__main__":
    main()
