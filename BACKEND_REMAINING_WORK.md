# 📊 BENZI Backend — Remaining Work Analysis

> **Date:** 14 May 2026
> **Analysis Basis:** `benzi-server/` source tree vs `BENZI_AI_Backend_Context.md` (1,809-line specification)
> **Total Spec Steps:** 16 implementation phases | **Completed:** ~5 fully + 3 partially
> **Backend Completion:** ~40–45% overall

---

## 📈 Executive Summary

| Category | Completion | Verdict |
|----------|-----------|---------|
| Core Infrastructure (Express, MongoDB, JWT, CORS, Helmet) | 90% | Near-complete |
| Authentication (register/login/me) | 70% | Working, missing 2FA/refresh/forgot-password |
| User & Profile Management | 60% | Basic CRUD works, no S3/cloud uploads |
| Appointment System (booking + availability) | 75% | Booking works, no Stripe payment integration |
| Therapist Services (CRUD) | 90% | Fully functional |
| Therapist Directory + Profile | 85% | Dynamic fields implemented |
| Patient Dashboard (basic) | 55% | Hardcoded/stubbed stats replaced with DB model |
| **Goal Tracking & Gamification** | **0%** | ❌ Not started |
| **Medical Records System** | **0%** | ❌ Not started |
| **Notification Service (Email/SMS)** | **0%** | ❌ Not started |
| **Subscription & Payments (Stripe)** | **0%** | ❌ Not started |
| **Admin Panel APIs** | **0%** | ❌ Not started |
| **Mood Tracking & Analytics** | **0%** | ❌ Not started |
| **Support & Contact Tickets** | **0%** | ❌ Not started |
| **AI Chat Session History (stubs)** | **0%** | ❌ Not started |
| **n8n Automation Integration** | **0%** | ❌ Not started |
| End-to-End Testing & Security Audit | 20% | Only minimal smoke test exists |

**Bottom Line:** The backend can support basic user registration, therapist directory browsing, profile editing, service management, and appointment booking. The majority of the BENZI specification — including payments, admin, notifications, goals, medical records, mood tracking, and AI stubs — has not been implemented.

---

## 1. What Is Fully Implemented ✅

### 1.1 Core Infrastructure
| File(s) | Status | Notes |
|---------|--------|-------|
| `src/app.js` | ✅ | Express app with Helmet, CORS, Morgan, JSON parser, rate limiter, static file serving, health endpoint |
| `src/config/database.js` | ✅ | MongoDB connection with URI normalization, authSource handling, timeout config |
| `src/config/environment.js` | ✅ | Env var validation |
| `src/middleware/errorHandler.js` | ✅ | Central error handler with LIMIT_FILE_SIZE support |
| `src/middleware/rateLimiters.js` | ✅ | General API + auth-specific rate limiting |
| `src/middleware/verifyJWT.js` | ✅ | JWT verification with role checks, includes `profileImageUrl` on `req.user` |
| `src/utils/responseUtils.js` | ✅ | Standard `{success, data, message, statusCode}` envelope |

### 1.2 Authentication Routes (`/api/auth`)
| Route | Status | Notes |
|-------|--------|-------|
| `POST /api/auth/register` | ✅ | Patient/therapist registration with Joi validation |
| `POST /api/auth/login` | ✅ | JWT login with `expectedPortal` role enforcement |
| `GET /api/auth/me` | ✅ | Returns current user with `profileImageUrl` |
| `POST /api/auth/validate` | ✅ | Token validation endpoint |
| `PATCH /api/auth/profile` | ✅ | Update firstName/lastName/phone |
| `POST /api/auth/change-password` | ✅ | Old + new + confirm with strong password rule |
| `POST /api/auth/profile-photo` | ✅ | Multipart upload (local disk `uploads/profiles/`) |
| `GET /api/health` | ✅ | Liveness probe |

