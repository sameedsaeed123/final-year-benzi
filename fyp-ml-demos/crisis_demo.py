#!/usr/bin/env python3
"""Crisis phrase detection demo — aligns with BENZI server safety layer."""

CRISIS_PHRASES = [
    "kill myself",
    "end my life",
    "want to die",
    "cut myself",
    "suicide",
    "knife on throat",
    "hurt myself",
]

def detect_crisis(text: str) -> dict:
    t = (text or "").lower()
    hits = [p for p in CRISIS_PHRASES if p in t]
    return {"is_crisis": bool(hits), "matched": hits}

if __name__ == "__main__":
    samples = [
        "I want to manage stress at work",
        "abc",
        "I put knife on throat",
        "manage stress with breathing",
    ]
    for s in samples:
        print(f"{s!r} -> {detect_crisis(s)}")
