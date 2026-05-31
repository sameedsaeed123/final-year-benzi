# BENZI — Seed the local MongoDB database (demo data only)

> **Already have your real database?**  
> Copy it to Dell with **[COPY_DATABASE_TO_LOCAL.md](./COPY_DATABASE_TO_LOCAL.md)** (`npm run db:export` on your main PC → `npm run db:import` on Dell).  
> Do **not** run `seed:all` after a full import.

Use **this file** only when you want **fake demo** users/plans on a **fresh** empty `mongodb://127.0.0.1:27017/benzi`.

---

## Before you seed

1. **MongoDB must be running** (`mongosh` connects).
2. **`benzi-server/.env`** exists with:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/benzi
```

3. Install API dependencies:

```bash
cd benzi-server
npm install
```

---

## Quick: seed everything (recommended)

From `benzi-server/`:

```bash
npm run seed:all
```

This runs, in order:

| Step | Script | What it creates |
|------|--------|-----------------|
| 1 | `seed:plans` | 3 subscription plans (Try free, BENZI Pro, Plus) |
| 2 | `seed:admin` | Admin user for admin panel |
| 3 | `seed:therapists` | 6 verified therapists + services (Doctors page) |
| 4 | `seed:demo` | 6 patients (linked to therapists) + 3 support tickets |

---

## Run scripts one by one (same result)

```bash
cd benzi-server

npm run seed:plans
npm run seed:admin
npm run seed:therapists
npm run seed:demo
```

Optional — only if you use Stripe test keys in `.env`:

```bash
npm run stripe:sync-plans
```

---

## What gets stored in MongoDB

### Collections filled by seeds

| Collection | Scripts | Contents |
|------------|---------|----------|
| `users` | admin, therapists, demo | Admin + therapist + patient accounts |
| `therapists` | therapists, demo | Profiles, ratings, onboarding |
| `services` | therapists, demo | Session types & prices per therapist |
| `patients` | demo | Patient profiles linked to a therapist |
| `tickets` | demo | Support tickets for admin panel |
| `subscriptionplans` | plans | Plan limits, prices, features |

Other collections (`appointments`, `chats`, `aigoals`, etc.) stay **empty** until you use the app or add more seeds.

---

## Default login credentials

### Admin (admin panel — http://localhost:5174)

Set in `.env` or use defaults:

| Field | Default |
|-------|---------|
| Email | `admin@benzi.local` |
| Password | `ChangeMe!Admin1` |

Override before seeding:

```env
SEED_ADMIN_EMAIL=admin@benzi.local
SEED_ADMIN_PASSWORD=ChangeMe!Admin1
```

### Therapists (website — http://localhost:5173 → Login → Therapist)

After `npm run seed:therapists`, open:

**`benzi-server/THERAPIST_SEED_CREDENTIALS.md`**

(Generated on each `seed:therapists` run.)

| Email | Password (all therapists) |
|-------|---------------------------|
| `dr.fatima.seed@benzi.local` | `BenziTherapistDemo#2026` |
| `dr.shayan.seed@benzi.local` | same |
| `dr.alina.seed@benzi.local` | same |
| `dr.faizan.seed@benzi.local` | same |
| `dr.saba.seed@benzi.local` | same |
| `dr.rahima.seed@benzi.local` | same |

### Patients (website — Login → Patient)

After `npm run seed:demo`:

| Email | Password (all patients) |
|-------|-------------------------|
| `sara.patel@benzi.local` | `BenziDemoPassword#2026` |
| `ali.khan@benzi.local` | same |
| `mary.lopez@benzi.local` | same |
| `john.davis@benzi.local` | same |
| `zainab.ali@benzi.local` | same |
| `ahmed.riaz@benzi.local` | same |

Some patients are marked **inactive** (old `lastLoginAt`) for admin dashboard stats.

---

## Subscription plans (after `seed:plans`)