### 1.3 Therapist Routes (`/api/therapists`)
| Route | Auth | Status | Notes |
|-------|------|--------|-------|
| `GET /directory` | Public | ✅ | City, search, pagination; merges User + Therapist data |
| `GET /profile/me` | Therapist | ✅ | User + therapist extension fields |
| `PATCH /profile/me` | Therapist | ✅ | User fields + therapist professional fields (dynamic) |
| `GET /dashboard/me` | Therapist | ✅ | KPIs, revenue buckets, packages |
| `GET /availability/me` | Therapist | ✅ | `weeklyAvailability` JSON |
| `PATCH /availability/me` | Therapist | ✅ | Joi-validated slots `{mon:[{start,end}], ...}` |
| `GET /services/me` | Therapist | ✅ | Lists therapist's Service documents |
| `POST /services` | Therapist | ✅ | Create service (price stored as PKR × 100) |
| `PATCH /services/:serviceId` | Therapist | ✅ | Update service |
| `DELETE /services/:serviceId` | Therapist | ✅ | Remove service |

### 1.4 Patient Routes (`/api/patients`)
| Route | Status | Notes |
|-------|--------|-------|
| `GET /dashboard/me` | ✅ | Returns dashboard payload (DB-backed via `PatientAiStats`) |
| `GET /linked-therapist/me` | ✅ | Returns linked therapist or `null` |

### 1.5 Appointment Routes (`/api/appointments`)
| Route | Auth | Status | Notes |
|-------|------|--------|-------|
| `POST /` | Patient | ✅ | Create booking with conflict detection + therapist assignment enforcement |
| `GET /availability/:therapistUserId` | Patient | ✅ | Returns available slots for a date |
| `GET /patient/me` | Patient | ✅ | List patient's appointments |
| `GET /therapist/me` | Therapist | ✅ | List therapist's appointments |
| `PATCH /:id` | Therapist | ✅ | Update status (CONFIRMED, CANCELLED, etc.) |

### 1.6 Models Implemented
| Model | File | Status |
|-------|------|--------|
| `User` | `models/User.js` | ✅ |
| `Patient` | `models/Patient.js` | ✅ (enhanced with `assignedTherapistUserId`) |
| `PatientAiStats` | `models/PatientAiStats.js` | ✅ (NEW — persistent analytics) |
| `Therapist` | `models/Therapist.js` | ✅ (enhanced with verification badges) |
| `Service` | `models/Service.js` | ✅ |
| `Appointment` | `models/Appointment.js` | ✅ |

### 1.7 Scripts & Utilities
| Script | Purpose | Status |
|--------|---------|--------|
| `npm run seed:admin` | Create admin user | ✅ |
| `npm run seed:therapists` | Seed demo therapists + services | ✅ |
| `npm run test:api` | In-memory API smoke test | ✅ |
| `npm run diagnose:mongo` | Mongo connectivity check | ✅ |

---

## 2. What Is Partially Implemented 🚧

### 2.1 Authentication (Missing Features)
The basic register/login flow works, but the BENZI specification calls for a full auth pipeline:

| Feature | Spec Reference | Current Status | Effort |
|---------|---------------|----------------|--------|
| **Email verification** after registration | Step 3 | ❌ Missing | 4 hrs |
| **Two-Factor Authentication (TOTP/2FA)** | Step 3 | ❌ Missing | 6 hrs |
| **Refresh tokens** (httpOnly cookies) | IMPLEMENTATION_LOG.md | ❌ Missing | 4 hrs |
| **Forgot password / password reset** | Step 3 | ❌ Missing | 3 hrs |
| **Logout token invalidation** | Step 3 | ❌ Missing | 2 hrs |

**Current Dependency Count:** No `speakeasy`, `qrcode`, or `cookie-parser` packages installed. SendGrid not configured.

### 2.2 File Storage
| Feature | Spec Reference | Current Status | Effort |
|---------|---------------|----------------|--------|
| **AWS S3 upload integration** | Step 4 | ❌ Missing — only local disk | 6 hrs |
| **Presigned download URLs** | Step 6 | ❌ Missing | 3 hrs |
| **KMS server-side encryption** | Step 6 | ❌ Missing | 4 hrs |

Current uploads go to `uploads/profiles/` on local disk. The specification requires S3 + KMS for production.

### 2.3 Appointment System — Payment Integration
| Feature | Spec Reference | Current Status | Effort |
|---------|---------------|----------------|--------|
| **Stripe PaymentIntent on booking** | Step 5 | ❌ Missing — appointments skip payment | 8 hrs |
| **Stripe webhook handler** (`/webhooks/stripe`) | Step 5 | ❌ Missing | 4 hrs |
| **Payment status per appointment** | Step 5 | ⚠️ Partial — field exists in schema, not enforced | 2 hrs |
| **Zoom meeting link generation** | Context §4.5 | ❌ Missing | 4 hrs |

