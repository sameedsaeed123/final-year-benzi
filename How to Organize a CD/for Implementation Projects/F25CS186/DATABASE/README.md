# Database — Benzi (F25CS186)

**Type:** MongoDB (NoSQL), hosted on MongoDB Atlas (cloud) — database name `benzi`.

There is no static database file on this CD because the app connects to a live Atlas
cluster via `MONGODB_URI` (set in `benzi-server/.env`, see `SOURCE/benzi-server/.env.example`).
Schemas (Mongoose models) live in `SOURCE/benzi-server/src/models/`.

## To include an actual data dump on the CD

Requires MongoDB Database Tools (`mongodump`) on the machine with real data, then from `SOURCE/benzi-server`:

```bash
npm run db:export
```

This writes a `mongodump`-format export to `benzi-server/data/benzi-dump/`. Copy that
folder into this `DATABASE/` directory before finalizing the CD.

## To restore a dump

```bash
npm run db:import
```

(reads from the same `data/benzi-dump/` path — see `src/scripts/dbImport.mjs`).

## Main collections

| Model | Purpose |
|---|---|
| User | Login, role (patient/therapist/admin), profile |
| Patient | Profile, `therapistLinks[]`, anonymous mode |
| Therapist | Profile, verification, availability |
| Appointment | Bookings, payment, Meet links |
| Message | Therapist–patient chat |
| Record | Clinical reports / uploads |
| RecordChunk | RAG vector chunks |
| AiMessage, AiMoodLog, AiGoal | Benzi AI data |
| TherapistSubscription | Stripe plans |

ERD: `SOURCE/docs/diagrams/erd.mmd` / `erd.png`.
