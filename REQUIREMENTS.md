# BENZI — Software requirements

Quick reference for machines that receive the project zip (e.g. Dell laptop).

## Required

| Software | Version | Download | Used for |
|----------|---------|----------|----------|
| **Node.js** | 20.x or 22.x LTS | https://nodejs.org | API, website, admin |
| **npm** | 10+ (with Node) | — | Dependencies |
| **MongoDB** | 7.x local or Atlas | https://www.mongodb.com/try/download/community | All data |

## Required for local AI (FYP / Ollama demo)

| Software | Version | Download | Used for |
|----------|---------|----------|----------|
| **Ollama** | Latest | https://ollama.com | Local LLM |
| **Model** | `llama3.2:3b` or `gemma2:2b` | `ollama pull …` | Fits 8 GB RAM |

## Optional

| Software | Version | Download | Used for |
|----------|---------|----------|----------|
| **Redis** | 7.x | https://redis.io or Memurai (Windows) | Email queue, admin cache |
| **Python** | 3.10+ | https://python.org | `fyp-ml-demos/` only |
| **Git** | Any | https://git-scm.com | Version control (not needed from zip) |

## Hardware (Dell FYP laptop)

| Resource | Minimum |
|----------|---------|
| RAM | 8 GB (use small Ollama model) |
| Disk | 15 GB free |
| GPU | Optional (~2 GB helps Ollama slightly) |

## Ports used in development

| Port | Service |
|------|---------|
| 5000 | benzi-server API |
| 5173 | Main website (Vite) |
| 5174 | Admin panel (Vite) |
| 11434 | Ollama |
| 27017 | MongoDB (default) |
| 6379 | Redis (optional) |
| 5001 | Python sentiment service (optional) |

## Full setup guide

See **[DELL_MACHINE_SETUP.md](DELL_MACHINE_SETUP.md)** for step-by-step install, `.env`, seeds, and troubleshooting.  
Copy existing DB: **[benzi-server/docs/COPY_DATABASE_TO_LOCAL.md](benzi-server/docs/COPY_DATABASE_TO_LOCAL.md)** · Demo seeds: **[SEED_DATABASE.md](benzi-server/docs/SEED_DATABASE.md)**.