Current flow: Patient books → appointment is `PENDING`. No payment required. Stripe SDK is not in `package.json`.

### 2.4 Patient Dashboard
| Feature | Spec Reference | Current Status | Effort |
|---------|---------------|----------------|--------|
| **Mood logging** (`POST /api/mood/log`) | Step 13 | ❌ Missing | 4 hrs |
| **Task score from gamification points** | Step 7 | ⚠️ Static / stub — `PatientAiStats` stores zeros | 3 hrs |
| **Progress bars from actual goal data** | Step 7 | ❌ Missing — goals module doesn't exist | 6 hrs |
| **Weekly report data from actual activity** | Step 11 | ⚠️ Stubbed — returns zero defaults | 4 hrs |

`PatientAiStats` model provides persistent storage but only contains hardcoded zero defaults. No actual scoring logic.

---

## 3. What Is Completely Missing ❌

### 3.1 Admin Panel (0% Implemented)

The entire admin module is absent. The specification requires 8–9 admin screens backed by these APIs:

| Required API | Route | Priority |
|-------------|-------|----------|
| Admin dashboard aggregated stats | `GET /api/admin/dashboard` | 🔴 Critical |
| List all doctors (paginated, searchable) | `GET /api/admin/doctors` | 🔴 Critical |
| Add doctor manually | `POST /api/admin/doctors` | 🔴 Critical |
| Update doctor details | `PATCH /api/admin/doctors/:id` | 🔴 Critical |
| Delete doctor | `DELETE /api/admin/doctors/:id` | 🔴 Critical |
| Verify therapist (approval workflow) | `PATCH /api/admin/doctors/:id/verify` | 🔴 Critical |
| List all patients (grouped by therapist) | `GET /api/admin/patients` | 🟡 High |
| Patient statistics | `GET /api/admin/patients/stats` | 🟡 High |
| Subscription plans CRUD | `POST /api/admin/subscriptions/plans` | 🟡 High |
| Subscription assignments | `GET /api/admin/subscriptions/assignments` | 🟡 High |
| Revenue data + KPIs | `GET /api/admin/revenue` | 🟡 High |
| Payments table | `GET /api/admin/payments` | 🟡 High |
| Send credentials to new doctor | `POST /api/admin/credentials/send` | 🔴 Critical |
| Credentials send log | `GET /api/admin/credentials/log` | 🟡 High |
| Admin support ticket management | `GET /api/admin/support/tickets` | 🟢 Medium |

**Missing Files:**
- `src/routes/admin.routes.js`
- `src/controllers/adminController.js`
- `src/services/adminService.js`

**Effort Estimate:** 20–24 hours

### 3.2 Goal Tracking & Gamification (0% Implemented)

The frontend has full Goal screens, but zero backend support.

| Required API | Route | Purpose |
|-------------|-------|---------|
| Get patient's goals | `GET /api/goals/:patientId` | Patient Goals page |
| Self-assign goal | `POST /api/goals/self-assign` | Patient sets own goal |
| Therapist assigns goal | `POST /api/goals/assign` | Therapist creates goal for patient |
| Update goal status/progress | `PATCH /api/goals/:goalId/status` | Slider updates |
| Complete goal | `PATCH /api/goals/:goalId/complete` | Mark done → award points |
| Get goal statistics | `GET /api/goals/stats` | Pie chart (Completed/InProgress/Pending) |
| Get community stats | `GET /api/goals/community-stats` | Sentiment counts |
| Get overdue goals (n8n) | `GET /api/internal/goals/overdue` | n8n cron job |

**Missing Files:**
- `src/models/Goal.js`
- `src/routes/goal.routes.js`
- `src/controllers/goalController.js`
- `src/services/goalService.js`

**Missing Schema:** Goals collection with:
- `patientId`, `title`, `description`, `category`, `status`, `progressPercent`, `assignedBy`, `dueDate`, `completedAt`, `pointsAwarded`

**Effort Estimate:** 12–16 hours

### 3.3 Medical Records System (0% Implemented)

Full specification requires encrypted record storage with RBAC.

