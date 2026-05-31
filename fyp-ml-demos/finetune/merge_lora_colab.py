#!/usr/bin/env python3
"""
Colab-safe LoRA merge: GPU merge → CPU save (avoids hang/OOM at 'Writing model shards 0%').

  python finetune/merge_lora_colab.py --model Qwen/Qwen2.5-3B-Instruct
"""
from __future__ import annotations

import argparse
import gc
import shutil
import subprocess
import sys
import time
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ADAPTER_DIR = ROOT / "adapters" / "benzi-lora"
MERGED_DIR = ROOT / "merged" / "benzi-empathetic-hf"
DEFAULT_MODEL = "Qwen/Qwen2.5-3B-Instruct"


def _remove_torchao() -> None:
    subprocess.run(
        [sys.executable, "-m", "pip", "uninstall", "-y", "torchao"],
        capture_output=True,
    )


def _disk_gb(path: Path) -> float:
    return shutil.disk_usage(path).free / (1024**3)


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--model", default=DEFAULT_MODEL)
    p.add_argument("--adapter", default=str(ADAPTER_DIR))
    p.add_argument("--out", default=str(MERGED_DIR))
    args = p.parse_args()

    free = _disk_gb(Path("/content"))
    print(f"Disk free on /content: {free:.1f} GB")
    if free < 10:
        raise SystemExit(
            "Need ~10 GB free. Runtime → Disconnect and delete runtime, then merge again."
        )

    adapter = Path(args.adapter)
    if not (adapter / "adapter_config.json").is_file():
        raise SystemExit(f"Missing adapter: {adapter}/adapter_config.json — run training first.")

    _remove_torchao()

    import torch
    from peft import PeftModel
    from transformers import AutoModelForCausalLM, AutoTokenizer

    model_id = args.model
    out = Path(args.out)
    if out.exists():
        print(f"Removing partial merge at {out}…")
        shutil.rmtree(out)

    print(f"Loading base {model_id} on GPU…")
    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    base = AutoModelForCausalLM.from_pretrained(
        model_id,
        torch_dtype=torch.float16,
        device_map="auto",
        low_cpu_mem_usage=True,
        trust_remote_code=True,
    )

    print("Loading LoRA adapter…")
    model = PeftModel.from_pretrained(base, str(adapter))
    del base
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

    print("Merging LoRA into base weights (GPU)…")
    model = model.merge_and_unload()

    print("Moving merged model to CPU for save (prevents Colab hang at 0%)…")
    model = model.cpu()
    gc.collect()
    if torch.cuda.is_available():
        torch.cuda.empty_cache()

    out.mkdir(parents=True, exist_ok=True)
    print(
        "Saving ~6GB in 500MB shards (expect 15–40 min; bar may pause between shards)…"
    )
    t0 = time.time()
    model.save_pretrained(
        out,
        safe_serialization=True,
        max_shard_size="500MB",
    )
    tokenizer.save_pretrained(out)
    elapsed = time.time() - t0
    size_gb = sum(f.stat().st_size for f in out.rglob("*") if f.is_file()) / (1024**3)
    print(f"Done in {elapsed / 60:.1f} min — {size_gb:.2f} GB at {out}")


if __name__ == "__main__":
    main()
