# Therapist seed credentials (example)

This repository **does not** commit real seed passwords. After you run the seed script, the file `THERAPIST_SEED_CREDENTIALS.md` is **generated** next to `benzi-server/package.json` (ignored by git).

## Generate real credentials

```bash
cd benzi-server
npm run seed:therapists
```

Then open **`benzi-server/THERAPIST_SEED_CREDENTIALS.md`** — it lists every seeded email, city, display name, and the **shared demo password** used for all accounts.

## Login

Use the **Therapist** tab on the web login page so `expectedPortal` is `therapist`.

## Default password (before you run seed)

The script defines a constant such as `BenziTherapistDemo#2026` (see `src/scripts/seedTherapists.js`). Running the seed overwrites user password hashes to match that value.