| Required API | Route | Purpose |
|-------------|-------|---------|
| Upload record (encrypted to S3) | `POST /api/records` | Therapist uploads |
| List records (RBAC-filtered) | `GET /api/records` | Patient sees own; therapist sees own patients' |
| Generate presigned download URL | `GET /api/records/:id/download` | Secure 15-min expiry URL |
| Update review status | `PATCH /api/records/:id/status` | Therapist marks reviewed |
| Add therapist feedback | `POST /api/records/:id/feedback` | Notes on record |
| Patient adds feedback | `POST /api/records/:id/patient-feedback` | Patient review |

**Missing Files:**
- `src/models/Record.js`
- `src/routes/record.routes.js`
- `src/controllers/recordController.js`
- `src/services/recordService.js`
- `src/middleware/adminRecordsBlock.js`

**Missing Schema:** Records collection with:
- `patientId`, `therapistId`, `type`, `fileUri`, `fileName`, `fileChecksum`, `mimeType`, `fileSizeBytes`, `status`, `therapistFeedback`, `patientFeedback`, `isVisibleToPatient`

**Effort Estimate:** 14–18 hours (includes S3 integration work)

### 3.4 Notification Service — SendGrid + Twilio (0% Implemented)

No email or SMS dispatch exists. The specification requires:

| Template | Trigger | Use Case |
|----------|---------|----------|
| Appointment confirmation | On booking | Patient + Therapist |
| Appointment reminder | 24h before | Patient + Therapist |
| Appointment cancellation | On cancel | Patient + Therapist |
| Email verification | On register | New user |
| Password reset | On request | User |
| Goal completed | On completion | Patient |
| Session summary | After session | Patient |
| Credential dispatch | Admin sends | New therapist |
| Subscription receipt | On payment | Therapist |
| Support reply | Admin replies | User |
| Newsletter welcome | On subscribe | Public user |

**Missing Files:**
- `src/services/notificationService.js`
- `src/services/emailService.js`
- `src/services/smsService.js`
- `src/models/Notification.js`
- `src/routes/notification.routes.js`

**Missing Dependencies:**
- `@sendgrid/mail` (not in package.json)
- `twilio` (not in package.json)

**Effort Estimate:** 16–20 hours

### 3.5 Subscription & Payment Management (0% Implemented)

Stripe is not integrated. Therapist subscription screens have no API backing.

| Required API | Route | Purpose |
|-------------|-------|---------|
| Get subscription plans | `GET /api/subscriptions/plans` | Public plans listing |
| Get therapist subscription | `GET /api/subscriptions/therapist/:id` | Current plan details |
| Create Stripe customer | `POST /api/subscriptions/customer` | On therapist registration |
| Create subscription | `POST /api/subscriptions` | Stripe checkout session |
| Change subscription | `POST /api/subscriptions/change` | Upgrade/downgrade |
| Cancel subscription | `POST /api/subscriptions/cancel` | Stop billing |
| Stripe webhook handler | `POST /webhooks/stripe` | Confirm/cancel/fail payments |

**Missing Files:**
- `src/models/Subscription.js`
- `src/models/SubscriptionPlan.js`
- `src/routes/subscription.routes.js`
- `src/controllers/subscriptionController.js`
- `src/services/subscriptionService.js`
- `src/services/stripeService.js`

**Missing Dependencies:**
- `stripe` (not in package.json)

**Effort Estimate:** 14–18 hours

### 3.6 Mood Tracking & Progress Analytics (0% Implemented)

Patient mood logging and progress chart data endpoints are absent.

| Required API | Route | Purpose |
|-------------|-------|---------|
| Log daily mood | `POST /api/mood/log` | Patient Dashboard mood emoji submit |
| Get today's mood | `GET /api/mood/today` | Dashboard display |
| Get mood history | `GET /api/mood/history` | Progress page chart |
| Get progress data | `GET /api/progress/:patientId` | Patient Progress page |
| Get usage stats | `GET /api/stats/usage` | Benzi usage hours chart |

**Missing Files:**
- `src/models/MoodLog.js`
- `src/routes/mood.routes.js`
- `src/controllers/moodController.js`
- `src/services/moodService.js`
- `src/services/progressService.js`

**Effort Estimate:** 10–14 hours

### 3.7 Support & Contact System (0% Implemented)

No support ticket infrastructure exists.

