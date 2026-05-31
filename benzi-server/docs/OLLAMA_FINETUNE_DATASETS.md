# Empathy fine-tuning — datasets & Mac 32 GB workflow

Use this **after** local Ollama inference works. Training is done **offline** (Python), then you optionally import a custom model into Ollama.

**Train on:** MacBook 32 GB (or cloud GPU).  
**Do not train on:** Dell 8 GB.

---

## What you are actually training

| Layer | What it does |
|-------|----------------|
| **BENZI app (Node)** | Builds context (PDFs, goals, history) — keep this |
| **Base model (3B)** | Generates words |
| **QLoRA fine-tune** | Teaches **empathetic style** (reflect, validate, ask gentle questions) |

You are **not** training from scratch. You add a small adapter (~50–200 MB) on top of a 3B instruct model.

**Base models that fit 32 GB Mac (pick one):**

- `meta-llama/Llama-3.2-3B-Instruct`
- `Qwen/Qwen2.5-3B-Instruct`
- `microsoft/Phi-3-mini-4k-instruct`

Match your Ollama base when possible (e.g. fine-tune Llama 3.2 3B → export → Ollama).

---

## Recommended datasets (suitable for FYP)

### 1. EmpatheticDialogues (Facebook) — **start here**

- **What:** Speaker shares an emotion; listener responds with empathy.
- **Size:** ~25k conversations — use a **subset** (5k–10k) on Mac for faster epochs.
- **License:** Research use — cite in report; check current license on GitHub.
- **Repo:** https://github.com/facebookresearch/EmpatheticDialogues  
- **Why:** Classic empathy benchmark; easy to explain to examiners.

### 2. ESConv (Emotional Support Conversation)

- **What:** Help-seeker + supporter; closer to **mental health support** tone.
- **Size:** ~1k full dialogs — good for Mac + meaningful for BENZI.
- **Repo:** https://github.com/thu-coai/ESCov  
- **Why:** Better story for “therapy support AI” than chit-chat empathy alone.

### 3. Counsel Chat (smaller, counseling-style) — optional

Search Hugging Face for `counsel-chat` or similar **counseling** corpora. Use only if license allows and you anonymize for the report.

### 4. Your own BENZI-safe subset (recommended add-on)

Export **synthetic** or **hand-written** dialogs:

- Supportive, non-diagnostic, crisis-escalation examples
- Matches `aiPromptBuilder.js` rules (no diagnosis, no meds)

~500–2000 high-quality examples often beat huge noisy data for a 3B model.

---

## Suggested training plan (Mac 32 GB)

### Phase 1 — Inference only (now)

1. `llama3.2:3b` + `LLM_PROVIDER=ollama` + `OLLAMA_NUM_CTX=2048`
2. Tune prompts in `aiPromptBuilder.js` if needed
3. Document context-aware RAG in FYP report

### Phase 2 — Fine-tune (later)

1. Tool: **Unsloth** or **LLaMA-Factory** (QLoRA, 4-bit)
2. Data: **ESConv** (primary) + **EmpatheticDialogues** (mix 20–30%)
3. Format: ShareGPT / Alpaca JSON (instruction, input, output)
4. Epochs: 1–3; watch validation loss — avoid overfitting
5. Merge LoRA → export **GGUF** → `ollama create` custom Modelfile

### Phase 3 — Evaluate

- Same prompts with/without adapter
- Latency (`npm run test:ollama`, `fyp-ml-demos/eval_ollama_demo.py`)
- Safety: crisis phrases still hit `crisisDetectionService` (rules, not LLM)

---

## Example data format (one row)

```json
{
  "instruction": "You are BENZI, a supportive mental wellness assistant. Do not diagnose or prescribe. Reflect feelings and ask one gentle question.",
  "input": "I've been anxious about exams and can't sleep.",
  "output": "That sounds really exhausting — exam pressure plus poor sleep can feed each other. What's been weighing on you most this week?"
}
```

Filter training data to remove:

- Medical diagnoses as facts
- Dosages / medication advice
- Toxic or crisis-glorifying content (keep crisis handling in **rules**, not learned unsafe replies)

---

## RAM tips while training on Mac

- Quit Ollama (`npm run ollama:quit`) before training
- Close Chrome, MongoDB optional if not needed
- Batch size 1–2, gradient accumulation 4–8
- Max sequence length 1024–2048 for 3B QLoRA
- Expect **hours**, not minutes, on CPU/Mac GPU

---

## After training — use in BENZI

```env
LLM_PROVIDER=ollama
OLLAMA_MODEL=benzi-empathetic
```

Create model:

```bash
ollama create benzi-empathetic -f ./Modelfile
```

See Unsloth/Ollama docs for GGUF export steps when you reach phase 2.

---

## FYP report wording

- “We fine-tuned a **3B instruction-tuned LLM** with **QLoRA** on **ESConv** and **EmpatheticDialogues** subsets for empathetic responses, while **patient-specific context** is retrieved at runtime from reports and goals (RAG).”
- “Crisis detection remains **rule-based** for reliability.”
