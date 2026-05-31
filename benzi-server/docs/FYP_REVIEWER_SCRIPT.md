# What to tell your FYP reviewer (honest + strong)

You do **not** need to claim you trained a 3B model on your Mac for days. Your project already has real ML/engineering work.

## One-sentence pitch

> BENZI is a between-session mental health support platform that combines **patient-specific context** (records, goals, chat history), a **local LLM** (Ollama), **crisis detection**, and **sentiment analytics** — with strict guardrails that AI does not replace the therapist.

## What you actually built (say these confidently)

1. **Context-aware AI (RAG-lite)**  
   Patient PDFs and goals are extracted and injected into each prompt (`aiContextBuilder` + `aiPromptBuilder`). Replies are personalized, not generic ChatGPT.

2. **Safety layer**  
   Rule-based crisis detection with false-positive handling (e.g. “killing time”). Crisis paths alert the therapist and return safe messages instead of casual chat.

3. **Sentiment pipeline**  
   Patient messages are scored (DistilBERT microservice when running, keyword fallback otherwise). Scores feed mood logs and therapist analytics.

4. **Local LLM deployment**  
   Ollama runs `llama3.2:3b` on the Mac for demos without sending patient text to a cloud API (when `LLM_PROVIDER=ollama`).

5. **Custom BENZI model (prompt-aligned)**  
   `ollama create benzi` applies a fixed system prompt and parameters tuned for empathy and scope limits — **minutes**, not days of training.

6. **Fine-tuning readiness (optional slide)**  
   You prepared **~4,800** training pairs from Empathetic Dialogues + Counsel Chat (`fyp-ml-demos/finetune/data/`). Full LoRA on a 3B model was scoped for GPU/Colab; the **production path** uses Ollama + application-level prompts + safety code.

## What NOT to claim

- Do **not** say “we fully fine-tuned Llama 3.2 on our Mac” unless you actually finished training and deployed GGUF.
- Do **not** say “vector database RAG” unless you add embeddings — say **“context injection from MongoDB records”**.

## 2-minute demo flow

1. Log in as patient → open BENZI AI.  
2. Ask something emotional → show empathetic reply + therapist deferral if clinical.  
3. Say something with crisis wording → show crisis response / alert (test account).  
4. Show therapist dashboard mood/sentiment if available.  
5. Mention: records on file change the answer (upload a PDF first if demo allows).

## If they ask “Why not fine-tune?”

> Fine-tuning a 3B model on CPU would take days and isn’t needed for our demo. We aligned behavior with a **custom Ollama Modelfile**, rich **system prompts in the backend**, and a **safety pipeline**. We also **curated public empathy datasets** and validated a LoRA pipeline on a small model as future work / methodology.

## Quick setup before viva (5 minutes)

```bash
cd benzi-server
npm run ollama:pull-fast
npm run ollama:create-benzi
```

In `.env`:

```env
LLM_PROVIDER=ollama
OLLAMA_MODEL=benzi
OLLAMA_NUM_CTX=2048
```

Optional sentiment:

```bash
cd ../fyp-ml-demos && ./finetune/run_pipeline.sh sentiment
```

```env
SENTIMENT_SERVICE_URL=http://127.0.0.1:5001
```
