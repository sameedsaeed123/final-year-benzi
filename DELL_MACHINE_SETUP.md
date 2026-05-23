# BENZI — Full setup on a new Dell laptop

Use this guide after you **unzip** the project on a fresh machine that only has **Node.js** installed. It covers MongoDB, Redis (optional), Ollama (local AI), and how to run the website, API, and admin panel.

---

## 1. What you are running

| App | Folder | URL (dev) | Purpose |
|-----|--------|-----------|---------|
| **API** | `benzi-server/` | http://localhost:5000 | Backend, AI, Stripe, chat |
| **Website** | `Fyp-To-Reduce-Mental-Health/` | http://localhost:5173 | Patient + therapist UI |
| **Admin** | `benzi-admin/` | http://localhost:5174 | Admin dashboard |
| **Ollama** | (system install) | http://127.0.0.1:11434 | Local LLM for FYP demo |
| **Python demos** | `fyp-ml-demos/` | port 5001 (optional) | Sentiment ML for reports |

---

## 2. System requirements

### Minimum (FYP demo on Dell ~8 GB RAM)

| Requirement | Version / notes |
|-------------|-----------------|
| **OS** | Windows 10/11, macOS, or Linux |
| **Node.js** | **20 LTS** or **22 LTS** ([nodejs.org](https://nodejs.org)) — you already have Node; verify with `node -v` (should be ≥ 18) |
| **npm** | Comes with Node — `npm -v` |
| **MongoDB** | **7.x** local or Atlas cloud URI |
| **Disk** | ~15 GB free (node_modules + Ollama model ~2 GB) |
| **RAM** | 8 GB works with **small** Ollama model (`llama3.2:3b` or `gemma2:2b`) |

### Recommended installs (in order)

1. **Node.js** — already installed ✓  
2. **MongoDB Community Server** — database (required)  
3. **Ollama** — local AI (required for offline/FYP ML demo)  
4. **Redis** — optional (email queue + admin cache; app works without it, slower email)  
5. **Python 3.10+** — optional (`fyp-ml-demos` only)  
6. **Git** — optional (not needed if you use zip only)

### What you do **not** need for a basic demo

- Stripe keys (subscriptions fall back to dev mode without payment)
- Gmail / SMTP (emails queue fail silently in dev)
- OpenRouter / Gemini keys (if using **Ollama**)

---

## 3. Unzip and open the project

1. Unzip to a short path, e.g.  
   - Windows: `C:\Projects\benzi`  
   - macOS: `~/Projects/benzi`
2. Open **Terminal** (Windows: PowerShell or **Windows Terminal**).
3. Go to the repo root (folder that contains `benzi-server`, `Fyp-To-Reduce-Mental-Health`, `package.json`):

```bash
cd C:\Projects\benzi
# or: cd ~/Projects/benzi
```

4. Confirm structure:

```text
benzi/
├── benzi-server/          ← API
├── Fyp-To-Reduce-Mental-Health/   ← main website
├── benzi-admin/           ← admin UI
├── fyp-ml-demos/          ← Python ML (optional)
├── package.json           ← runs API + website together
├── DELL_MACHINE_SETUP.md  ← this file
└── FYP_OLLAMA_QUICKSTART.md
```

**Do not** open only `benzi-server` — the root `npm run dev` starts both API and website.

---

## 4. Install MongoDB (required)

The API will not start without a working `MONGODB_URI`.

### Option A — Local MongoDB (best for offline Dell)

**Windows**

1. Download: https://www.mongodb.com/try/download/community  
2. Install **MongoDB Community** as a **Windows Service** (default).  
3. Install **MongoDB Compass** (GUI) if offered — useful to see data.  
4. Test in PowerShell:

```powershell
mongosh
# should connect; type: show dbs
exit
```

**macOS**

```bash
brew tap mongodb/brew
brew install mongodb-community@7.0
brew services start mongodb-community@7.0
mongosh
```

### Option B — MongoDB Atlas (cloud, no local install)

1. Create free cluster at https://www.mongodb.com/cloud/atlas  
2. Get connection string, e.g.  
   `mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/benzi?retryWrites=true&w=majority`  
3. Put it in `benzi-server/.env` as `MONGODB_URI=...`  
4. In Atlas: **Network Access** → allow your IP (or `0.0.0.0/0` for demo only).

### Default local URI (use in `.env`)

```env
MONGODB_URI=mongodb://127.0.0.1:27017/benzi
```

---

## 5. Install Ollama (local AI — FYP)

Ollama runs the **local language model** so you do not need OpenRouter/Gemini on the Dell.

### 5.1 Install

1. https://ollama.com → download for Windows/macOS.  
2. Install and **open the Ollama app** (it starts the server on port `11434`).  
3. Confirm in a new terminal:

```bash
ollama --version
curl http://127.0.0.1:11434/api/tags
```

### 5.2 Pull a small model (8 GB RAM Dell)

```bash
ollama pull llama3.2:3b
```

If slow or out of memory:

```bash
ollama pull gemma2:2b
```

Avoid large models (`llama3.1:8b`) on 8 GB RAM while MongoDB + browser + IDE are open.

### 5.3 Quick test

```bash
ollama run llama3.2:3b "Say hello in one sentence."
```

### 5.4 Configure the API to use Ollama

Edit **`benzi-server/.env`** (create from example in step 6):

```env
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_NUM_CTX=4096
```

More detail: [benzi-server/docs/OLLAMA_SETUP.md](benzi-server/docs/OLLAMA_SETUP.md)

---

## 6. Install Redis (optional)

Used for **email queue** and **admin panel caching**. The app runs without Redis; some features degrade gracefully.

**Windows (simple)**

- Install [Memurai](https://www.memurai.com/) (Redis-compatible), or  
- Docker: `docker run -d -p 6379:6379 --name redis redis:7-alpine`

**macOS**

```bash
brew install redis
brew services start redis
redis-cli ping
# PONG
```

If you skip Redis, leave in `.env`:

```env
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
```

---

## 7. Configure environment files

### 7.1 Backend — `benzi-server/.env`

```bash
cd benzi-server
```

**Windows (PowerShell):**

```powershell
copy .env.example .env
```

**macOS/Linux:**

```bash
cp .env.example .env
```

Edit **`benzi-server/.env`**. Minimum for Dell + Ollama + local Mongo:

```env
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:5173
LISTEN_HOST=127.0.0.1

MONGODB_URI=mongodb://127.0.0.1:27017/benzi

JWT_SECRET=change_this_to_at_least_32_random_characters_for_dell_demo

# Ollama (local AI)
LLM_PROVIDER=ollama
OLLAMA_BASE_URL=http://127.0.0.1:11434
OLLAMA_MODEL=llama3.2:3b
OLLAMA_NUM_CTX=4096

# Redis (optional)
REDIS_HOST=127.0.0.1
REDIS_PORT=6379
REDIS_DB=0

# Admin seed (used by npm run seed:admin)
SEED_ADMIN_EMAIL=admin@benzi.local
SEED_ADMIN_PASSWORD=ChangeMe!Admin1
```

Leave **Stripe** empty for demo unless you need payments. Leave **EMAIL_*** empty unless you configure Gmail.

### 7.2 Website — `Fyp-To-Reduce-Mental-Health/.env` (optional)

Usually **not required** — Vite proxies `/api` to port 5000.

Optional `Fyp-To-Reduce-Mental-Health/.env`:

```env
# VITE_API_URL=
# VITE_PROXY_API_PORT=5000
```

### 7.3 Admin — `benzi-admin/.env` (optional)

```env
VITE_PUBLIC_WEBSITE_URL=http://localhost:5173
# VITE_PROXY_API_PORT=5000
```

---

## 8. Install dependencies

From **repo root** (important):

```bash
cd C:\Projects\benzi
# or your unzip path

npm install
npm install --prefix benzi-server
npm install --prefix Fyp-To-Reduce-Mental-Health
npm install --prefix benzi-admin
```

First `npm install` installs `concurrently` at root to run API + website together.

---

## 9. Seed database (first time only)

With MongoDB running:

```bash
cd benzi-server

# Admin login for benzi-admin
npm run seed:admin

# Subscription plans (Try free, BENZI Pro, Plus)
npm run seed:plans

# Optional: demo therapists/patients/data
npm run seed:demo
```

**Default admin login** (after `seed:admin`):

| Field | Value |
|-------|--------|
| Email | `admin@benzi.local` |
| Password | `ChangeMe!Admin1` |

Use at: http://localhost:5174/login

---

## 10. Start everything

### Terminal layout (recommended)

| # | What | Command | URL |
|---|------|---------|-----|
| 0 | Ollama | Open **Ollama app** (or `ollama serve`) | — |
| 1 | MongoDB | Windows service / `brew services` | — |
| 2 | API + Website | From repo root: `npm run dev` | API :5000, site :5173 |
| 3 | Admin (optional) | `cd benzi-admin && npm run dev` | :5174 |

### Start API + website (one command)

From **repo root**:

```bash
npm run dev
```

You should see:

- `api` — `benzi-server` on **http://localhost:5000**
- `web` — Vite on **http://localhost:5173**

### Start admin (second terminal)

```bash
cd benzi-admin
npm run dev
```

Open http://localhost:5174

---

## 11. Verify Ollama + API

**Terminal A** — Ollama must be running.

**Terminal B** — from `benzi-server`:

```bash
npm run test:ollama
```

Expected: connection OK, model available, sample reply text.

**Browser:**

```text
http://localhost:5000/api/ai/health
```

Example good response:

```json
{
  "provider": "ollama",
  "ok": true,
  "ollamaReachable": true,
  "modelAvailable": true,
  "model": "llama3.2:3b"
}
```

---

## 12. Optional — Python ML demos

For supervisor demos (sentiment, crisis, RAG script):

```bash
cd fyp-ml-demos
python -m venv .venv
```

**Windows:**

```powershell
.venv\Scripts\activate
pip install -r requirements.txt
python crisis_demo.py
python rag_ollama_demo.py
```

**macOS/Linux:**

```bash
source .venv/bin/activate
pip install -r requirements.txt
```

**Optional sentiment API for Node:**

```bash
python sentiment_service.py
```

In `benzi-server/.env`:

```env
SENTIMENT_SERVICE_URL=http://127.0.0.1:5001
```

See [fyp-ml-demos/README.md](fyp-ml-demos/README.md).

---

## 13. Daily workflow (cheat sheet)

```bash
# 1. Start MongoDB (if not a service)
# 2. Open Ollama app

cd C:\Projects\benzi
npm run dev                    # API + website

# new terminal
cd benzi-admin && npm run dev  # admin
```

| URL | Use |
|-----|-----|
| http://localhost:5173 | Public site, register therapist/patient |
| http://localhost:5174 | Admin panel |
| http://localhost:5000/api/ai/health | AI health check |

---

## 14. Troubleshooting

| Problem | Fix |
|---------|-----|
| `Missing MONGODB_URI` / Mongo error | Start MongoDB; check `MONGODB_URI` in `benzi-server/.env` |
| `502` / proxy errors on website | Start API first (`npm run dev` from root includes API) |
| `ECONNREFUSED` Ollama | Open Ollama app; `ollama pull llama3.2:3b` |
| AI empty / slow | Use `gemma2:2b`; close Chrome; lower `OLLAMA_NUM_CTX=2048` |
| `npm install` errors | Node ≥ 18; delete `node_modules` and reinstall |
| Admin login fails | Run `cd benzi-server && npm run seed:admin` |
| Port in use | Change `PORT` in `.env` or kill process on 5000/5173/5174 |
| Stripe redirect wrong URL | Set `FRONTEND_URL=http://localhost:5173` (with port) |
| Redis errors in logs | Install Redis or ignore if only demoing UI/AI |

**Windows — allow Node through firewall** when prompted (ports 5000, 5173, 5174).

---

## 15. Switch AI back to cloud (optional)

In `benzi-server/.env`:

```env
LLM_PROVIDER=openrouter
OPENROUTER_API_KEY=your_key_here
OPENROUTER_MODEL=openai/gpt-4o-mini
```

Restart API. Ollama not required.

---

## 16. Related docs

| Document | Content |
|----------|---------|
| [FYP_OLLAMA_QUICKSTART.md](FYP_OLLAMA_QUICKSTART.md) | Short Ollama-only steps |
| [benzi-server/docs/OLLAMA_SETUP.md](benzi-server/docs/OLLAMA_SETUP.md) | AI architecture + troubleshooting |
| [fyp-ml-demos/README.md](fyp-ml-demos/README.md) | Python ML scripts |
| [benzi-server/.env.example](benzi-server/.env.example) | All env variables |

---

## 17. Checklist for Dell (print this)

- [ ] Node 18+ (`node -v`)
- [ ] Project unzipped, path without spaces issues OK
- [ ] MongoDB installed & running (`mongosh` works)
- [ ] Ollama installed, app open, `ollama pull llama3.2:3b`
- [ ] `benzi-server/.env` created from `.env.example`
- [ ] `LLM_PROVIDER=ollama` set in `.env`
- [ ] `npm install` at root + benzi-server + website + admin
- [ ] `npm run seed:admin` and `npm run seed:plans`
- [ ] `npm run dev` from root → http://localhost:5173
- [ ] `npm run test:ollama` passes
- [ ] Admin at http://localhost:5174 with seed credentials

You are ready for FYP demo on the Dell.
