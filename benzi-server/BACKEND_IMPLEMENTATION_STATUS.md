# Benzi backend — implementation status

Single source of truth for **what the API already does** vs **planned work**. Update this file when you add routes or change behaviour.

Last reviewed: 2026-05-12.

---

## Core infrastructure

| Feature | Status | Notes |
|--------|--------|--------|
| Express app + CORS + Helmet + rate limit | Done | `src/app.js` |
| MongoDB connection | Done | `src/config/database.js` |
| JWT auth middleware | Done | `src/middleware/verifyJWT.js` — includes `profileImageUrl` on `req.user` |
| Central error handler | Done | `src/middleware/errorHandler.js` — includes `LIMIT_FILE_SIZE` |
| Static uploaded files | Done | `GET /api/files/*` → `uploads/` (profile photos) |
| Health | Done | `GET /api/health` |

---

## Auth (`/api/auth`)

| Route | Method | Status | Notes |
|-------|--------|--------|--------|
| `/register` | POST | Done | Patient/therapist; Joi email allows `.local` TLD |
| `/login` | POST | Done | Requires `expectedPortal` |
| `/me` | GET | Done | Returns full public user including `profileImageUrl` |
| `/profile` | PATCH | Done | `firstName`, `lastName`, `phone` (any logged-in role) |
| `/change-password` | POST | Done | Old + new + confirm; strong password rule |
| `/profile-photo` | POST | Done | Multipart field `photo`; updates `User.profileImageUrl` |
| `/validate` | POST | Done | Token check |

---

## Therapists (`/api/therapists`)

| Route | Method | Auth | Status | Notes |
|-------|--------|------|--------|--------|
| `/directory` | GET | Public | Done | City, search, pagination; merges `User.profileImageUrl` + therapist image |
| `/profile/me` | GET | Therapist | Done | User + therapist extension |
| `/profile/me` | PATCH | Therapist | Done | User fields + therapist professional fields |
| `/dashboard/me` | GET | Therapist | Done | KPIs, revenue buckets, packages |
| `/availability/me` | GET | Therapist | Done | `weeklyAvailability` JSON |
| `/availability/me` | PATCH | Therapist | Done | Joi slots `{ mon: [{start,end}], ... }` |
| `/services/me` | GET | Therapist | Done | Lists `Service` documents |
| `/services` | POST | Therapist | Done | Create service (price stored as PKR × 100) |
| `/services/:serviceId` | PATCH | Therapist | Done | Update service |
| `/services/:serviceId` | DELETE | Therapist | Done | Remove service |

---

## Patients (`/api/patients`)

| Route | Method | Status | Notes |
|-------|--------|--------|--------|
| `/dashboard/me` | GET | Done | Patient dashboard payload |

---

## Appointments (`/api/appointments`)

| Route | Method | Auth | Status | Notes |
|-------|--------|------|--------|--------|
| `/` | POST | Patient | Done | Create booking (`therapistUserId`, optional `serviceId`, `date`, `durationMinutes`, `location`) |
| `/patient/me` | GET | Patient | Done | List for patient |
| `/therapist/me` | GET | Therapist | Done | List for therapist |
| `/:id` | PATCH | Therapist | Done | Update `status` (e.g. CONFIRMED, CANCELLED) |

---

## Models (summary)

- **User** — `profileImageUrl` for uploaded / account avatar.
- **Therapist** — directory + professional fields + `weeklyAvailability` (Mixed).
- **Service** — therapist offerings; `pricePerSession` in minor PKR units (÷100 for display).
- **Appointment** — patient/therapist/service/time/status.

---

## Seed & ops scripts

| Script | Purpose |
|--------|---------|
| `npm run seed:admin` | Admin user |
| `npm run seed:therapists` | Demo therapists + services; writes `THERAPIST_SEED_CREDENTIALS.md` (gitignored) |
| `npm run test:api` | In-memory smoke (register, login, health, directory) |

---

## Remaining / follow-up (not done here)

- Patient UI to **create** appointments from doctor cards (API exists).
- Therapist UI to **edit weekly availability** (API exists).
- **Email** verification / password reset flows.
- **S3** (or similar) for uploads in production instead of local disk.
- **Admin** CRUD over users/services (still mostly static UI).
- Automated integration tests beyond smoke.

---

## Dependency summary

**Runtime:** `express`, `mongoose`, `jsonwebtoken`, `bcryptjs`, `joi`, `helmet`, `cors`, `express-rate-limit`, `morgan`, `dotenv`, **`multer`**.

**Frontend** calls these routes via `VITE_API_URL` or Vite proxy to `benzi-server` (`/api`).
