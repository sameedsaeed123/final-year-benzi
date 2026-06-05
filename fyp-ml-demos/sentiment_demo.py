#!/usr/bin/env python3
"""DistilBERT sentiment classification demo."""

from transformers import pipeline

def main():
    clf = pipeline(
        "sentiment-analysis",
        model="distilbert-base-uncased-finetuned-sst-2-english",
    )
    samples = [
        "I feel hopeless and exhausted",
        "Today was calm, I made progress on my goal",
        "I am grateful for small wins",
    ]
    for text in samples:
        out = clf(text)[0]
        label = out["label"].lower()
        score = round(out["score"], 3)
        mapped = "positive" if label == "positive" else "negative" if label == "negative" else "neutral"
        numeric = score if mapped == "positive" else -score if mapped == "negative" else 0.0
        print(f"{text!r}")
        print(f"  -> {mapped} (raw {label} {score}, score {numeric:.2f})\n")

if __name__ == "__main__":
    main()