| Required API | Route | Purpose |
|-------------|-------|---------|
| Create support ticket (auth) | `POST /api/support/ticket` | Patient Help & Support page |
| Create support ticket (guest) | `POST /api/contact` | Public Contact Us page |
| List user's tickets | `GET /api/support/tickets/:userId` | Ticket history |
| Admin list all tickets | `GET /api/admin/support/tickets` | Admin Customer Support page |
| Reply to ticket | `POST /api/support/tickets/:id/reply` | Support communication |

**Missing Files:**
- `src/models/SupportTicket.js`
- `src/routes/support.routes.js`
- `src/controllers/supportController.js`
- `src/services/supportService.js`

**Effort Estimate:** 6–8 hours

### 3.8 AI Chat Session History — Stubs (0% Implemented)

Specification explicitly says "implement stubs now, real AI later." No chat persistence exists.

| Required API | Route | Purpose |
|-------------|-------|---------|
| Create new chat session | `POST /api/ai/chat/session/new` | Patient Conversations — New Chat |
| Get chat history (sessions) | `GET /api/ai/chat/history/:patientId` | Left panel sessions list |
| Get messages in session | `GET /api/ai/chat/:sessionId` | Chat bubble content |
| Delete chat session | `DELETE /api/ai/chat/:sessionId` | Remove from history |
| Send message (STUB) | `POST /api/ai/chat` | Returns stub response with `isStub: true` |
| Get AI insights stub | `GET /api/goals/insights/:patientId` | Goals page AI feed |

**Missing Files:**
- `src/models/ChatSession.js`
- `src/models/ChatMessage.js`
- `src/routes/ai.routes.js`
- `src/controllers/aiController.js`
- `src/services/aiChatService.js`

**Effort Estimate:** 6–8 hours (stubs only)

### 3.9 n8n Automation Integration (0% Implemented)

Backend needs internal webhook endpoints for n8n workflows.

| Required Endpoint | Purpose |
|-------------------|---------|
| `POST /api/internal/reminders/appointment` | Dispatch appointment reminder |
| `POST /api/internal/reminders/goal` | Dispatch goal overdue reminder |
| `GET /api/internal/goals/overdue` | n8n fetches overdue goals |
| `POST /api/internal/ai/batch` | Stub for future AI batch processing |

**Missing:**
- Internal API key guard middleware
- All internal webhook routes
- n8n webhook base URL configuration

**Effort Estimate:** 4–6 hours

### 3.10 Newsletter Subscription (0% Implemented)

| Required API | Route | Purpose |
|-------------|-------|---------|
| Subscribe to newsletter | `POST /api/newsletter/subscribe` | Home page email capture |

**Effort Estimate:** 1–2 hours

---

## 4. Missing Database Models

The specification defines **14 collections**. Currently **6 are implemented**.

| Collection | Status | Required By |
|-----------|--------|-------------|
| `users` | ✅ Implemented | Auth system |
| `patients` | ✅ Implemented | Patient portal |
| `patientAiStats` | ✅ Implemented | Patient dashboard persistence |
| `therapists` | ✅ Implemented | Therapist directory + profile |
| `services` | ✅ Implemented | Therapist services |
| `appointments` | ✅ Implemented | Booking system |
| `goals` | ❌ **Missing** | Patient goals, gamification |
| `records` | ❌ **Missing** | Medical records, report downloads |
| `subscriptions` | ❌ **Missing** | Stripe billing |
| `subscriptionPlans` | ❌ **Missing** | Plan tiers (Basic/Standard/Premium) |
| `moodLogs` | ❌ **Missing** | Mood tracking (per-day emoji) |
| `notifications` | ❌ **Missing** | Delivery tracking for email/SMS |
| `supportTickets` | ❌ **Missing** | Help & support |
| `chatSessions` / `chatMessages` | ❌ **Missing** | AI conversation persistence |

---

## 5. Missing Third-Party SDKs / Dependencies

These are **not in `package.json`** but are required by the specification:

