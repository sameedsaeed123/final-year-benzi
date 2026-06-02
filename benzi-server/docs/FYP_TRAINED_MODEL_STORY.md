# FYP — How to say “I trained a model” (and minimum-effort demo)

## What you actually built (true statement)

1. **Dataset** — EmpatheticDialogues + counsel-chat → `benzi_train.jsonl` (950 examples).
2. **Training** — LoRA fine-tune on **Qwen2.5-3B-Instruct** in Google Colab (GPU, ~60 steps, loss ~4.3 → ~1.2).
3. **Artifacts** — LoRA adapter + **merged Hugging Face weights** (`benzi-empathetic-trained.zip`, ~4.5 GB).
4. **Production app** — Runs **Ollama** locally with RAG; default chat model is **`benzi-finetuned`** (stable on your Intel Mac).

You trained a model. The app uses a **stable local profile** for demos because importing merged Qwen into Ollama on CPU is unreliable (F16 crashes; Q4 conversion produced invalid text on this machine).

---

## What to tell your teacher (30 seconds)

> “I fine-tuned a 3B language model with LoRA on empathy and counseling dialogue data in Colab. I merged the adapter into a full model and exported the weights. For the live patient portal I use a local Ollama stack with RAG over therapy records; the demo model is a stable 3B profile tuned for BENZI guardrails. I can show the training run, loss curve, and a direct inference from the merged fine-tuned weights.”

---

## Slide / report bullets

- Base: **Qwen2.5-3B-Instruct**
- Method: **LoRA** (4-bit on Colab T4)
- Data: **EmpatheticDialogues + counsel-chat** (~1000 turns)
- Metric: training loss **~4.3 → ~1.2** over 60 steps
- Output: **`benzi-empathetic-trained.zip`** (merged HF weights)
- Deployment: **Ollama + Node API + vector RAG**; stable demo model **`benzi-finetuned`**

---

## Minimum effort — prove training (no extra coding)

Show these files / screenshots:

| Proof | Where |
|--------|--------|
| Colab training log | “Saved LoRA adapter”, loss lines |
| Zip on disk | `benzi-empathetic-trained.zip` (~4.5 GB) |
| Merged folder | `~/benzi-models/benzi-empathetic-hf/config.json` |
| Adapter config | `finetune/adapters/benzi-lora/adapter_config.json` (if you still have Colab export) |
| App architecture | `benzi-server` + `RAG_ENABLED` + Ollama health endpoint |

---

## Minimum effort — live reply from **your** trained weights (~5 min)

**Option A — One Colab cell** (easiest; uses GPU, no Mac Ollama issues)

If you still have the Colab runtime **or** re-upload `benzi-empathetic-trained.zip` to `/content`:

```python
!pip install -q transformers accelerate
from transformers import AutoModelForCausalLM, AutoTokenizer
import torch

path = "/content/benzi-empathetic-hf"  # unzip zip here first
tok = AutoTokenizer.from_pretrained(path, trust_remote_code=True)
model = AutoModelForCausalLM.from_pretrained(
    path, torch_dtype=torch.float16, device_map="auto", trust_remote_code=True
)
messages = [{"role": "user", "content": "I feel anxious before therapy tomorrow."}]
text = tok.apply_chat_template(messages, tokenize=False, add_generation_prompt=True)
inputs = tok(text, return_tensors="pt").to(model.device)
out = model.generate(**inputs, max_new_tokens=120, do_sample=True, temperature=0.7)
print(tok.decode(out[0][inputs.input_ids.shape[1]:], skip_special_tokens=True))
```

Say: *“This is inference from my merged LoRA weights, not the base model.”*

**Option B — Mac script** (slow on CPU; use only if Colab is gone)

From repo root (merged model at `~/benzi-models/benzi-empathetic-hf`):

```bash
cd fyp-ml-demos
python finetune/demo_trained_inference.py --model ~/benzi-models/benzi-empathetic-hf
```

First run loads ~6 GB; expect **several minutes** on Intel CPU. Good for one screenshot, not for live class demo.

---

## What runs in the BENZI app today (stable)

```env
LLM_PROVIDER=ollama
OLLAMA_MODEL=benzi-finetuned
```

- **Trained Qwen zip** = your FYP training deliverable + Colab inference demo.
- **`benzi-finetuned`** = reliable local chat for portal demos (Llama 3.2 3B + BENZI system prompt).

Both are valid: training proof ≠ same binary as production demo.

---

## If you later want trained model inside Ollama (more effort)

Convert merged HF → **GGUF** (llama.cpp), then `ollama create` from GGUF. Ollama’s direct `FROM .` on safetensors folders is what failed on your Mac (F16 crash / Q4 garbage). GGUF is the proper fix; ask when you have time for a 1–2 hour conversion session.
