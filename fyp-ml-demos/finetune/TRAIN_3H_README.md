# BENZI training

**Use Google Colab (recommended):** [benzi-server/docs/COLAB_TRAIN.md](../../benzi-server/docs/COLAB_TRAIN.md) — open `BENZI_Colab_Train.ipynb` (~2–3h on free GPU).

---

# BENZI 3B LoRA training on Mac (~many hours — not recommended)

Trains **Qwen2.5-3B-Instruct** with LoRA on empathy + counseling data, merges weights, imports to Ollama as **`benzi-empathetic-trained`**.

This is **real weight fine-tuning** (not just a Modelfile on base Llama).

## Before you start

- Plug in Mac, good ventilation (~12–20 GB RAM used).
- Ollama installed and running.
- ~6 GB disk free (model download + merged weights).

```bash
cd fyp-ml-demos
source .venv/bin/activate   # or created by script
chmod +x finetune/run_train_3h.sh
./finetune/run_train_3h.sh
```

Or from repo root: `npm run train:benzi-3h --prefix benzi-server`

## After it finishes

In `benzi-server/.env`:

```env
OLLAMA_MODEL=benzi-empathetic-trained
```

Restart API. Test: `npm run test:ollama --prefix benzi-server`

## What you can tell your examiner

> We LoRA-fine-tuned a **3B instruction model** on **Empathetic Dialogues** and **Counsel Chat**, merged the adapter, and deployed it locally via **Ollama** as `benzi-empathetic-trained`, combined with **embedding-based RAG** over patient PDFs.

## If it failed with `MPS backend out of memory`

The 3B model is too large for Apple **MPS** (~7GB cap). Re-run the script — it now forces **CPU** (uses your 32GB RAM):

```bash
./finetune/run_train_3h.sh
```

Close Chrome/other heavy apps first.

## If it runs longer than 3 hours

Normal on CPU. You can stop (Ctrl+C) and use checkpoint in `finetune/adapters/benzi-lora`, then:

```bash
python finetune/merge_lora.py
python finetune/export_ollama.py
```

## Note on Llama vs Qwen

`benzi-finetuned` uses **llama3.2:3b** + Modelfile.  
`benzi-empathetic-trained` uses **merged Qwen2.5-3B + LoRA weights** — better “we trained the model” story.