| Package | Purpose | Install Command |
|---------|---------|-----------------|
| `stripe` | Payment processing | `npm i stripe` |
| `@sendgrid/mail` | Email dispatch | `npm i @sendgrid/mail` |
| `twilio` | SMS dispatch | `npm i twilio` |
| `@aws-sdk/client-s3` | S3 file upload | `npm i @aws-sdk/client-s3` |
| `@aws-sdk/s3-request-presigner` | Presigned URLs | `npm i @aws-sdk/s3-request-presigner` |
| `speakeasy` | TOTP/2FA generation | `npm i speakeasy` |
| `qrcode` | 2FA QR code display | `npm i qrcode` |
| `cookie-parser` | httpOnly refresh token | `npm i cookie-parser` |
| `uuid` (or `crypto.randomUUID`) | File key generation | Built-in |

---

## 6. Missing Middleware

| Middleware | Purpose | Required By |
|-----------|---------|-------------|
| `adminRecordsBlock.js` | Hard 403 for admin on `/records/*` | Medical records system |
| `internalKeyGuard.js` | Validates `x-internal-key` header | n8n webhooks |
| `auditMiddleware.js` | Async write to `auditLogs` | Security compliance |

---

## 7. Remaining Work by File Count

### 7.1 Files That Exist and Work (37 files)

All `benzi-server/src/**/*.js` files currently present are functional and wired.
See the full list in `BACKEND_IMPLEMENTATION_STATUS.md` and the source tree listing above.

### 7.2 Files That Must Be Created

| File | Module | Estimated Lines |
|------|--------|-----------------|
| `src/models/Goal.js` | Gamification | ~40 |
| `src/models/Record.js` | Medical records | ~45 |
| `src/models/Subscription.js` | Payments | ~30 |
| `src/models/SubscriptionPlan.js` | Payments | ~25 |
| `src/models/MoodLog.js` | Mood tracking | ~20 |
| `src/models/Notification.js` | Notifications | ~35 |
| `src/models/SupportTicket.js` | Support | ~30 |
| `src/models/ChatSession.js` | AI stubs | ~25 |
| `src/models/ChatMessage.js` | AI stubs | ~25 |
| `src/routes/admin.routes.js` | Admin | ~100 |
| `src/routes/goal.routes.js` | Goals | ~50 |
| `src/routes/record.routes.js` | Records | ~60 |
| `src/routes/subscription.routes.js` | Subscriptions | ~60 |
| `src/routes/mood.routes.js` | Mood | ~40 |
| `src/routes/notification.routes.js` | Notifications | ~40 |
| `src/routes/support.routes.js` | Support | ~45 |
| `src/routes/ai.routes.js` | AI stubs | ~45 |
| `src/routes/internal.routes.js` | n8n webhooks | ~30 |
| `src/controllers/adminController.js` | Admin | ~250 |
| `src/controllers/goalController.js` | Goals | ~100 |
| `src/controllers/recordController.js` | Records | ~120 |
| `src/controllers/subscriptionController.js` | Payments | ~140 |
| `src/controllers/moodController.js` | Mood | ~80 |
| `src/controllers/notificationController.js` | Notifications | ~60 |
| `src/controllers/supportController.js` | Support | ~80 |
| `src/controllers/aiController.js` | AI stubs | ~60 |
| `src/controllers/internalController.js` | n8n | ~40 |
| `src/services/adminService.js` | Admin | ~300 |
| `src/services/goalService.js` | Goals | ~180 |
| `src/services/recordService.js` | Records | ~180 |
| `src/services/subscriptionService.js` | Subscriptions | ~150 |
| `src/services/stripeService.js` | Stripe | ~120 |
| `src/services/moodService.js` | Mood | ~100 |
| `src/services/progressService.js` | Progress | ~80 |
| `src/services/notificationService.js` | Notifications | ~120 |
| `src/services/emailService.js` | Email | ~80 |
| `src/services/smsService.js` | SMS | ~60 |
| `src/services/supportService.js` | Support | ~80 |
| `src/services/aiChatService.js` | AI stubs | ~60 |
| `src/middleware/adminRecordsBlock.js` | Security | ~15 |
| `src/middleware/internalKeyGuard.js` | Security | ~15 |
| `src/middleware/auditMiddleware.js` | Security | ~20 |

**Total New Files:** ~42  
**Total Estimated New Lines:** ~3,200–4,000 lines

---

## 8. Estimated Effort Summary

