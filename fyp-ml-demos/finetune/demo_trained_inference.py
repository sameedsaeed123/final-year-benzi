#!/usr/bin/env python3
"""One-shot inference from merged fine-tuned weights (for FYP demo / proof).

Slow on Intel Mac CPU (~6GB model). Prefer Colab GPU cell in benzi-server/docs/FYP_TRAINED_MODEL_STORY.md.

  python finetune/demo_trained_inference.py
  python finetune/demo_trained_inference.py --model ~/benzi-models/benzi-empathetic-hf
"""
from __future__ import annotations

import argparse
from pathlib import Path

DEFAULT_MODEL = Path.home() / "benzi-models" / "benzi-empathetic-hf"
DEFAULT_PROMPT = "I feel anxious before therapy tomorrow. Please respond briefly and warmly."


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--model", type=Path, default=DEFAULT_MODEL)
    p.add_argument("--prompt", default=DEFAULT_PROMPT)
    p.add_argument("--max-new-tokens", type=int, default=120)
    args = p.parse_args()

    if not (args.model / "config.json").is_file():
        raise SystemExit(
            f"Model not found: {args.model}\n"
            "Unzip benzi-empathetic-trained.zip to ~/benzi-models/benzi-empathetic-hf"
        )

    import torch
    from transformers import AutoModelForCausalLM, AutoTokenizer

    print(f"Loading {args.model} (first run may take a few minutes on CPU)…")
    tokenizer = AutoTokenizer.from_pretrained(args.model, trust_remote_code=True)
    dtype = torch.float16 if torch.cuda.is_available() else torch.float32
    model = AutoModelForCausalLM.from_pretrained(
        args.model,
        torch_dtype=dtype,
        low_cpu_mem_usage=True,
        trust_remote_code=True,
    )
    device = "cuda" if torch.cuda.is_available() else "cpu"
    model = model.to(device)
    model.eval()

    messages = [{"role": "user", "content": args.prompt}]
    if hasattr(tokenizer, "apply_chat_template"):
        text = tokenizer.apply_chat_template(
            messages, tokenize=False, add_generation_prompt=True
        )
    else:
        text = f"USER: {args.prompt}\nASSISTANT:"

    inputs = tokenizer(text, return_tensors="pt").to(device)
    print("Generating…")
    with torch.no_grad():
        out = model.generate(
            **inputs,
            max_new_tokens=args.max_new_tokens,
            do_sample=True,
            temperature=0.7,
            top_p=0.9,
        )
    reply = tokenizer.decode(
        out[0][inputs.input_ids.shape[1] :], skip_special_tokens=True
    )
    print("\n--- Fine-tuned model reply ---\n")
    print(reply.strip())
    print("\n--- end ---\n")


if __name__ == "__main__":
    main()
