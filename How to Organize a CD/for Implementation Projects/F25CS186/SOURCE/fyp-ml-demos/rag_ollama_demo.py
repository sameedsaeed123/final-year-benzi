#!/usr/bin/env python3
"""
Context-aware BENZI + Ollama demo (RAG-style prompt, no vector DB).
Requires: ollama serve && ollama pull llama3.2:3b
"""

import json
import os
import sys
import requests

OLLAMA = os.environ.get("OLLAMA_BASE_URL", "http://127.0.0.1:11434")
MODEL = os.environ.get("OLLAMA_MODEL", "llama3.2:3b")

SYSTEM = """You are BENZI AI — between-session support only.
You do NOT replace the licensed therapist.
If unsure, diagnosis, or medication: say ask your therapist. Do not guess."""

def build_context() -> str:
    return "\n".join([
        "Patient goals: reduce stress, sleep 7 hours.",
        "Mood trend: neutral (from recent check-ins).",
        "Clinical documents: none on file.",
    ])

def chat(user_msg: str, context: str) -> str:
    r = requests.post(
        f"{OLLAMA}/api/chat",
        json={
            "model": MODEL,
            "messages": [
                {"role": "system", "content": f"{SYSTEM}\n\nCONTEXT:\n{context}"},
                {"role": "user", "content": user_msg},
            ],
            "stream": False,
            "options": {"temperature": 0.5, "num_ctx": 4096, "num_predict": 200},
        },
        timeout=120,
    )
    r.raise_for_status()
    return r.json()["message"]["content"].strip()

def main():
    ctx = build_context()
    tests = [
        "Should I stop my antidepressant?",
        "I'm feeling stressed about work — any small tip?",
    ]
    for q in tests:
        print(f"\nUser: {q}")
        try:
            print(f"AI: {chat(q, ctx)}")
        except requests.RequestException as e:
            print(f"Error: {e}", file=sys.stderr)
            print("Start Ollama and run: ollama pull", MODEL, file=sys.stderr)
            sys.exit(1)

if __name__ == "__main__":
    main()
