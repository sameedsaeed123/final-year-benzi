# BENZI empathy LoRA fine-tuning

Fine-tune **Llama-3.2-3B-Instruct** on empathetic + counseling-style data so BENZI sounds warmer and respects “not a therapist” boundaries.

## Important: your Mac is Intel (2019 i9)

| Tool | Works on your Mac? |
|------|-------------------|
| **mlx-lm** | **No** — Apple Silicon only |
| **This folder (`train_qlora.py`)** | **Yes** — CPU (slow) or use Colab GPU |
| **Ollama** | **Yes** — run merged model after GGUF export |

## One-command setup

From `fyp-ml-demos`:

```bash
chmod +x finetune/run_pipeline.sh
./finetune/run_pipeline.sh prepare
./finetune/run_pipeline.sh train-quick
```

- `prepare` — downloads EmpatheticDialogues + Counsel Chat (or uses built-in samples if offline).
- `train-quick` — ~80 examples, 30 steps (demo for FYP; not production quality).
- Full run: `./finetune/run_pipeline.sh train --max-steps 500` (hours on CPU).

## HuggingFace login (Llama 3.2)

Meta’s model may require accepting the license:

```bash
pip install huggingface_hub
huggingface-cli login
```

## Use with Ollama (after merge)

1. Merge adapter:

   ```bash
   ./finetune/run_pipeline.sh merge
   ```

2. Convert merged folder to **GGUF** (pick one):

   - **Colab** (fastest): upload `merged/benzi-empathetic-hf`, use `llama.cpp` convert script or Unsloth export.
   - **Local**: clone [llama.cpp](https://github.com/ggml-org/llama.cpp) and run `convert_hf_to_gguf.py` on `merged/benzi-empathetic-hf`.

3. Create Ollama model:

   ```bash
   # In folder with your .gguf file
   cat > Modelfile <<'EOF'
   FROM ./benzi-empathetic-q4_k_m.gguf
   PARAMETER temperature 0.7
   PARAMETER num_ctx 2048
   SYSTEM You are BENZI, a supportive mental wellness assistant between therapy sessions. You are not a therapist.
   EOF
   ollama create benzi-empathetic -f Modelfile
   ```

4. In `benzi-server/.env`:

   ```env
   OLLAMA_MODEL=benzi-empathetic
   ```

## Connect DistilBERT sentiment (optional)

```bash
./finetune/run_pipeline.sh sentiment
```

In `benzi-server/.env`:

```env
SENTIMENT_SERVICE_URL=http://127.0.0.1:5001
```

## FYP report wording

> We built a context-aware pipeline (patient records + goals + chat history) and LoRA-fine-tuned Llama-3.2-3B on empathetic dialogue and counseling Q&A to align tone and professional boundaries, evaluated with crisis detection and sentiment analytics.

See also [benzi-server/docs/EXTERNAL_AI_REVIEW_RESPONSE.md](../../benzi-server/docs/EXTERNAL_AI_REVIEW_RESPONSE.md).