| Phase | Module | Hours | Priority |
|-------|--------|-------|----------|
| 1 | Admin Panel APIs | 20–24 hrs | 🔴 P0 |
| 2 | Notification Service (SendGrid + Twilio) | 16–20 hrs | 🔴 P0 |
| 3 | Subscription & Stripe Integration | 14–18 hrs | 🔴 P0 |
| 4 | Goal Tracking & Gamification | 12–16 hrs | 🟡 P1 |
| 5 | Medical Records System | 14–18 hrs | 🟡 P1 |
| 6 | Mood Tracking & Progress Analytics | 10–14 hrs | 🟡 P1 |
| 7 | Auth Enhancements (2FA, email verify, forgot pwd) | 12–16 hrs | 🟡 P1 |
| 8 | AI Chat Session History (stubs) | 6–8 hrs | 🟢 P2 |
| 9 | Support & Contact Tickets | 6–8 hrs | 🟢 P2 |
| 10 | S3 File Storage Integration | 6–8 hrs | 🟢 P2 |
| 11 | n8n Automation Endpoints | 4–6 hrs | 🟢 P2 |
| 12 | Newsletter Subscription | 1–2 hrs | 🟢 P2 |
| 13 | End-to-End Testing & Security Hardening | 16–20 hrs | 🔴 P0 |
| | **TOTAL** | **137–178 hrs** | |

> At a rate of ~6 productive coding hours per day, this represents approximately **23–30 calendar days** of focused backend development.

---

## 9. Recommended Implementation Order

### Week 1: Critical Admin + Notifications
1. **Admin Panel APIs** (`admin.routes.js`, `adminController.js`, `adminService.js`)
   - Doctor CRUD + verify workflow
   - Patient overview
   - Send credentials endpoint (uses email service)
   - Revenue aggregation queries
2. **Email Service** (`emailService.js`)
   - SendGrid integration
   - Template dispatch for credential emails

### Week 2: Payments + Subscriptions
3. **Stripe Integration** (`stripeService.js`, `subscriptionService.js`)
   - Install `stripe` package
   - Webhook handler with signature verification
   - Subscription plan seeding
   - Therapist subscription CRUD
4. **Update Appointment Booking** to require Stripe PaymentIntent
   - Flow: select slot → create PaymentIntent → pay → confirm appointment

### Week 3: Core Patient Features
5. **Goal Tracking** (`Goal.js`, `goalService.js`, `goalController.js`)
   - Self-assign, therapist assign, status update, completion
   - Gamification points system
6. **Mood Tracking** (`MoodLog.js`, `moodService.js`, `moodController.js`)
   - Daily mood log, history, chart data
7. **Progress Analytics** (`progressService.js`)
   - Aggregate goal completion percentages over time ranges

### Week 4: Records + Auth Hardening
8. **Medical Records** (`Record.js`, `recordService.js`, `recordController.js`)
   - S3 upload with encryption
   - RBAC access control
   - Presigned download URLs
9. **Auth Enhancements**
   - Email verification flow
   - 2FA setup (TOTP + QR code)
   - Forgot password / reset password
   - Refresh token rotation

### Week 5: Support + AI Stubs + Polish
10. **Support Tickets** (`SupportTicket.js`, `supportService.js`)
11. **AI Chat Stubs** (`ChatSession.js`, `ChatMessage.js`, `aiService.js`)
    - Stub responses with `isStub: true`
12. **n8n Internal Endpoints** (`internal.routes.js`, `internalKeyGuard.js`)
13. **Security Hardening**
    - NoSQL injection tests
    - JWT tamper tests
    - Rate limiter tests
    - File upload validation (MIME + size)
    - Admin records block middleware

---

## 10. Test Coverage Gaps

| Test Case | Description | Status |
|-----------|-------------|--------|
| TC-1 | Login with valid credentials + JWT issuance + role isolation | ⚠️ Partial (missing 2FA step) |
| TC-2 | New patient registration + email verification | ❌ Email verification missing |
| TC-3 | Book appointment with online Stripe payment | ❌ Stripe missing |
| TC-4 | Upload encrypted record + patient read-only + admin 403 | ❌ Records system missing |
| TC-5 | Assign goal + patient completes + points awarded | ❌ Goals system missing |
| TC-6 | Automated email + SMS notification dispatch | ❌ SendGrid/Twilio missing |
| TC-7 | Payment failure — no orphaned appointment record | ❌ Stripe missing |
| TC-8 | Admin verifies therapist + assigns subscription | ❌ Admin + subscriptions missing |
| TC-9 | AI context-aware response + guardrail | 🟡 Deferred (acceptable) |

