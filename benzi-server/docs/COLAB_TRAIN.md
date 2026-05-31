# Train BENZI on Google Colab

Use **only** this link (loads notebook from GitHub `main`):

**https://colab.research.google.com/github/sameedsaeed123/final-year-benzi/blob/main/fyp-ml-demos/finetune/BENZI_Colab_Train.ipynb**

Do not use an old Colab tab or *File → Open* from a saved copy — always use the link above.

[![](https://colab.research.google.com/assets/colab-badge.svg)](https://colab.research.google.com/github/sameedsaeed123/final-year-benzi/blob/main/fyp-ml-demos/finetune/BENZI_Colab_Train.ipynb)

## Steps in Colab

1. **Runtime → Change runtime type → T4 GPU**
2. **Runtime → Run all** (~1 hour total; merge is 15–40 min — **do not press Stop**)
3. Download **`benzi-empathetic-trained.zip`** when Cell 6 runs

Uses `merge_lora_colab.py` (not `merge_lora.py`) and `requirements-finetune-colab.txt` (no numpy downgrade).

## On your Mac after download

```bash
mkdir -p ~/benzi-models && cd ~/benzi-models
unzip ~/Downloads/benzi-empathetic-trained.zip -d benzi-empathetic-hf
cd benzi-empathetic-hf

cat > Modelfile << 'EOF'
FROM .
PARAMETER temperature 0.65
PARAMETER top_p 0.9
PARAMETER num_ctx 4096
SYSTEM You are BENZI AI — warm wellness support between therapy sessions. You are NOT a therapist. Defer diagnosis, meds, and crisis to their licensed therapist.
EOF

ollama create benzi-empathetic-trained -f Modelfile
```

`benzi-server/.env`:

```env
OLLAMA_MODEL=benzi-empathetic-trained
OLLAMA_NUM_CTX=4096
RAG_ENABLED=true
```

```bash
cd benzi-server && npm run rag:reindex && npm run dev
```

## Private GitHub repo?

In Colab cell 3, skip `git clone`. Upload a zip of `fyp-ml-demos` folder, unzip, then `%cd fyp-ml-demos`.

## Faster run (~1 hour)

In the notebook, use the **benzi-lite** cell instead of full 3B (uncomment lite, skip full 3B cell).

## Context without training

Training improves **tone**. For **more context**, you already have **RAG** — see [BENZI_CONTEXT_SETUP.md](./BENZI_CONTEXT_SETUP.md). No Colab required for that.
