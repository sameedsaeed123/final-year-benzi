#!/usr/bin/env python3
"""
Flask sentiment API for benzi-server.
Run: python sentiment_service.py
Env: PORT=5001
"""

import os
from flask import Flask, jsonify, request
from transformers import pipeline

app = Flask(__name__)
_clf = None

def get_clf():
    global _clf
    if _clf is None:
        _clf = pipeline(
            "sentiment-analysis",
            model="distilbert-base-uncased-finetuned-sst-2-english",
        )
    return _clf

def to_benzi_score(label: str, confidence: float) -> tuple[float, str]:
    label_l = label.lower()
    if label_l == "positive":
        return round(confidence, 4), "positive"
    if label_l == "negative":
        return round(-confidence, 4), "negative"
    return 0.0, "neutral"

@app.get("/health")
def health():
    return jsonify({"ok": True, "service": "benzi-sentiment"})

@app.post("/analyze")
def analyze():
    data = request.get_json(silent=True) or {}
    text = str(data.get("text") or "")
    if not text.strip():
        return jsonify({"score": 0, "label": "neutral", "source": "distilbert"}), 200
    out = get_clf()(text[:2000])[0]
    score, label = to_benzi_score(out["label"], float(out["score"]))
    return jsonify({"score": score, "label": label, "source": "distilbert"})

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 5001))
    print(f"Sentiment service http://127.0.0.1:{port} (POST /analyze)")
    app.run(host="127.0.0.1", port=port, debug=False)