**Only 1 of 8 required non-AI test cases is fully achievable today.**

---

## 11. Environment Variables Not Yet Used

The following env vars from `BENZI_AI_Backend_Context.md` are **not referenced in any source file**:

```bash
# Unused — required for missing features
JWT_EXPIRES_IN           # Currently hardcoded
REFRESH_TOKEN_SECRET     # Refresh tokens not implemented
REFRESH_TOKEN_EXPIRES_IN # Refresh tokens not implemented
INTERNAL_API_KEY         # n8n integration missing
AWS_REGION               # S3 not integrated
AWS_ACCESS_KEY_ID        # S3 not integrated
AWS_SECRET_ACCESS_KEY    # S3 not integrated
AWS_KMS_KEY_ID           # Encryption not integrated
S3_BUCKET_NAME           # S3 not integrated
STRIPE_SECRET_KEY        # Stripe not integrated
STRIPE_PUBLISHABLE_KEY   # Stripe not integrated
STRIPE_WEBHOOK_SECRET    # Stripe webhooks missing
SENDGRID_API_KEY         # Email not integrated
SENDGRID_FROM_EMAIL      # Email not integrated
SENDGRID_TEMPLATE_*      # No templates configured
TWILIO_ACCOUNT_SID       # SMS not integrated
TWILIO_AUTH_TOKEN        # SMS not integrated
TWILIO_PHONE_NUMBER      # SMS not integrated
N8N_WEBHOOK_BASE_URL     # n8n integration missing
N8N_*_WEBHOOK            # n8n integration missing
AI_SERVICE_URL           # AI service deferred
AI_SERVICE_KEY           # AI service deferred
```

---

## 12. Risk Assessment

| Risk | Likelihood | Impact | Mitigation |
|------|-----------|--------|------------|
| Admin panel missing blocks doctor verification | High | Critical | Implement admin APIs first |
| No Stripe = no paid appointments | High | Critical | Integrate Stripe in Week 2 |
| No email/SMS = no user communication | High | High | Set up SendGrid immediately |
| Patient dashboard is stubbed zeros | Medium | Medium | Implement goals + mood for real data |
| Medical records not encrypted | Medium | High | Delay records until S3+KMS ready |
| AI Conversations screen completely broken | Low | Low | Stubs are easy; real AI is deferred by design |

---

## 13. Quick Reference: Route Registration Status

Current `src/app.js` registers:
```javascript
app.use('/api/auth', authRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/therapists', therapistRoutes)
```

**Missing registrations needed:**
```javascript
// TODO: Add these to src/app.js
app.use('/api/admin', adminRoutes)
app.use('/api/goals', goalRoutes)
app.use('/api/records', recordRoutes)
app.use('/api/subscriptions', subscriptionRoutes)
app.use('/api/mood', moodRoutes)
app.use('/api/notifications', notificationRoutes)
app.use('/api/support', supportRoutes)
app.use('/api/ai', aiRoutes)
app.use('/api/internal', internalRoutes)     // n8n webhooks
app.use('/webhooks/stripe', stripeWebhook)   // Stripe webhooks
```

---

## 14. Conclusion

**The `benzi-server` backend has a solid foundation** — authentication, appointment booking, therapist directory/profile, and service management are all functional and connected to the frontend. However, **the majority of the BENZI specification has not yet been implemented**.

**Most Critical Gaps (blocking production):**
1. 🔴 **Admin Panel** — Doctors cannot be verified; the admin UI is entirely mocked.
2. 🔴 **Stripe Payments** — Appointments don't require payment; subscription management doesn't exist.
3. 🔴 **Notifications** — No emails or SMS are being dispatched.

**Recommended Next Sprint:**
- Build admin routes + controller + service
- Set up SendGrid with credential dispatch template
- Install Stripe and implement the subscription + payment flow

With focused effort, the remaining **~150 hours of work** can be completed in **4–5 weeks**, bringing the backend from ~40% to ~100% spec compliance (excluding the explicitly deferred AI module).

---

*Document generated by analysis of `benzi-server/src` (37 files, ~3,200 existing lines) vs `BENZI_AI_Backend_Context.md` (1809 lines, 16 implementation steps, 37 UI screens).*
