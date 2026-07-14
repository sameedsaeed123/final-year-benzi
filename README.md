# Benzi — AI-Assisted Mental Health Support Platform

**Final Year Project · Group F25CS186**

| Member | Roll No |
|--------|---------|
| Sameed Saeed | L1F22BSCS0956 |
| Hassan Hayat | L1F22BSCS0976 |
| Faziyab Ahmad | L1F22BSCS1111 |

**Supervisor:** Mam Misha Asif

---

## Table of contents

1. [What is Benzi?](#what-is-benzi)
2. [Repository structure](#repository-structure)
3. [How to run](#how-to-run)
4. [Ports & URLs](#ports--urls)
5. [Default credentials](#default-credentials)
6. [Tech stack](#tech-stack)
7. [Architecture (short)](#architecture-short)
8. [Database](#database)
9. [Security & encryption](#security--encryption)
10. [Reports & privacy](#reports--privacy)
11. [AI / Ollama](#ai--ollama)
12. [Key files cheat sheet](#key-files-cheat-sheet)
13. [Jury Q&A — project overview](#jury-qa--project-overview)
14. [Jury Q&A — architecture & code](#jury-qa--architecture--code)
15. [Jury Q&A — security & privacy](#jury-qa--security--privacy)
16. [Jury Q&A — AI & ML](#jury-qa--ai--ml)
17. [Jury Q&A — database](#jury-qa--database)
18. [Jury Q&A — features & demo](#jury-qa--features--demo)
19. [Jury Q&A — limitations & future work](#jury-qa--limitations--future-work)
20. [Demo script (5–7 min)](#demo-script-57-min)
21. [Diagrams & presentation](#diagrams--presentation)

---

## What is Benzi?

Benzi is a **full-stack mental health platform** with three web apps:

| App | Folder | Users |
|-----|--------|-------|
| **Patient / Therapist portal** | `Fyp-To-Reduce-Mental-Health/` | Patients & therapists |
| **Admin dashboard** | `benzi-admin/` | Platform admins |
| **API + real-time server** | `benzi-server/` | Backend for all apps |

**Core value:** Support patients **between therapy sessions** with a local AI companion, mood tracking, appointments, secure chat, clinical reports, and therapist oversight — with **privacy and safety guardrails**.

---

## Repository structure

```
newrepo/
├── README.md                          ← This file (jury guide + Q&A)
├── package.json                       ← Run API + patient app together: npm run dev
│
├── benzi-server/                      ← Node.js API (Express + MongoDB + Socket.IO)
│   ├── server.js                      ← Entry: connectDB(), start HTTP + Socket.IO
│   ├── .env                           ← Secrets (MongoDB, JWT, Ollama, Stripe) — not committed
│   ├── .env.example                   ← Safe template
│   ├── ollama/
│   │   ├── Modelfile.benzi-finetuned  ← Ollama model: llama3.2:3b + BENZI system prompt
│   │   └── Modelfile.benzi
│   └── src/
│       ├── app.js                     ← Express app, routes, static /api/files
│       ├── config/
│       │   ├── database.js            ← MongoDB connect (Mongoose)
│       │   ├── environment.js         ← Env validation
│       │   └── email.js               ← SMTP / Redis queue config
│       ├── middleware/
│       │   ├── verifyJWT.js           ← Auth + requireRoles()
│       │   ├── recordUpload.js        ← Report file upload (type/size limits)
│       │   └── rateLimiters.js
│       ├── models/                    ← MongoDB schemas (User, Patient, Record, …)
│       ├── routes/                    ← API route definitions
│       ├── controllers/               ← HTTP handlers
│       ├── services/                  ← Business logic
│       ├── workers/                   ← Email worker (BullMQ)
│       └── scripts/                   ← Seed, diagnose, RAG reindex, etc.
│
├── Fyp-To-Reduce-Mental-Health/       ← Patient + therapist React app (Vite)
│   └── src/
│       ├── App.jsx                    ← Routes
│       ├── pages/patient/             ← Patient dashboard, chat, reports, …
│       ├── pages/therapist/           ← Therapist dashboard, clients, …
│       ├── pages/DoctorsPage.jsx      ← Find & book doctors
│       ├── components/                ← Shared UI (sidebar, chat, booking modal)
│       └── context/AuthContext.jsx      ← Login state, JWT
│
├── benzi-admin/                       ← Admin React app (Vite, port 5174)
│   └── src/pages/admin/               ← Verifications, subscriptions, revenue
│
├── fyp-ml-demos/                      ← AI training & demos
│   └── finetune/                      ← QLoRA on Qwen2.5-3B, export to Ollama
│
├── docs/diagrams/                     ← ERD, DFD, component diagrams (.mmd + .png)
├── ppt-build/                         ← Build FYP PowerPoint (node build.js)
└── Benzi-FYP-Final-Evaluation.pptx  ← Final evaluation slides
```

### Backend folder roles

| Folder | Purpose |
|--------|---------|
| `routes/` | Maps URLs to controllers; attaches `verifyJWT`, `requireRoles` |
| `controllers/` | Parse request, call service, return JSON |
| `services/` | Business rules (appointments, records, AI, email, …) |
| `models/` | Mongoose schemas = MongoDB collections |
| `middleware/` | Auth, uploads, rate limits |
| `validators/` | Request body validation (Joi) |

### Frontend folder roles

| Folder | Purpose |
|--------|---------|
| `pages/` | Full screens (dashboard, reports, chat, …) |
| `components/` | Reusable UI (sidebar, modals, chat window) |
| `context/` | Global state (auth, socket) |
| `lib/api.js` | Fetch wrapper → `benzi-server` API |

---

## How to run

### Prerequisites

- Node.js 18+
- MongoDB (Atlas URI in `.env` or local MongoDB)
- Redis (for email queue)
- Ollama (for AI chat + RAG embeddings)

### 1. Configure environment

```bash
cd benzi-server
cp .env.example .env
# Edit .env: MONGODB_URI, JWT_SECRET, FRONTEND_URL, Ollama, Stripe, SMTP
```

### 2. Seed data (optional)

```bash
cd benzi-server
npm run seed:admin          # admin@benzi.com / admin123
npm run seed:therapists     # demo therapists
npm run seed:all            # plans + admin + therapists + demo data
```

### 3. Ollama (AI)

```bash
ollama serve
cd benzi-server
npm run ollama:pull-fast
npm run ollama:build-benzi-finetuned
npm run ollama:pull-embed   # nomic-embed-text for RAG
```

Set in `.env`:

```env
LLM_PROVIDER=ollama
OLLAMA_MODEL=benzi-finetuned
RAG_ENABLED=true
OLLAMA_EMBED_MODEL=nomic-embed-text
```

### 4. Start everything

**From repo root (API + patient app):**

```bash
npm run dev
```

**Admin app (separate terminal):**

```bash
cd benzi-admin && npm run dev
```

**API only:**

```bash
cd benzi-server && npm run dev
```

---

## Ports & URLs

| Service | URL |
|---------|-----|
| API | http://localhost:5000 |
| Patient / Therapist portal | http://localhost:5173 |
| Admin dashboard | http://localhost:5174 |

---

## Default credentials

| Role | Email | Password | Notes |
|------|-------|----------|-------|
| **Admin** | `admin@benzi.com` | `admin123` | Run `npm run seed:admin` in `benzi-server` |
| **Therapist (seed)** | `dr.fatima.seed@benzi.local` | `BenziTherapistDemo#2026` | After `npm run seed:therapists` |
| **Therapist (dev)** | `sameedjutt2345@gmail.com` | (your password) | If created manually |

Login URLs:

- Patient/Therapist: http://localhost:5173/login (choose tab)
- Admin: http://localhost:5174/login

---

## Tech stack

| Layer | Technology |
|-------|------------|
| Frontend | React 19, Vite, Tailwind CSS, React Router, Socket.IO client |
| Backend | Node.js, Express, Socket.IO |
| Database | **MongoDB** (Atlas), **Mongoose** ODM |
| Cache / queue | Redis, BullMQ |
| AI inference | **Ollama** (`benzi-finetuned` = Llama 3.2 3B + prompt) |
| AI training | Python, PyTorch, QLoRA on **Qwen2.5-3B-Instruct** |
| RAG embeddings | Ollama `nomic-embed-text` |
| Payments | Stripe |
| Email | Nodemailer + queued workers |
| Video | Jitsi / Google Meet (online appointments) |

---

## Architecture (short)

```
[Patient/Therapist React] ──HTTPS/JWT──► [Express API] ──► [MongoDB]
[Admin React]           ──HTTPS/JWT──►       │
                                             ├──► [Socket.IO] (chat)
                                             ├──► [Ollama] (AI + embeddings)
                                             ├──► [Redis/BullMQ] (email)
                                             └──► [Stripe] (subscriptions)
```

Diagrams: `docs/diagrams/` (ERD, DFD Level 1, component diagram).

---

## Database

| Item | Detail |
|------|--------|
| **Type** | MongoDB (NoSQL document database) |
| **Deployment** | MongoDB Atlas (cloud) with `ssl=true` in URI |
| **Database name** | `benzi` |
| **Connection** | `MONGODB_URI` in `benzi-server/.env` |
| **Connect code** | `benzi-server/src/config/database.js` → `connectDB()` |
| **Startup** | `benzi-server/server.js` line `await connectDB()` |
| **Schemas** | `benzi-server/src/models/` |

**Main collections (models):**

| Model | Purpose |
|-------|---------|
| `User` | Login, role (patient/therapist/admin), profile |
| `Patient` | Patient profile, `therapistLinks[]`, anonymous mode |
| `Therapist` | Therapist profile, verification, availability |
| `Appointment` | Bookings, payment, Meet links |
| `Message` | Therapist–patient chat |
| `Record` | Clinical reports / uploads |
| `RecordChunk` | RAG vector chunks |
| `AiMessage`, `AiMoodLog`, `AiGoal` | Benzi AI data |
| `TherapistSubscription` | Stripe plans |

**Why MongoDB?** Flexible documents for users, chat, appointments, AI logs, and file metadata — fast to build a multi-role FYP.

---

## Security & encryption

| Data | Protection |
|------|------------|
| **Passwords** | **bcrypt** hash (12 rounds), `select: false` on `passwordHash` |
| **2FA TOTP secrets** | **AES-256-CBC** (`twoFactorService.js`) |
| **2FA backup codes** | **bcrypt** hashed |
| **API sessions** | **JWT** signed with `JWT_SECRET` |
| **Authorization** | `verifyJWT` + `requireRoles('patient'|'therapist'|'admin')` |
| **Role source** | Loaded from **MongoDB**, not trusted from JWT alone |
| **DB connection** | **TLS/SSL** to Atlas (`ssl=true` in URI) |
| **DB at rest** | Atlas infrastructure encryption |
| **Card payments** | **Stripe** — no card numbers in our DB |
| **HTTP headers** | Helmet, CORS, rate limiting |

**Files:** `verifyJWT.js`, `authService.js`, `twoFactorService.js`, `authController.js`

---

## Reports & privacy

### Access control

- All report APIs require **JWT** + correct **role** (`record.routes.js`).
- **Patients** see only their records (`/records/patient/me`).
- **Therapists** see records only for **linked patients** (`assertTherapistLinkedToPatient`).
- Upload: patients only for themselves; therapists only for linked patients.

### Upload safety

- Allowed: PDF, Word, JPEG, PNG, WebP — max **10 MB** (`recordUpload.js`).
- Stored with **random filenames** (`crypto.randomBytes`).

### Anonymous mode (key privacy feature)

When patient enables **Anonymous Mode**:

1. Therapist sees **alias** (e.g. `Patient #A1B2`), not real name.
2. **PDF redaction** removes name, email, phone, CNIC, address (`pdfRedactionService.js`).
3. Therapist download uses **redacted PDF** only — or **blocked** until redaction completes.
4. Titles/descriptions/notes are **name-scrubbed**.
5. Appointments & chat also respect anonymous identity.

**Files:** `recordService.js`, `pdfRedactionService.js`, `PatientReportsPage.jsx`

### Known limitation (say honestly in jury)

- `/api/files` is served as static files with **unguessable random names**; production would add **signed URLs** or auth on file download.

---

## AI / Ollama

### What runs in production (`.env`)

```env
OLLAMA_MODEL=benzi-finetuned
```

| Item | Value |
|------|-------|
| **Runtime model** | `benzi-finetuned` |
| **Base** | **Llama 3.2 3B** (`llama3.2:3b`) |
| **Tuning type** | Modelfile: system prompt + temperature/top_p |
| **Patient chat temperature** | **0.55** (set in `ollamaService.js`) |
| **Modelfile default temperature** | 0.65 |
| **RAG embeddings** | `nomic-embed-text` |

### Trained model (research artifact)

| Item | Value |
|------|-------|
| **Ollama name** | `benzi-empathetic-trained` |
| **Base** | **Qwen2.5-3B-Instruct** |
| **Method** | QLoRA fine-tuning |
| **Training** | `fyp-ml-demos/finetune/` |

### Safety layers

1. System prompt — not a therapist, no diagnosis.
2. **Crisis detection** — rule-based (`crisisDetectionService.js`).
3. Therapist **email alerts** on crisis signals.
4. **RAG** scoped per `patientUserId` only.
5. Local Ollama — conversations stay on your infrastructure.

---

## Key files cheat sheet

| Topic | File |
|-------|------|
| Server start + DB connect | `benzi-server/server.js` |
| MongoDB connection | `benzi-server/src/config/database.js` |
| Env vars | `benzi-server/.env` |
| JWT auth & roles | `benzi-server/src/middleware/verifyJWT.js` |
| Login / register | `benzi-server/src/controllers/authController.js` |
| Book appointment | `benzi-server/src/services/appointmentMutationService.js` |
| Multi-therapist links | `benzi-server/src/services/patientService.js` |
| Patient model | `benzi-server/src/models/Patient.js` |
| Reports & anonymous | `benzi-server/src/services/recordService.js` |
| PDF redaction | `benzi-server/src/services/pdfRedactionService.js` |
| Report routes | `benzi-server/src/routes/record.routes.js` |
| AI chat | `benzi-server/src/controllers/aiController.js` |
| Ollama calls | `benzi-server/src/services/ollamaService.js` |
| Crisis detection | `benzi-server/src/services/crisisDetectionService.js` |
| RAG | `benzi-server/src/services/vectorRagService.js` |
| Real-time chat | `benzi-server/src/services/chatService.js` |
| Stripe | `benzi-server/src/controllers/subscriptionController.js` |
| Role routing (frontend) | `Fyp-To-Reduce-Mental-Health/src/components/RoleRoute.jsx` |
| Find doctors / book | `Fyp-To-Reduce-Mental-Health/src/pages/DoctorsPage.jsx` |
| Patient reports UI | `Fyp-To-Reduce-Mental-Health/src/pages/patient/PatientReportsPage.jsx` |

---

## Jury Q&A — project overview

### Q1. What problem does Benzi solve?

Therapy is expensive and infrequent. Patients lack support between sessions. Therapists miss early warning signs. Tools (booking, chat, records, self-help) are fragmented. Benzi unifies them in one platform with an AI companion and therapist oversight.

### Q2. What is your contribution / novelty?

Not just a chatbot — a **complete workflow**: patient portal, therapist portal, admin panel, appointments, subscriptions, secure chat, **anonymous mode**, **report redaction**, **local AI**, **crisis alerts**, and optional **RAG** over patient documents.

### Q3. Who are the users?

- **Patients** — AI chat, mood, goals, book doctors, chat therapist, upload reports.
- **Therapists** — verification, clients, availability, appointments, reports, crisis alerts, subscriptions.
- **Admins** — approve therapists, manage plans/coupons, platform analytics.

### Q4. Why three separate frontends?

Same API, different **roles and UX**. Admin tools are isolated from patient/therapist app for security and clarity.

---

## Jury Q&A — architecture & code

### Q5. Explain your architecture.

Client–server: React SPAs → Express REST API + Socket.IO → MongoDB. Background jobs (email) via Redis/BullMQ. AI via local Ollama. External: Stripe, SMTP, Google Calendar.

### Q6. Where is the database connection?

`benzi-server/.env` → `MONGODB_URI` → `src/config/database.js` → `connectDB()` called in `server.js` on startup.

### Q7. How does authentication work?

User logs in → server validates password (bcrypt) → issues **JWT** → client sends `Authorization: Bearer <token>` → `verifyJWT` middleware validates token and loads user from DB → `requireRoles()` checks role.

### Q8. Can a patient access therapist routes?

**No.** `requireRoles('therapist')` returns **403**. Role comes from MongoDB, not client-side routing alone.

### Q9. Explain route → controller → service pattern.

Example: `POST /api/appointments` → `appointmentController.patientCreateAppointment` → `appointmentMutationService.createAppointmentByPatient` → writes to `Appointment` model.

### Q10. How does real-time chat work?

Messages saved in MongoDB. **Socket.IO** emits `new_message` to connected clients. Access gated by `assertChatAllowed` (appointment or active link).

### Q11. How can a patient book multiple doctors?

`Patient.therapistLinks[]` stores many active therapist relationships. Booking calls `linkPatientToTherapist`. Availability is not restricted to one assigned doctor.

### Q12. What file would you change to add a new API?

1. `routes/*.routes.js` — define route + middleware  
2. `controllers/*.js` — handler  
3. `services/*.js` — logic  
4. `models/*.js` — schema if new data  

---

## Jury Q&A — security & privacy

### Q13. Which database do you use?

**MongoDB** on **MongoDB Atlas**, database name **`benzi`**, via **Mongoose**.

### Q14. Do you use encryption?

**Yes, in several layers:**

- Passwords: **bcrypt** (hashing)
- 2FA secrets: **AES-256-CBC**
- DB traffic: **SSL/TLS** to Atlas
- Sessions: **signed JWT**
- Reports (anonymous): **PDF redaction** + name scrubbing

We do **not** encrypt every MongoDB field at application level — Atlas handles at-rest encryption; field-level encryption would be production hardening.

### Q15. Are reports safe?

**Yes, by design:**

- JWT + role on all report APIs  
- Therapists only for **linked** patients  
- Upload type/size limits  
- Random file names on disk  
- **Anonymous mode** with automatic PDF redaction  
- Download **blocked** if redaction not ready  

### Q16. What is Anonymous Mode?

Patient toggles it in Reports. System assigns alias, redacts PII from PDFs, scrubs text fields, hides identity in therapist views. Patient keeps original; therapist gets redacted or blocked copy.

### Q17. Is `/api/files` secure?

Files use **random UUID-like names**. URLs are not listed publicly; app only exposes links to authorized users. **Improvement for production:** signed download tokens or auth middleware on file routes.

### Q18. Why JWT in localStorage?

Dev/demo simplicity. **Production:** httpOnly cookies + refresh tokens.

### Q19. How are payments secured?

**Stripe Checkout** — PCI handled by Stripe. We store subscription status, not card numbers.

---

## Jury Q&A — AI & ML

### Q20. Which AI model do you use right now?

**`benzi-finetuned`** on Ollama = **Llama 3.2 3B** + BENZI system prompt (`OLLAMA_MODEL` in `.env`).

### Q21. Did you fine-tune a model?

**Two tracks:**

1. **Running in demo:** Modelfile tuning on Llama 3.2 3B (`benzi-finetuned`).
2. **ML work:** QLoRA on **Qwen2.5-3B-Instruct** → exported as `benzi-empathetic-trained` in Ollama.

### Q22. What is the temperature?

- Patient AI chat: **0.55** (`ollamaService.js`)
- Modelfile default: **0.65**
- Structured JSON tasks: **0.35**

Lower = more consistent; we balance empathy with safety.

### Q23. What is the accuracy of your AI?

We do **not** claim classifier accuracy for open-ended chat. We evaluate **safe behavior**: defer to therapist, crisis handling, no diagnosis. Crisis uses **rule-based detection** + therapist alerts.

### Q24. What is RAG?

**Retrieval-Augmented Generation:** patient PDFs chunked → embedded (`nomic-embed-text`) → stored in MongoDB → at chat time, relevant chunks retrieved and injected into Ollama context. Scoped **per patient only**.

### Q25. Why local Ollama instead of ChatGPT?

**Privacy** — mental health data is sensitive. Local inference avoids sending full conversations to third-party APIs by default.

### Q26. What happens in a crisis?

`detectCrisis()` scans message → flags severity → AI response stays supportive → **email alert** to therapist (`crisisAlertService.js`).

---

## Jury Q&A — database

### Q27. Why MongoDB instead of SQL?

Flexible schema for chat messages, AI logs, nested `therapistLinks`, file metadata. Faster iteration for FYP. JSON-like documents match our API responses.

### Q28. Name main entities and relationships.

See ERD in `docs/diagrams/erd.mmd`:

- User 1:1 Patient / Therapist  
- Patient N:M Therapist (via `therapistLinks` + appointments)  
- Patient → Appointments, Messages, Records, AI data  
- Therapist → Services, Subscriptions  

### Q29. Where are files stored?

On disk: `benzi-server/uploads/records/` (and profiles, payments, chat, documents). MongoDB stores **metadata** (`Record` model), not file binary.

---

## Jury Q&A — features & demo

### Q30. Walk through booking an appointment.

Patient → Find Doctors → select therapist → modal loads services & slots → `POST /api/appointments` → conflict check → create PENDING appointment → link patient to therapist → emails + Meet link if online.

### Q31. How does therapist verification work?

Therapist uploads degree/CNIC → status PENDING → admin approves in admin panel → therapist can operate fully.

### Q32. How do subscriptions work?

Therapist selects plan → Stripe Checkout → webhook updates `TherapistSubscription` → plan limits enforced (e.g. client count).

### Q33. What is the admin role?

Approve therapists, manage subscription plans/coupons, view platform stats/revenue, oversight.

---

## Jury Q&A — limitations & future work

### Q34. What are the main limitations?

| Limitation | Future fix |
|------------|------------|
| JWT in localStorage | httpOnly cookies |
| Static `/api/files` | Signed download URLs |
| Rule-based crisis detection | Hybrid ML + clinical review |
| 3B local model quality | Larger model / GPU server |
| No formal clinical validation | Studies with partner therapists |
| App-level field encryption | Encrypt sensitive PHI fields |
| Mobile | iOS/Android apps |

### Q35. Is this HIPAA / clinical-grade?

**No** — it is an **FYP prototype** with industry-inspired security patterns, not certified for hospital deployment without further compliance work.

### Q36. What would you do next?

Mobile apps, clinical validation, stronger file auth, audit logs, multilingual AI, wearable data for mood insights.

---

## Demo script (5–7 min)

1. **Patient login** → dashboard → log mood  
2. **Benzi AI chat** — empathetic reply; optionally mention crisis-safe response  
3. **Find Doctors** → book appointment (show second doctor if multi-therapist)  
4. **Reports** → toggle Anonymous Mode → upload or show redaction  
5. **Messages** → therapist chat  
6. **Therapist login** → clients, confirm appointment, view patient (anonymous if enabled)  
7. **Admin login** → pending verifications or subscriptions  

**If Ollama slow:** “Local inference depends on hardware; model swappable via `OLLAMA_MODEL`.”

---

## Diagrams & presentation

| Asset | Location |
|-------|----------|
| ERD | `docs/diagrams/erd.mmd`, `erd.png` |
| DFD Level 1 | `docs/diagrams/dfd-level1.mmd`, `dfd-level1.png` |
| Component diagram | `docs/diagrams/component-diagram.mmd` |
| FYP slides | `Benzi-FYP-Final-Evaluation.pptx` |
| Rebuild slides | `cd ppt-build && node build.js` |

---

## One-page defense summary (memorize)

> Benzi is a **MongoDB-backed**, **JWT-secured**, **three-portal** mental health platform. Reports are protected by **role-based APIs**, **therapist linking**, and **anonymous PDF redaction**. Passwords are **bcrypt-hashed**, 2FA secrets **AES-encrypted**, DB uses **Atlas SSL**. AI runs **locally on Ollama** (`benzi-finetuned` / Llama 3.2 3B) with **crisis detection**, **therapist alerts**, and optional **RAG**. We built the **full integration** — not just a chatbot — with honest limits and a clear production roadmap.

---

*Last updated: June 2026 · Group F25CS186*
