#!/usr/bin/env python3
"""
LoRA fine-tune Llama-3.2-3B-Instruct for BENZI empathy + guardrails.

Intel Mac (CPU): use --quick (few steps, small subset).
Colab / GPU: omit --quick, use --max-steps 500+.

  python train_qlora.py --quick
  python train_qlora.py --max-steps 500
"""
from __future__ import annotations

import argparse
import json
import os
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

DATA_TRAIN = ROOT / "data" / "benzi_train.jsonl"
ADAPTER_DIR = ROOT / "adapters" / "benzi-lora"

# Llama 3.2 needs HF login; Qwen 3B works ungated for local demos (similar size).
DEFAULT_MODEL = "Qwen/Qwen2.5-3B-Instruct"
OLLAMA_EQUIVALENT = "llama3.2:3b"


def load_jsonl(path: Path, limit: int | None = None) -> list[dict]:
    rows = []
    with path.open(encoding="utf-8") as f:
        for line in f:
            rows.append(json.loads(line))
            if limit and len(rows) >= limit:
                break
    return rows


def format_example(tokenizer, messages: list[dict]) -> str:
    if hasattr(tokenizer, "apply_chat_template"):
        return tokenizer.apply_chat_template(
            messages,
            tokenize=False,
            add_generation_prompt=False,
        )
    parts = []
    for m in messages:
        parts.append(f"{m['role'].upper()}: {m['content']}")
    return "\n".join(parts) + "\n"


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument(
        "--model",
        default=DEFAULT_MODEL,
        help=f"HF model id (for Ollama use {OLLAMA_EQUIVALENT} after GGUF export)",
    )
    p.add_argument("--max-steps", type=int, default=None)
    p.add_argument(
        "--quick",
        action="store_true",
        help="Pipeline test: SmolLM2-360M, 80 rows, 20 steps (~15–40 min CPU)",
    )
    p.add_argument("--lr", type=float, default=2e-4)
    p.add_argument("--batch-size", type=int, default=1)
    p.add_argument("--grad-accum", type=int, default=8)
    p.add_argument("--max-length", type=int, default=512)
    p.add_argument(
        "--benzi-3h",
        action="store_true",
        help="Heavy: Qwen2.5-3B 60 steps (12h+ CPU — not recommended on Mac)",
    )
    p.add_argument(
        "--benzi-lite",
        action="store_true",
        help="~2–3h: Qwen2.5-1.5B, 400 examples, 25 steps — slight empathy tune",
    )
    args = p.parse_args()

    if not DATA_TRAIN.is_file():
        print(f"Missing {DATA_TRAIN}. Run: python prepare_dataset.py")
        sys.exit(1)

    import torch
    from datasets import Dataset
    from peft import LoraConfig, get_peft_model, prepare_model_for_kbit_training
    from transformers import (
        AutoModelForCausalLM,
        AutoTokenizer,
        Trainer,
        TrainingArguments,
        DataCollatorForLanguageModeling,
    )

    model_id = args.model
    if args.quick:
        model_id = "HuggingFaceTB/SmolLM2-360M-Instruct"
        print(f"[quick] Using small model {model_id}")

    limit = None
    max_steps = args.max_steps or 300

    if args.benzi_3h:
        os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "0"
        model_id = DEFAULT_MODEL
        limit = 1000
        max_steps = 60
        args.max_length = min(args.max_length, 320)
        args.grad_accum = max(args.grad_accum, 16)
        print("[benzi-3h] Qwen2.5-3B — very slow on CPU; prefer --benzi-lite")

    if args.benzi_lite:
        os.environ["PYTORCH_ENABLE_MPS_FALLBACK"] = "0"
        model_id = "Qwen/Qwen2.5-1.5B-Instruct"
        limit = 400
        max_steps = 25
        args.max_length = min(args.max_length, 320)
        args.grad_accum = max(args.grad_accum, 8)
        print("[benzi-lite] Qwen2.5-1.5B LoRA — ~2–3h CPU, light empathy tune")

    if args.quick:
        limit = 80
        max_steps = 20
    train_rows = load_jsonl(DATA_TRAIN, limit=limit)
    print(f"Training on {len(train_rows)} examples, max_steps={max_steps}, model={model_id}")

    if args.benzi_3h or args.benzi_lite:
        device = "cpu"
        use_4bit = False
    else:
        device = "cuda" if torch.cuda.is_available() else "cpu"
        use_4bit = device == "cuda"
    print(f"Device: {device}, 4bit: {use_4bit}")

    tokenizer = AutoTokenizer.from_pretrained(model_id, trust_remote_code=True)
    if tokenizer.pad_token is None:
        tokenizer.pad_token = tokenizer.eos_token

    model_kwargs: dict = {"trust_remote_code": True}
    if use_4bit:
        from transformers import BitsAndBytesConfig

        model_kwargs["quantization_config"] = BitsAndBytesConfig(
            load_in_4bit=True,
            bnb_4bit_compute_dtype=torch.float16,
            bnb_4bit_use_double_quant=True,
            bnb_4bit_quant_type="nf4",
        )
        model_kwargs["device_map"] = "auto"
    else:
        # float16 base saves RAM on 32GB Mac during 3B LoRA
        model_kwargs["torch_dtype"] = torch.float16
        model_kwargs["low_cpu_mem_usage"] = True

    model = AutoModelForCausalLM.from_pretrained(model_id, **model_kwargs)

    if use_4bit:
        model = prepare_model_for_kbit_training(model)

    lora = LoraConfig(
        r=8,
        lora_alpha=16,
        lora_dropout=0.05,
        bias="none",
        task_type="CAUSAL_LM",
        target_modules=["q_proj", "k_proj", "v_proj", "o_proj"],
    )
    model = get_peft_model(model, lora)
    if device == "cpu":
        model = model.to("cpu")
    model.print_trainable_parameters()

    texts = [format_example(tokenizer, r["messages"]) for r in train_rows]

    def tokenize(batch):
        return tokenizer(
            batch["text"],
            truncation=True,
            max_length=args.max_length,
            padding="max_length",
        )

    ds = Dataset.from_dict({"text": texts})
    ds = ds.map(tokenize, batched=True, remove_columns=["text"])

    ADAPTER_DIR.mkdir(parents=True, exist_ok=True)

    # Colab transformers may drop kwargs (e.g. use_mps_device); only pass supported ones.
    import inspect

    ta_params = {
        "output_dir": str(ADAPTER_DIR),
        "per_device_train_batch_size": args.batch_size,
        "gradient_accumulation_steps": args.grad_accum,
        "max_steps": max_steps,
        "learning_rate": args.lr,
        "logging_steps": 5,
        "save_steps": max_steps,
        "save_total_limit": 1,
        "report_to": "none",
        "fp16": use_4bit,
        "optim": "adamw_torch",
        "warmup_ratio": 0.03,
        "no_cuda": device != "cuda",
    }
    sig = inspect.signature(TrainingArguments.__init__)
    training_args = TrainingArguments(
        **{k: v for k, v in ta_params.items() if k in sig.parameters}
    )

    collator = DataCollatorForLanguageModeling(tokenizer=tokenizer, mlm=False)

    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=ds,
        data_collator=collator,
    )

    print("Starting training…")
    trainer.train()
    model.save_pretrained(ADAPTER_DIR)
    tokenizer.save_pretrained(ADAPTER_DIR)
    print(f"Saved LoRA adapter to {ADAPTER_DIR}")


if __name__ == "__main__":
    main()
