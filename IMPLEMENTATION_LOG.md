# BENZI — Implementation log

Root-level running notes for what is implemented, issues hit, and how they were resolved. Update this file as you add modules or fix problems.

---

## Implemented (to date)

### Backend — `benzi-server/`

- **Stack:** Node.js (ESM), Express, MongoDB (Mongoose), JWT (`jsonwebtoken`), bcrypt, Joi validation, Helmet, CORS (single `FRONTEND_URL`), Morgan, rate limiting (general API + auth routes).
- **Standard API envelope:** `{ success, data, message, statusCode }` on success and error responses.
- **Auth routes:**
  - `GET /api/health` — liveness check.
  - `POST /api/auth/register` — roles `patient` | `therapist` only (no public admin self-registration).
  - `POST /api/auth/login` — optional `remember` (affects JWT expiry and client token storage behavior on the frontend).
  - `GET /api/auth/me` — current user from Bearer JWT.
  - `POST /api/auth/validate` — same guard as `me` (token validation).
- **User model:** email, passwordHash, role, names, phone, status, timestamps (aligned with broader BENZI context for future expansion).
- **Admin seeding:** `npm run seed:admin` — creates or updates an admin user from env (`SEED_ADMIN_EMAIL`, `SEED_ADMIN_PASSWORD`).
- **Automated API smoke test:** `npm run test:api` — spins up **MongoDB Memory Server**, runs Express in-process, and checks `POST /api/auth/register`, `POST /api/auth/login`, `GET /api/auth/me`, `GET /api/health` (no Docker required). First run may download a Mongo binary (slow); devDependency `mongodb-memory-server`.
- **Mongo connectivity diagnose:** `npm run diagnose:mongo` — uses `MONGODB_URI` from `.env` and reports success/failure (good when the UI shows 502 and you need to verify Atlas/remote reachability).

### Frontend — `Fyp-To-Reduce-Mental-Health/`

- **Vite dev proxy:** `/api` → `http://localhost:5000` so the React app can call `/api/...` without CORS issues in development.
- **API client:** `src/lib/api.js` — attaches Bearer token from `sessionStorage` / `localStorage` (`benzi_token`).
- **Auth:** `AuthContext` (session restore via `GET /api/auth/me`), `login`, `register`, `logout`.
- **Role-based routing:** `RoleRoute` wraps patient, therapist, and admin portal routes in `App.jsx`; wrong role redirects to that role’s dashboard; unauthenticated users go to `/login`.
- **Pages wired (behavior only, layout preserved):** `LoginPage`, `RegisterPage` (reads `?role=patient` | `?role=therapist`), `AuthPage` role cards point to the correct register URLs.
- **Logout:** Portal sidebars clear session and navigate to `/login`.
- **Portal headers tied to logged-in user:** Patient and therapist pages replace static “Hania” / “Faizyab” welcome lines and header chips with `useAuth()` + [`src/lib/userDisplay.js`](Fyp-To-Reduce-Mental-Health/src/lib/userDisplay.js) (`displayFirstName` / `displayFullName`). Patient profile and therapist profile cards use real name + email where applicable. Admin dashboard welcome uses seeded admin’s first name. Mock tables (appointments, clients, etc.) stay static until domain APIs exist.

### Not implemented yet (planned / deferred)

- Refresh tokens (httpOnly cookies), 2FA, email verification, forgot-password emails.
- Domain modules (appointments, goals, dashboards, Stripe, SendGrid, S3, AI) — see `BENZI_AI_Backend_Context.md`.

---

## Issues faced

| Issue | Context |
|--------|---------|
| **502 Bad Gateway** on `/api/auth/register` (and other `/api` calls) | Seen from the browser when using Vite’s dev proxy. |
| **MongoDB connection / URI shape** | Remote URI with user `root`, empty database path (`...:port/?...`), and non-default port (`5432` in the reported setup). |
| **Mongoose duplicate index warning** | `User` schema had both `unique: true` on `email` and `userSchema.index({ email: 1 }, { unique: true })`. |
| **Register 400 “email must be valid”** | Some synthetic addresses (e.g. `user@test.local`) fail Joi’s default email validation. |

---

## What was resolved

| Resolution | Detail |
|------------|--------|
| **502 → upstream / DB** | 502 from Vite means the proxy target (`localhost:5000`) was not responding — typically **API not running** or **process exiting on Mongo connect failure**. Fix: run `benzi-server` (`npm run dev` in `benzi-server/`) and ensure `MONGODB_URI` is valid so the server stays up. |
| **URI normalization** | `database.js` now inserts database name **`benzi`** when the path is empty (e.g. `...5432/?directConnection=true` → `...5432/benzi?directConnection=true`). |
| **`authSource` for `root`** | When the URI uses user `root` and does not already set `authSource`, **`authSource=admin`** is appended (common for Docker-style Mongo). Override with `MONGODB_AUTH_SOURCE` in `.env` if your host differs. |
| **Timeouts / errors** | `serverSelectionTimeoutMS` increased; clearer console message on Mongo connection failure. |
| **Seed script** | `seedAdmin.js` uses the same URI normalization and auth-source rules as the main app. |
| **Duplicate index** | Removed redundant `userSchema.index({ email: 1 })`; `unique: true` on the field is enough. |
| **Email validation** | Use a normal-looking address for registration (e.g. `name@example.com`); avoid non-ICANN TLDs like `.local` unless Joi rules are relaxed later. |

---

## Operational checklist (dev)

1. Copy `benzi-server/.env.example` → `benzi-server/.env` and set **`MONGODB_URI`**, **`JWT_SECRET`** (≥32 chars), **`FRONTEND_URL`** (e.g. `http://localhost:5173`).
2. **Recommended:** from repo root run **`npm install`** once, then **`npm run dev`** — starts **both** `benzi-server` and the Vite app. If you only run the frontend, the Vite proxy returns **502** because nothing is listening on port 5000.
3. Alternative: two terminals — `cd benzi-server && npm run dev` **first** (wait for “listening”), then `cd Fyp-To-Reduce-Mental-Health && npm run dev`.
4. Optional: `cd benzi-server && npm run seed:admin` for an admin login.

**Sanity check:** `curl -s http://localhost:5000/api/health` should return JSON with `"success":true`.

**Without a real MongoDB (CI / local quick check):** `cd benzi-server && npm run test:api` — verifies the auth stack end-to-end.

**With your real `.env` Mongo URI:** `cd benzi-server && npm run diagnose:mongo` — confirms the server can reach your database (fixes many “502 in browser” cases where the API never binds to port 5000).

---

## How to update this file

Add a dated subsection under **Implemented**, **Issues faced**, or **What was resolved** whenever you merge a feature or close an incident. Do not paste production secrets or live connection strings with passwords.

---

*Last updated: API smoke test (`test:api`), `diagnose:mongo`, duplicate index fix, registration email validation note.*
