# Stripe setup for BENZI therapist subscriptions

## 1. Environment variables (`benzi-server/.env`)

```env
STRIPE_SECRET_KEY=sk_test_...
STRIPE_PUBLISHABLE_KEY=pk_test_...
STRIPE_WEBHOOK_SECRET=whsec_...
FRONTEND_URL=http://localhost:5173

**Important:** Use the exact URL you open in the browser (with port `5173`).  
Do **not** set `FRONTEND_URL=https://benzi.mentalhealth` for local dev — Stripe will redirect there without port 5173 and the success page will 404.
```

## 2. Seed plans + sync Stripe Products/Prices

```bash
cd benzi-server
npm run seed:plans
npm run stripe:sync-plans
```

This stores `stripePriceIdMonthly` / `stripePriceIdYearly` on each paid plan.

## 3. Webhook

**Endpoint (must be raw body — already configured in `app.js`):**

```
POST https://YOUR_API_HOST/api/subscriptions/webhook
```

**Local development:**

```bash
stripe listen --forward-to localhost:5000/api/subscriptions/webhook
```

Copy the signing secret into `STRIPE_WEBHOOK_SECRET`.

**Subscribe to events:**

- `checkout.session.completed`
- `customer.subscription.updated`
- `customer.subscription.deleted`
- `invoice.paid`
- `invoice.payment_failed`

Events are processed **once** (idempotency via `StripeWebhookEvent` collection).

## 4. Checkout flow

1. Therapist opens `/therapist-checkout`
2. `POST /api/subscriptions/checkout` → Stripe Checkout URL
3. After payment → redirect to `/therapist-checkout/success?session_id=...`
4. Frontend calls `GET /api/subscriptions/checkout-session/:sessionId` to confirm + apply plan
5. Webhook also applies plan (redundant safety)

**Without Stripe keys:** dev mode activates plan on success page via `confirm-dev` or `dev_` session id.

## 5. Coupons

Admin → **Coupons** creates a code and syncs to Stripe Promotion Code when `STRIPE_SECRET_KEY` is set. Checkout applies it via `discounts`.

## 6. Package limits (enforced)

| Limit | Enforced on |
|-------|-------------|
| `maxPatients` | Invite patient, link patient on booking |
| `aiMessageLimitMonthly` | Patient BENZI AI chat |
| `aiRecommendationLimitMonthly` | Goal AI suggestions (therapist + patient preview) |
| `aiContextMultiplier` | PDF/chat context depth in AI |

Therapists without a subscription get **Try for Free** automatically on profile creation.

Usage: `GET /api/subscriptions/me` returns `usage` + `remaining`.
