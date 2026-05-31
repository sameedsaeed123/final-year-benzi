# Copy your **current** BENZI database to local MongoDB (Dell)

Use this when you already have real data (users, therapists, appointments, chats, subscriptions, etc.) on your **main PC** or **MongoDB Atlas**, and you want the **same database** on the Dell machine at:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/benzi
```

You do **not** need `npm run seed:all` if you restore a full copy — logins and records stay exactly as they are.

For a **blank** laptop with demo data only, use [SEED_DATABASE.md](./SEED_DATABASE.md) instead.

---

## What gets copied

Everything in the `benzi` database, for example:

| Collection | Typical contents |
|------------|------------------|
| `users` | Admin, therapists, patients (password hashes included) |
| `therapists` / `patients` | Profiles |
| `services` | Therapist session types & prices |
| `appointments` | Bookings |
| `messages` | Chat messages |
| `subscriptionplans` / `therapistsubscriptions` / `coupons` | Plans & billing |
| `tickets` | Support tickets |
| `aigoals`, `aimessages`, `aimoodlogs`, … | AI / progress data |
| `records` | Uploaded report metadata |
| … | Any other collections in your DB |

---

## Prerequisites

### On both machines

- **MongoDB Database Tools** (`mongodump`, `mongorestore`) on PATH  
  Download: https://www.mongodb.com/try/download/database-tools  
  (Often installed with MongoDB Compass / Community on Windows.)

### On Dell only

- **MongoDB Community** running locally (`mongosh` works).
- `benzi-server/.env` with local URI:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/benzi
```

---

## Method 1 — npm scripts (recommended)

### Step 1 — Export on your **current** machine

On the PC where your **live** data is (Atlas or local):

1. Open `benzi-server/.env`.
2. Set `MONGODB_URI` to your **current** database (the one the app uses today), e.g.:

```env
# Example: Atlas
MONGODB_URI=mongodb+srv://USER:PASS@cluster0.xxxxx.mongodb.net/benzi?retryWrites=true&w=majority

# Example: local on Mac
# MONGODB_URI=mongodb://127.0.0.1:27017/benzi
```

Optional — export from a different URI without changing `.env`:

```env
SOURCE_MONGODB_URI=mongodb+srv://...
```

3. Export:

```bash
cd benzi-server
npm run db:export
```

Creates: **`benzi-server/data/benzi-dump/`** (folder `benzi/` with `.bson` files inside).

4. Zip and copy to Dell:

```bash
# macOS / Linux (from benzi-server/)
zip -r benzi-dump.zip data/benzi-dump
```

Copy `benzi-dump.zip` via USB, OneDrive, etc.

---

### Step 2 — Import on **Dell**

1. Install & start **local MongoDB** (see [DELL_MACHINE_SETUP.md](../../DELL_MACHINE_SETUP.md) §4).
2. Unzip into the project:

```text
benzi-server/data/benzi-dump/benzi/*.bson
```

3. Set Dell `.env` to **local** only:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/benzi
```

4. Import (replaces local `benzi` collections):

```bash
cd benzi-server
npm run db:import
```

5. Start the app from repo root:

```bash
npm run dev
```

6. Log in with the **same email/password** you use on the source machine (admin, therapist, patient).

---

## Method 2 — Manual `mongodump` / `mongorestore`

### Export (source machine)

Replace the URI with yours:

```bash
mongodump --uri="YOUR_CURRENT_MONGODB_URI" --out=./benzi-dump
```

### Import (Dell)

```bash
mongorestore --uri="mongodb://127.0.0.1:27017/benzi" --drop ./benzi-dump
```

---

## Method 3 — MongoDB Compass

1. On source machine: Compass → connect to current DB → **Export** collections or use **mongodump** from Compass menu if available.
2. On Dell: connect to `mongodb://127.0.0.1:27017` → database `benzi` → **Import** each collection.

Compass is fine for small fixes; for a full clone, Method 1 is faster.

---

## Method 4 — Atlas only (no export PC)

If data lives only in Atlas and Dell has internet:

**Option A — Dell points at Atlas** (no copy): set Dell `MONGODB_URI` to the same Atlas string. No local Mongo needed; requires network + Atlas IP allowlist.

**Option B — Clone Atlas → local Dell** (offline-friendly):

1. On any machine with Atlas access: `npm run db:export` with Atlas in `.env`.
2. Copy `data/benzi-dump` to Dell → `npm run db:import` with local URI.

---

## After import — checklist

| Check | How |
|-------|-----|
| Mongo has data | `mongosh mongodb://127.0.0.1:27017/benzi --eval "db.users.countDocuments()"` |
| API connects | `cd benzi-server && npm run diagnose:mongo` |
| Admin panel | http://localhost:5174 — your real admin login |
| Website | http://localhost:5173 — real therapists/patients |
| Stripe (optional) | Same `STRIPE_*` keys in `.env` if you test payments locally |

### Do **not** run on Dell after a full import

- `npm run seed:all` — would add/overwrite demo users and duplicate data.
- `npm run db:clean` — deletes non-admin users.

### Safe to run only if something is missing

- `npm run seed:plans` — only if subscription plans collection is empty (upserts plans).

---

## Environment variables

| Variable | Used by | Purpose |
|----------|---------|---------|
| `MONGODB_URI` | export (default source), import (target) | Main connection string |
| `SOURCE_MONGODB_URI` | `db:export` | Export from another URI without changing target |
| `DB_DUMP_DIR` | export/import | Default `./data/benzi-dump` |

Add to `.gitignore` (already): `benzi-server/data/` — never commit dumps (passwords inside).

---

## Troubleshooting

| Problem | Fix |
|---------|-----|
| `mongodump not found` | Install [Database Tools](https://www.mongodb.com/try/download/database-tools) |
| Atlas export fails / timeout | Atlas → Network Access → add your IP; check user has read on `benzi` |
| `authentication failed` | Add `?authSource=admin` or set `MONGODB_AUTH_SOURCE=admin` in `.env` |
| Import empty on Dell | Unzip so path is `data/benzi-dump/benzi/*.bson`, not nested twice |
| Wrong passwords after import | You imported a different dump; or you ran `seed:*` after import |
| Dell still hits Atlas | Change `MONGODB_URI` to `mongodb://127.0.0.1:27017/benzi` and restart API |

---

## Related

- [SEED_DATABASE.md](./SEED_DATABASE.md) — demo data when you have **no** existing DB  
- [DELL_MACHINE_SETUP.md](../../DELL_MACHINE_SETUP.md) — full Dell install  
