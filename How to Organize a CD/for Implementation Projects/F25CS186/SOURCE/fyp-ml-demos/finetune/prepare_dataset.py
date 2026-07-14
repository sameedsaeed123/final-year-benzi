#!/usr/bin/env python3
"""
Build BENZI fine-tuning JSONL from HuggingFace datasets + fallback samples.

Usage:
  python prepare_dataset.py
  python prepare_dataset.py --max-total 5000
"""
from __future__ import annotations

import argparse
import json
import random
import sys
from pathlib import Path

ROOT = Path(__file__).resolve().parent
sys.path.insert(0, str(ROOT))

from benzi_prompt import BENZI_SYSTEM  # noqa: E402

ROOT = Path(__file__).resolve().parent
DATA_DIR = ROOT / "data"
OUT_TRAIN = DATA_DIR / "benzi_train.jsonl"
OUT_VAL = DATA_DIR / "benzi_val.jsonl"
OUT_STATS = DATA_DIR / "benzi_dataset_stats.json"


def write_jsonl(path: Path, rows: list[dict]) -> None:
    path.parent.mkdir(parents=True, exist_ok=True)
    with path.open("w", encoding="utf-8") as f:
        for row in rows:
            f.write(json.dumps(row, ensure_ascii=False) + "\n")


def alpaca_row(instruction: str, user: str, assistant: str) -> dict:
    return {
        "instruction": instruction,
        "input": user.strip(),
        "output": assistant.strip(),
    }


def format_chat_messages(row: dict) -> dict:
    """Ollama / HF chat format."""
    return {
        "messages": [
            {"role": "system", "content": BENZI_SYSTEM},
            {"role": "user", "content": row["input"]},
            {"role": "assistant", "content": row["output"]},
        ]
    }


def load_empathetic(max_rows: int) -> list[dict]:
    from datasets import load_dataset

    print(f"[empathetic] loading up to {max_rows}…")
    split = None
    for source in (
        lambda: load_dataset("Ahren09/empathetic_dialogues", split="train"),
        lambda: load_dataset("facebook/empathetic_dialogues", split="train"),
    ):
        try:
            split = source()
            break
        except Exception as err:
            print(f"[empathetic] try failed: {err}")
    if split is None:
        return []

    rows = []
    for ex in split:
        if len(rows) >= max_rows:
            break
        prompt = ex.get("prompt") or ex.get("context") or ex.get("situation") or ""
        utterance = ex.get("utterance") or ex.get("response") or ""
        # Keep listener turns (speaker_idx 1) when available — more empathetic
        if ex.get("speaker_idx") not in (None, 1, "1") and "speaker_idx" in ex:
            continue
        if not prompt or not utterance or len(str(utterance)) < 10:
            continue
        rows.append(
            alpaca_row(
                BENZI_SYSTEM,
                str(prompt)[:800],
                str(utterance)[:600],
            )
        )
    print(f"[empathetic] got {len(rows)} rows")
    return rows


def load_counsel_chat(max_rows: int) -> list[dict]:
    from datasets import load_dataset

    print(f"[counsel-chat] loading up to {max_rows}…")
    try:
        ds = load_dataset("nbertagnolli/counsel-chat")
    except Exception as e:
        print(f"[counsel-chat] skip: {e}")
        return []

    rows = []
    split = ds["train"] if "train" in ds else ds[list(ds.keys())[0]]
    for ex in split:
        if len(rows) >= max_rows:
            break
        q = (
            ex.get("questionText")
            or ex.get("questionTitle")
            or ex.get("question")
            or ex.get("input")
            or ""
        )
        a = ex.get("answerText") or ex.get("answer") or ex.get("output") or ""
        if not q or not a or len(a) < 20:
            continue
        # Prefer answers that mention professional boundaries sometimes
        rows.append(
            alpaca_row(
                BENZI_SYSTEM,
                str(q)[:800],
                str(a)[:700],
            )
        )
    print(f"[counsel-chat] got {len(rows)} rows")
    return rows


def synthetic_benzi(n: int) -> list[dict]:
    """Offline-safe examples aligned with BENZI guardrails."""
    pairs = [
        (
            "I've been anxious about exams and can't sleep.",
            "That sounds really draining — exam stress and poor sleep often feed each other. "
            "What's been weighing on you most this week? If sleep stays bad, mention it to your therapist.",
        ),
        (
            "I feel useless and don't want to talk to anyone.",
            "Feeling useless can be heavy, and pulling away is a common response. "
            "You're not alone in this. Would it help to name one small thing that felt okay recently?",
        ),
        (
            "Can you diagnose me with depression?",
            "I can't diagnose conditions — that's for a qualified clinician. "
            "What you're feeling matters though. Please share these symptoms with your therapist so they can support you properly.",
        ),
        (
            "Should I increase my antidepressant dose?",
            "I can't advise on medication changes. Please talk to your prescriber or therapist before changing any dose. "
            "How have you been feeling since your last appointment?",
        ),
        (
            "I'm just killing time before therapy tomorrow.",
            "Got it — sometimes we use downtime to cope before a session. "
            "Is there anything you'd like to bring up with your therapist tomorrow?",
        ),
        (
            "My mood improved after walking outside.",
            "That's encouraging — movement and daylight can help mood for many people. "
            "What felt different during or after the walk?",
        ),
    ]
    rows = []
    for i in range(n):
        u, a = pairs[i % len(pairs)]
        rows.append(alpaca_row(BENZI_SYSTEM, u, a))
    return rows


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--max-total", type=int, default=6000, help="Max training examples before split")
    p.add_argument("--val-ratio", type=float, default=0.05)
    p.add_argument("--seed", type=int, default=42)
    args = p.parse_args()

    random.seed(args.seed)
    all_rows: list[dict] = []

    half = args.max_total // 2
    try:
        all_rows.extend(load_empathetic(half))
    except Exception as e:
        print(f"[empathetic] failed: {e}")

    try:
        all_rows.extend(load_counsel_chat(args.max_total // 3))
    except Exception as e:
        print(f"[counsel-chat] failed: {e}")

    if len(all_rows) < 200:
        print("[fallback] adding synthetic BENZI examples")
        all_rows.extend(synthetic_benzi(300))

    random.shuffle(all_rows)
    all_rows = all_rows[: args.max_total]

    # Convert to chat messages format for training script
    chat_rows = [format_chat_messages(r) for r in all_rows]

    n_val = max(20, int(len(chat_rows) * args.val_ratio))
    val_rows = chat_rows[:n_val]
    train_rows = chat_rows[n_val:]

    write_jsonl(OUT_TRAIN, train_rows)
    write_jsonl(OUT_VAL, val_rows)

    stats = {
        "train": len(train_rows),
        "val": len(val_rows),
        "sources": ["empathetic_dialogues", "counsel-chat", "synthetic_benzi"],
    }
    OUT_STATS.write_text(json.dumps(stats, indent=2), encoding="utf-8")

    print(f"Wrote {OUT_TRAIN} ({len(train_rows)} rows)")
    print(f"Wrote {OUT_VAL} ({len(val_rows)} rows)")
    print(f"Stats: {OUT_STATS}")


if __name__ == "__main__":
    main()
