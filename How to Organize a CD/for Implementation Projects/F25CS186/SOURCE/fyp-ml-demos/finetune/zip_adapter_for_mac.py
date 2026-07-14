#!/usr/bin/env python3
"""Zip LoRA adapter only (~100MB) if Colab merge keeps failing — merge on Mac."""
from __future__ import annotations

import shutil
from pathlib import Path

ROOT = Path(__file__).resolve().parent
ADAPTER = ROOT / "adapters" / "benzi-lora"
OUT = Path("/content/benzi-lora-adapter")


def main() -> None:
    if not (ADAPTER / "adapter_config.json").is_file():
        raise SystemExit(f"No adapter at {ADAPTER}. Run training first.")

    if OUT.with_suffix(".zip").exists():
        OUT.with_suffix(".zip").unlink()
    shutil.make_archive(str(OUT), "zip", ADAPTER)
    print(f"Created {OUT}.zip — download this and merge on Mac:")
    print("  cd newrepo/fyp-ml-demos && python finetune/merge_lora_colab.py")


if __name__ == "__main__":
    main()