| Slug | Name | Monthly | Yearly |
|------|------|---------|--------|
| `try-free` | Try for Free | $0 | $0 |
| `benzi-pro` | BENZI Pro | $20 | $200 |
| `plus` | Plus | $60 | $550 |

Therapists created via seed are **not** auto-subscribed to paid plans unless you assign them in admin or they checkout. New therapist registrations get the default free plan from app logic.

---

## Support tickets (after `seed:demo`)

| Ticket ID | Subject | Status |
|-----------|---------|--------|
| TKT-1042 | Unable to book session | Pending |
| TKT-1041 | Refund request | Pending |
| TKT-1040 | Change subscription plan | Completed |

Visible in **Admin → Customer Support**.

---

## Reset demo users and re-seed

Removes **all users except admin**, therapists, patients, services, and tickets — then run `seed:all` again.

```bash
cd benzi-server
npm run db:clean
npm run seed:all
```

Does **not** delete:

- Admin user(s)
- Subscription plans (run `seed:plans` again to refresh plans)

To wipe the **entire** database including admin and plans, use MongoDB Compass or:

```bash
mongosh
use benzi
db.dropDatabase()
exit
```

Then:

```bash
npm run seed:all
```

---

## Copy database from another machine (optional)

If your **original PC** already has the full database and you want the **exact same data** on Dell (not just demo seeds):

### On the old machine (export)

```bash
mongodump --uri="mongodb://127.0.0.1:27017/benzi" --out=./benzi-dump
```

Zip the `benzi-dump` folder and copy to Dell.

### On Dell (import)

```bash
mongorestore --uri="mongodb://127.0.0.1:27017/benzi" --drop ./benzi-dump
```

`--drop` replaces existing collections. Use the same `MONGODB_URI` in `.env`.

**Note:** Password hashes and secrets copy as-is; login with the **same passwords** as on the old machine.

---

## Verify seeding worked

```bash
mongosh mongodb://127.0.0.1:27017/benzi
```

```javascript
db.users.countDocuments()
db.users.countDocuments({ role: 'therapist' })
db.users.countDocuments({ role: 'patient' })
db.subscriptionplans.countDocuments()
db.tickets.countDocuments()
```

Expected roughly:

- 1 admin
- 6 therapists (if you ran `seed:therapists`)
- 6 patients (if you ran `seed:demo`)
- 3 plans
- 3 tickets

Start the app:

```bash
# from repo root
npm run dev
```

- Doctors: http://localhost:5173/doctors  
- Admin: http://localhost:5174  
- API health: http://localhost:5000/api/ai/health  

---

## Script reference

| npm script | File | Purpose |
|------------|------|---------|
| `seed:all` | (runs below in order) | One command full demo DB |
| `seed:plans` | `seedSubscriptionPlans.js` | Subscription tiers |
| `seed:admin` | `seedAdmin.js` | Admin account |
| `seed:therapists` | `seedTherapists.js` | 6 doctors + services + credentials file |
| `seed:demo` | `seedFullData.js` | Patients + tickets (+ 3 therapists upsert) |
| `stripe:sync-plans` | `syncStripePlans.mjs` | Stripe products (needs API keys) |
| `db:clean` | `clearDemoUsers.js` | Remove non-admin users & related data |

---

## Troubleshooting

| Issue | Fix |
|-------|-----|
| `MONGODB_URI is required` | Create `benzi-server/.env` from `.env.example` |
| `ECONNREFUSED` Mongo | Start MongoDB service |
| Admin login fails | `npm run seed:admin` again; check email/password table above |
| No doctors on website | `npm run seed:therapists` |
| Admin support empty | `npm run seed:demo` |
| Duplicate key errors | Run `npm run db:clean` then `seed:all` |
| Plans missing on site | `npm run seed:plans` |

---

## Related

- [DELL_MACHINE_SETUP.md](../../DELL_MACHINE_SETUP.md) — full Dell install  
- [STRIPE_SETUP.md](./STRIPE_SETUP.md) — payments after plans are seeded  
