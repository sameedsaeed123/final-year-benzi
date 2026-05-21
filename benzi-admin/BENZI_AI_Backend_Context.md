# BENZI.AI — Complete Backend Implementation Context

> **Project**: Intelligent Secure Meditation Counselor-Patient Care System with AI Virtual Assistant  
> **Document Purpose**: Full backend implementation guide derived from DTS Phase 3 UI analysis.  
> **Team**: F25CS186 — Faizyab Ahmad (UI/UX/Frontend), Sameed Saeed (Backend/AI), Hassan Hayat (Testing)  
> **Stack**: React.js | Node.js + Express.js | MongoDB | Python FastAPI (AI) | n8n | Stripe | Twilio | SendGrid

---

## TABLE OF CONTENTS

1. [Project Overview & Current Status](#1-project-overview--current-status)
2. [Technology Stack](#2-technology-stack)
3. [UI Screen Inventory — What Exists vs What Needs Backend](#3-ui-screen-inventory)
4. [Database Schema Design](#4-database-schema-design)
5. [Authentication & RBAC Architecture](#5-authentication--rbac-architecture)
6. [API Endpoint Specification (All Routes)](#6-api-endpoint-specification)
7. [Service Layer Design](#7-service-layer-design)
8. [Security Implementation Guide](#8-security-implementation-guide)
9. [Third-Party Integration Details](#9-third-party-integration-details)
10. [AI Module — Leave for Later (Embedding Phase)](#10-ai-module--leave-for-later)
11. [n8n Automation Workflows](#11-n8n-automation-workflows)
12. [Step-by-Step Implementation Plan](#12-step-by-step-implementation-plan)
13. [Environment Variables & Secrets](#13-environment-variables--secrets)
14. [Error Handling Standards](#14-error-handling-standards)
15. [Testing Checklist](#15-testing-checklist)

---

## 1. Project Overview & Current Status

### What BENZI.AI Is
A secure, role-based mental health therapy platform with three portals:
- **Patient Portal** — book appointments, chat with AI assistant, track goals and mood, view reports
- **Therapist Portal** — manage clients, appointments, services, revenue
- **Admin Panel** — manage doctors, subscriptions, revenue, send credentials

### Current Implementation Status (from Phase 3 document)

| Module | Status |
|---|---|
| React.js Frontend (all 3 portals) | ✅ Complete |
| Database Schema (MongoDB) | ✅ Complete |
| User Authentication & RBAC (JWT, 2FA) | ✅ Complete |
| Appointment Service (REST API) | ✅ Complete |
| Medical Records Service | ✅ Complete |
| Notification Service (Twilio + SendGrid) | ✅ Complete |
| Payment Processing (Stripe) | ✅ Complete |
| n8n Automation Workflows | ✅ Complete |
| Goal Tracking Module | ✅ Complete |
| Video Session Integration (Zoom/Google Meet) | ❌ Not Implemented |
| AI Virtual Assistant (Python/FastAPI) | ❌ Not Implemented |
| RAG Pipeline & Context Loader | ❌ Not Implemented |
| LLM Integration & Guardrails | ❌ Not Implemented |
| End-to-End Encryption Testing | ❌ Not Implemented |

### What This Document Covers
This document is the complete guide to implementing the **backend**. The AI Virtual Assistant (Conversations screen) is explicitly marked as the **AI embedding phase** and is isolated in Section 10. Everything else is fully specifiable and should be implemented first.

---

## 2. Technology Stack

```
Layer               Technology
─────────────────────────────────────────────────────
Presentation        React.js (already built)
Backend API         Node.js v20+ + Express.js v4
Database            MongoDB Atlas (cloud) with Field-Level Encryption
Auth                JWT (jsonwebtoken) + bcrypt + speakeasy (2FA/TOTP)
File Storage        AWS S3 (or Azure Blob Storage)
Encryption at Rest  AES-256 via MongoDB FLE + AWS KMS
Transport           TLS 1.2+ (HTTPS enforced everywhere)
Payments            Stripe API v2024
SMS                 Twilio REST API
Email               SendGrid API v3
Video               Zoom Server-to-Server OAuth SDK (deferred)
Automation          n8n (self-hosted)
AI Engine           Python 3.11 + FastAPI (deferred — Section 10)
Container           Docker + Docker Compose
Version Control     Git / GitHub
Cloud               AWS (preferred) / Azure / GCP
```

---

## 3. UI Screen Inventory

This section maps every screen seen in the Phase 3 prototype to its backend dependency, and flags which screens need backend implementation vs which are static/AI-deferred.

### 3.1 PUBLIC / GUEST SCREENS (No Auth Required)

| # | Screen | What It Shows | Backend Needed? |
|---|---|---|---|
| 1 | **Home Page** | Hero, Care Offerings (NLP, Emotion Recognition, Personalized Recommendations, Risk Assessment, 24/7 Availability, Continuous Learning), Subscription plan tiers, CTA buttons, newsletter subscribe | ⚠️ Only `POST /newsletter/subscribe` via SendGrid. Everything else is static React content. |
| 2 | **Auth — Role Selection** | Two cards: "Register As Therapist" / "Register As User", each with Register Now + Login buttons | ❌ Static routing only |
| 3 | **Login** | Email, Password, Remember Me checkbox, Forgot Password link | ✅ `POST /api/auth/login` with 2FA |
| 4 | **Register** | First Name, Last Name, Email, Phone, Password, Confirm Password, terms checkbox | ✅ `POST /api/auth/register` |
| 5 | **Subscription (Public)** | 3 plan cards (Basic $100 / Standard $200 / Premium $300), Monthly/Annual billing toggle, Get Started buttons | ✅ `GET /api/subscriptions/plans` + Stripe redirect |
| 22 | **Meditation Counselor** | AI approach explanation, How it Works 6-step, feature highlights | ❌ Static |
| 23 | **Resources** | Mental health resource articles library | ❌ Static / CMS |
| 24 | **About Us** | Team info, mission statement | ❌ Static |
| 25 | **About BENZI.AI** | Product overview | ❌ Static |
| 26 | **FAQs** | Expandable question list | ❌ Static |
| 27 | **Contact Us** | Full name, email, message text → support ticket | ✅ `POST /api/contact` via SendGrid |

### 3.2 PATIENT PORTAL SCREENS (JWT Required, Role: Patient)

Right-side navigation: Dashboard → Conversations → Goals → Progress → Appointment → Help & Support → Reports → Profile → Logout

| # | Screen | What the UI Shows (Visual Analysis) | Backend APIs Needed |
|---|---|---|---|
| 5 | **Patient Dashboard** | Welcome [Name], Task score counter (circular gauge showing "19"), Mood tracker (Happy/Good/Normal/Bad/Awful emoji buttons + Submit), Current Progress rings (Mental Health / Self Care / Therapy), Weekly Task Progress bar chart (Mon–Sun), Overall Report annual line chart (Weekly/Monthly/Yearly, 7 days/30 days/12 months) | `POST /api/mood/log`, `GET /api/mood/today`, `GET /api/dashboard/patient/:id` (returns task score, progress rings data, weekly chart data, overall report data) |
| 6 | **Conversations (AI Chat)** | Left panel: New Chat, Search, Images, chat history grouped Today/Yesterday/Previous. Center: chat bubbles (You right teal, Benzi left cream). Bottom: text input "+ Ask anything", mic button, send button | ⚠️ **AI DEFERRED — Section 10**. Implement chat history persistence: `GET /api/ai/history/:patientId`, `DELETE /api/ai/chat/:chatId` |
| 7 | **Patient Goals** | "Set Your Goal" section with preset tiles (Enhance Sleep Quality / Improve Stress Management / Improve Communication Skills), Current Status sliders (0–100) per goal, custom goal text input + Submit. Below: Community Reviews sentiment (Negative 16 / Neutral 45 / Positive 2,113), Goals pie chart (Completed 70% / In Progress 20% / Pending 10%), AI Insights & Recommendations feed | `GET /api/goals/:patientId`, `POST /api/goals/self-assign` (patient-initiated), `PATCH /api/goals/status`, `PATCH /api/goals/complete`, `GET /api/goals/community-stats` |
| 8 | **Patient Progress** | Date range filter, Monthly/Annual toggle, Individual goal bars (Stress / Anxiety / Depression / Improve Sleep at various percentages), Overall Goal Progress area chart (Jan–May), Benzi Usage hours bar chart, Chatbot Usage weekly bar chart, Overall Report line chart | `GET /api/progress/:patientId?range=30d&type=monthly` |
| 9 | **Patient Appointments** | "+" button, keyword search, appointments table (ID, Therapist, Date & Time, Duration, Location, Status: Pending/Completed), Video Call link generation panel, Clinic/Hospital address panel, pagination | `GET /api/appointments/patient/:id`, `POST /api/appointments/book`, `GET /api/appointments/availability/:therapistId`, `DELETE /api/appointments/:id` |
| 10 | **Patient Reports** | Patient Report count badge, keyword search, table (Report ID, Therapist, Date & Time, PDF File, Location, Status: Reviewed/Not review/Half review), Download action, Feedback action, Task generation section, Notes/Guidance generation section | `GET /api/reports/patient/:id`, `GET /api/reports/:reportId/download`, `POST /api/reports/:reportId/feedback` |
| 11 | **Patient Profile** | Profile photo upload, Full Name, Email, Password change (old/new/confirm) | `GET /api/users/profile`, `PATCH /api/users/profile`, `PATCH /api/users/password`, `POST /api/users/avatar` |
| 12 | **Patient Help & Support** | Support query text input, topic selection, support ticket submission | `POST /api/support/ticket`, `GET /api/support/tickets/:userId` |

### 3.3 THERAPIST PORTAL SCREENS (JWT Required, Role: Therapist)

Right-side navigation: Dashboard → Appointment → Clients → Services → Subscription → Payment → Profile → About Benzi → Logout

| # | Screen | What the UI Shows (Visual Analysis) | Backend APIs Needed |
|---|---|---|---|
| 14 | **Therapist Dashboard** | Welcome [Name], KPI cards (Active Services 12 +4.2%, New Services 02 −1.2%, Avg Reviews 20 +3.4%, Avg Reply Time 15 min +3.4%), Today's Appointments card with patient name + session topic, Monthly calendar view with highlighted dates, Most Bought Package donut charts (Stress Management 60%, Career Counseling 75%, Couples Counseling), Generated Revenue horizontal bar chart (Aug $1000 / Sep $700 / Oct $800) | `GET /api/dashboard/therapist/:id` (returns all KPIs, today's appointments, calendar events, package stats, revenue by month) |
| 15 | **Therapist Appointments** | Keyword search, "+ Calendar" button, appointments table (Appointment ID, Patient, Date & Time, Duration, Location, Status: Confirmed/Pending/Cancelled), paginated list, per-row action icons | `GET /api/appointments/therapist/:id`, `PATCH /api/appointments/:id/status`, `DELETE /api/appointments/:id` |
| 16 | **Therapist Clients** | "+ New Client" button, keyword search, clients table (Patient name, Date & Time, Duration, Location, Status), per-row messaging + action icons | `GET /api/clients/therapist/:id`, `POST /api/clients/add`, `GET /api/clients/:patientId/profile` |
| 17 | **Therapist Services** | "+ New Service" button, service cards displaying: name, type, price per 60-min session, description (Mindful Counseling $100/60min, Career Counseling $120/60min, Couple Counseling $120/60min), Edit/Delete per card | `GET /api/services/therapist/:id`, `POST /api/services`, `PATCH /api/services/:id`, `DELETE /api/services/:id` |
| 18 | **Therapist Subscription** | Active subscription plan details, plan comparison cards (Basic/Standard/Premium), upgrade/downgrade action → Stripe redirect | `GET /api/subscriptions/therapist/:id`, `POST /api/subscriptions/change` |
| 19 | **Therapist Payments** | Date range filter, payment history list, revenue summary by period | `GET /api/payments/therapist/:id?from=&to=` |
| 20 | **Therapist Profile** | Personal Information (Full Name, WhatsApp, Email), Professional Information (Specialization, Qualification, Practice, Experience, Session count, Client count, Bio/Message), Change Password (Old/New/Confirm), Change Photo | `GET /api/therapists/:id/profile`, `PATCH /api/therapists/:id/profile`, `PATCH /api/users/password`, `POST /api/users/avatar` |
| 21 | **Therapist Profile Setup** | Initial onboarding fields (name, credentials, specialization) — shown on first login | `POST /api/therapists/onboarding`, `PATCH /api/therapists/:id/onboarding-complete` |

### 3.4 ADMIN PANEL SCREENS (JWT Required, Role: Admin)

Right-side navigation: Dashboard → Doctors → Subscriptions → Patients → Revenue → Send Credentials → Customer Support → Profile → About Benzi → Logout

| # | Screen | What the UI Shows (Visual Analysis) | Backend APIs Needed |
|---|---|---|---|
| 28 | **Admin Dashboard** | Welcome Admin, KPI cards (Total Doctors 48 +3.2%, Total Patients 1,240 +5.1%, Monthly Revenue $24,800 +4.2%, Active Subscriptions 36 +1.8%), Most Sold Packages donut charts (Standard Plan 60%, Pro Plan 75%, Enterprise Plan 45%), Revenue Overview 12-month line chart, Today's Doctor Appointments card with calendar | `GET /api/admin/dashboard` (aggregated stats + charts) |
| 29 | **Admin Doctors** | "+ Add Doctor" button, keyword search, doctors table (Doctor ID, Name, Specialization, Patients count, Subscription plan Pro/Standard/Enterprise, Status Active/Pending/Inactive), action menu (Edit / View Profile / Send Credentials / Delete), paginated 6 per page | `GET /api/admin/doctors?search=&page=&limit=6`, `POST /api/admin/doctors`, `PATCH /api/admin/doctors/:id`, `DELETE /api/admin/doctors/:id`, `PATCH /api/admin/doctors/:id/verify` |
| 30 | **Admin Patients** | Keyword search, patients table grouped by doctor (Doctor Name, Specialization, Total Patients, Active count, Inactive count, Last Session date), eye icon view, Patient Distribution donut chart (Mental Health 40% / Self Care 35% / Therapy 25%), New Patients This Month daily bar chart | `GET /api/admin/patients?search=&page=`, `GET /api/admin/patients/stats` |
| 31 | **Admin Subscriptions** | "+ New Plan" button, plan cards (Standard $299/mo 36 active, Pro $499/mo Most Popular 12 active, Enterprise $799/mo 8 active) with full feature lists, Edit/Delete per plan, Subscription Assignments table (Doctor ID, Name, Plan, Start Date, Expiry Date, Status: Active/Pending/Inactive), Manage per row | `GET /api/admin/subscriptions`, `POST /api/admin/subscriptions/plans`, `PATCH /api/admin/subscriptions/plans/:id`, `GET /api/admin/subscriptions/assignments`, `PATCH /api/admin/subscriptions/assign` |
| 32 | **Admin Revenue** | Date range filter, Revenue KPI cards (Total Revenue $124,800 +8.3%, This Month $24,800 +4.2%, Pending Payouts $3,200 −1.1%), Payments table (Payment ID, Doctor, Patient, Date, Service, Amount, Status: Completed/Pending), Monthly Revenue horizontal bar chart, Revenue by Plan donut chart | `GET /api/admin/revenue?from=&to=`, `GET /api/admin/payments?page=` |
| 33 | **Admin Send Credentials** | First Name, Last Name, Email, Phone No, Specialization, Subscription Plan, Temporary Password (manual or auto-generate), Welcome Message text, Send Credentials button; Recently Sent log (doctor avatar, name, email, timestamp, delivery status Sent✓/Failed✗) | `POST /api/admin/credentials/send`, `GET /api/admin/credentials/log` |
| 35 | **Admin Profile** | Placeholder: "Admin profile settings coming soon." | Minimal: `GET /api/admin/profile` |
| 36 | **Admin About Benzi** | Static text: "Benzi is a mental wellness platform connecting patients and therapists." | ❌ Static |

---

## 4. Database Schema Design

All collections use MongoDB with AES-256 Field-Level Encryption (FLE) on sensitive fields. Encryption keys are managed via AWS KMS. All `_id` fields are MongoDB ObjectId.

### 4.1 Collection: `users`
```javascript
{
  _id: ObjectId,
  email: String (unique, required, indexed),    // FLE encrypted
  passwordHash: String (bcrypt, 12 rounds),
  role: String (enum: ["patient", "therapist", "admin"]),
  firstName: String,
  lastName: String,
  phone: String,                                // FLE encrypted
  avatarUrl: String,
  status: String (enum: ["PENDING_VERIFICATION", "VERIFIED", "SUSPENDED"]),
  twoFactorSecret: String (FLE encrypted),      // TOTP secret for 2FA
  twoFactorEnabled: Boolean (default: false),
  emailVerificationToken: String,
  emailVerifiedAt: Date,
  passwordResetToken: String,
  passwordResetExpires: Date,
  lastLoginAt: Date,
  createdAt: Date (default: now),
  updatedAt: Date
}
```

### 4.2 Collection: `patients`
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users, unique),
  assignedTherapistId: ObjectId (ref: therapists, nullable),
  medicalHistory: String (FLE encrypted),       // allergies, diagnoses, conditions
  currentMedications: [String] (FLE encrypted),
  treatmentPlan: String (FLE encrypted),
  emergencyContact: {
    name: String,
    phone: String (FLE encrypted),
    relationship: String
  },
  anonymousModeEnabled: Boolean (default: false),
  anonymousAlias: String,                       // auto-generated when anonymous enabled
  totalPoints: Number (default: 0),             // gamification points
  moodLog: [{
    date: Date,
    mood: String (enum: ["happy","good","normal","bad","awful"]),
    submittedAt: Date
  }],
  createdAt: Date,
  updatedAt: Date
}
```

### 4.3 Collection: `therapists`
```javascript
{
  _id: ObjectId,
  userId: ObjectId (ref: users, unique),
  specialization: String,
  qualification: String,
  practice: String,
  yearsExperience: Number,
  bio: String,
  sessionCount: Number (default: 0),
  clientCount: Number (default: 0),
  avgReplyTimeMinutes: Number (default: 0),
  verificationStatus: String (enum: ["PENDING","VERIFIED","REJECTED"]),
  verifiedAt: Date,
  verifiedBy: ObjectId (ref: users, admin),
  credentialDocumentUri: String (S3 path, FLE encrypted),
  subscriptionId: ObjectId (ref: subscriptions),
  stripeCustomerId: String,
  stripeSubscriptionId: String,
  avgRating: Number (default: 0),
  reviewCount: Number (default: 0),
  onboardingComplete: Boolean (default: false),
  createdAt: Date,
  updatedAt: Date
}
```

### 4.4 Collection: `services`
```javascript
{
  _id: ObjectId,
  therapistId: ObjectId (ref: therapists),
  name: String,                               // e.g., "Mindful Counseling"
  type: String,                               // e.g., "Individual Therapy"
  description: String,
  durationMinutes: Number (default: 60),
  pricePerSession: Number,                    // in USD cents
  isActive: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 4.5 Collection: `appointments`
```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: users),
  therapistId: ObjectId (ref: therapists),
  serviceId: ObjectId (ref: services),
  date: Date,
  durationMinutes: Number,
  location: String (enum: ["online","office","clinic"]),
  status: String (enum: ["PENDING","CONFIRMED","COMPLETED","CANCELLED","PAYMENT_PENDING"]),
  paymentStatus: String (enum: ["UNPAID","SUCCEEDED","FAILED","REFUNDED"]),
  stripePaymentIntentId: String,
  stripePaymentId: String,
  zoomMeetingId: String,
  zoomMeetingUrl: String,               // deleted after session ends
  sessionToken: String,                 // deleted after session ends
  notes: String (FLE encrypted),        // session notes added by therapist
  sessionSummary: String (FLE encrypted),
  aiAssistEnabled: Boolean (default: false),
  n8nReminderJobId: String,
  createdAt: Date,
  updatedAt: Date
}
```

### 4.6 Collection: `records`
```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: users),
  therapistId: ObjectId (ref: therapists),
  type: String (enum: ["session_notes","prescription","clinical_report","lab_result","upload"]),
  fileUri: String (S3 URI, FLE encrypted),
  fileName: String,
  fileChecksum: String,
  mimeType: String,
  fileSizeBytes: Number,
  status: String (enum: ["NOT_REVIEWED","HALF_REVIEWED","REVIEWED"]),
  therapistFeedback: String (FLE encrypted),
  patientFeedback: String,
  isVisibleToPatient: Boolean (default: true),
  createdAt: Date,
  updatedAt: Date
}
```

### 4.7 Collection: `goals`
```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: users),
  therapistId: ObjectId (ref: therapists, nullable),  // null = patient self-assigned
  description: String,
  category: String (enum: ["sleep","stress","communication","anxiety","depression","custom"]),
  currentStatusValue: Number (0-100),          // slider value
  pointsValue: Number (default: 50),
  dueDate: Date,
  status: String (enum: ["ACTIVE","COMPLETED","OVERDUE","DELETED"]),
  completedAt: Date,
  source: String (enum: ["therapist","patient","ai"]),
  createdAt: Date,
  updatedAt: Date
}
```

### 4.8 Collection: `moods`
```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: users),
  mood: String (enum: ["happy","good","normal","bad","awful"]),
  moodScore: Number,                    // happy=5, good=4, normal=3, bad=2, awful=1
  submittedAt: Date,
  weekNumber: Number,
  year: Number
}
```

### 4.9 Collection: `notifications`
```javascript
{
  _id: ObjectId,
  recipientId: ObjectId (ref: users),
  type: String (enum: ["appointment_confirmation","appointment_reminder","goal_completion","session_summary","payment_receipt","credential_dispatch","support_reply"]),
  channel: String (enum: ["email","sms","both"]),
  status: String (enum: ["PENDING","DELIVERED","FAILED"]),
  subject: String,
  body: String,
  sendgridMessageId: String,
  twilioSid: String,
  retryCount: Number (default: 0),
  scheduledAt: Date,
  sentAt: Date,
  createdAt: Date
}
```

### 4.10 Collection: `subscriptionPlans`
```javascript
{
  _id: ObjectId,
  name: String (enum: ["basic","standard","pro","enterprise"]),
  displayName: String,                  // "Standard Plan"
  priceMonthly: Number,                 // in USD cents
  priceAnnual: Number,
  features: [String],
  maxClients: Number,
  stripePriceIdMonthly: String,
  stripePriceIdAnnual: String,
  isActive: Boolean (default: true),
  createdAt: Date
}
```

### 4.11 Collection: `subscriptions`
```javascript
{
  _id: ObjectId,
  therapistId: ObjectId (ref: therapists),
  planId: ObjectId (ref: subscriptionPlans),
  stripeSubscriptionId: String,
  stripeCustomerId: String,
  status: String (enum: ["active","inactive","pending","cancelled","trial"]),
  billingCycle: String (enum: ["monthly","annual"]),
  startDate: Date,
  expiryDate: Date,
  lastPaymentAt: Date,
  createdAt: Date,
  updatedAt: Date
}
```

### 4.12 Collection: `aiLogs`
```javascript
{
  _id: ObjectId,
  patientId: ObjectId (ref: users),
  sessionId: String (uuid, groups messages in one chat session),
  message: String (FLE encrypted),
  response: String (FLE encrypted),
  contextUsed: {
    historyCount: Number,
    notesCount: Number,
    goalsCount: Number
  },
  confidence: Number,
  safetyFilterTriggered: Boolean (default: false),
  savedToNotes: Boolean (default: false),
  timestamp: Date,
  createdAt: Date
}
```

### 4.13 Collection: `auditLogs`
```javascript
{
  _id: ObjectId,
  actorId: ObjectId (ref: users),
  actorRole: String,
  action: String,                       // e.g., "THERAPIST_VERIFIED", "RECORD_ACCESSED"
  targetId: ObjectId,
  targetModel: String,
  ipAddress: String (FLE encrypted),
  userAgent: String,
  requestPath: String,
  statusCode: Number,
  metadata: Object,
  createdAt: Date
}
```

### 4.14 Collection: `supportTickets`
```javascript
{
  _id: ObjectId,
  submittedBy: ObjectId (ref: users, nullable),  // null = guest
  submitterEmail: String,
  submitterName: String,
  topic: String,
  message: String,
  status: String (enum: ["OPEN","IN_PROGRESS","RESOLVED","CLOSED"]),
  adminResponse: String,
  respondedAt: Date,
  createdAt: Date
}
```

---

## 5. Authentication & RBAC Architecture

### 5.1 JWT Configuration
```javascript
// Token payload structure
{
  sub: userId (ObjectId as string),
  role: "patient" | "therapist" | "admin",
  email: String,
  iat: Number (issued at),
  exp: Number (expires at — 3600 seconds / 1 hour)
}

// Refresh token (separate, stored in httpOnly cookie)
{
  sub: userId,
  tokenFamily: String (UUID, for rotation),
  exp: 7 days
}
```

### 5.2 RBAC Enforcement Rules

| Role | Access Scope |
|---|---|
| `patient` | Own data ONLY. Can read own records, own appointments, own goals, own AI chat history. Cannot write to records (read-only). Cannot access any other patient's data. |
| `therapist` | Own profile + own clients' data. Can read/write records for assigned patients. Cannot see admin data. Cannot see other therapists' clients. |
| `admin` | Platform-wide user management, subscription management, revenue data. **ABSOLUTE BAN on `/api/records/*`** — returns HTTP 403 always, regardless of JWT. Admin can NEVER see patient health data. |

### 5.3 Middleware Stack (Express)

```
Every authenticated request passes through:

1. rateLimiter            — max 100 req/15min per IP (express-rate-limit)
2. helmetMiddleware        — sets secure HTTP headers
3. corsMiddleware          — whitelist frontend origin only
4. verifyJWT               — validates JWT, attaches req.user
5. rbacGuard(allowedRoles) — checks req.user.role against route permissions
6. auditLogger             — logs action to auditLogs collection async

Admin routes additionally pass through:
7. adminRecordsBlock       — if path starts with /api/records → 403 immediately
```

### 5.4 Two-Factor Authentication (2FA) Flow

```
Registration:
  POST /api/auth/register
  → create user with status PENDING_VERIFICATION
  → send email verification link (SendGrid)
  → return 201

Email Verification:
  GET /api/auth/verify-email?token=xxx
  → update status to VERIFIED
  → redirect to login

Login:
  POST /api/auth/login { email, password }
  → verify password (bcrypt.compare)
  → if 2FA enabled: return { requiresTwoFactor: true, tempToken: shortLivedJWT }
  → if 2FA disabled: return { accessToken, refreshToken }

2FA Verification:
  POST /api/auth/2fa/verify { tempToken, totpCode }
  → verify TOTP code via speakeasy
  → if valid: return { accessToken, refreshToken }
  → if invalid: return 401

Setup 2FA:
  POST /api/auth/2fa/setup (authenticated)
  → generate TOTP secret via speakeasy
  → return { qrCodeUrl, secret } for user to scan in authenticator app

Confirm 2FA Setup:
  POST /api/auth/2fa/confirm { totpCode }
  → verify code
  → store secret in users.twoFactorSecret (encrypted)
  → set twoFactorEnabled: true

Password Reset:
  POST /api/auth/forgot-password { email }
  → generate 6-digit token, store in users.passwordResetToken (expires 15min)
  → send email via SendGrid

  POST /api/auth/reset-password { token, newPassword }
  → validate token and expiry
  → hash new password, clear token fields
```

---

## 6. API Endpoint Specification

### Base URL: `https://api.benzi.ai/api/v1`

All authenticated routes require header: `Authorization: Bearer <JWT>`  
All responses follow: `{ success: boolean, data: any, message: string, statusCode: number }`

---

### 6.1 Auth Routes (`/api/auth`)

```
POST   /auth/register                — Register new user (patient or therapist)
POST   /auth/login                   — Login, initiates 2FA if enabled
POST   /auth/2fa/verify              — Complete 2FA login step
POST   /auth/2fa/setup               — Begin 2FA setup for logged-in user
POST   /auth/2fa/confirm             — Confirm 2FA setup with code
GET    /auth/verify-email            — Verify email via token in query param
POST   /auth/forgot-password         — Send password reset email
POST   /auth/reset-password          — Reset password using token
POST   /auth/refresh                 — Refresh access token using httpOnly cookie
POST   /auth/logout                  — Invalidate refresh token
POST   /auth/validate                — Validate JWT and return { valid, role, userId } (used by frontend on every page load)
```

---

### 6.2 User Routes (`/api/users`)

```
GET    /users/profile                — Get own profile (all roles)
PATCH  /users/profile                — Update own profile
PATCH  /users/password               — Change password (requires current password)
POST   /users/avatar                 — Upload profile photo to S3, returns avatarUrl
DELETE /users/account                — Soft delete own account (sets status SUSPENDED)
```

---

### 6.3 Patient Routes (`/api/patients`) — Role: patient

```
GET    /patients/dashboard           — Patient dashboard data:
                                       { taskScore, moodToday, progressRings, weeklyChart, overallReport }
POST   /mood/log                     — Log today's mood { mood: "happy"|"good"|"normal"|"bad"|"awful" }
GET    /mood/today                   — Check if today's mood already logged
GET    /mood/history?days=30         — Mood history for chart
GET    /progress/:patientId          — Progress data for all goal categories
       ?range=30d&type=monthly       
```

---

### 6.4 Appointment Routes (`/api/appointments`)

```
— Patient:
GET    /appointments/availability/:therapistId?date=   — Get available time slots
POST   /appointments/book            — Book appointment + initiate Stripe payment
       Body: { therapistId, serviceId, date, time, location, paymentMethod }
GET    /appointments/patient/:id     — Patient's appointment list (paginated)
       ?status=&page=&limit=

— Therapist:
GET    /appointments/therapist/:id   — Therapist's appointment list
       ?status=&search=&page=
PATCH  /appointments/:id/status      — Update status (confirm/cancel)
       Body: { status: "CONFIRMED"|"CANCELLED" }

— Shared:
GET    /appointments/:id             — Get single appointment detail
DELETE /appointments/:id             — Cancel appointment (patient or therapist)

— Stripe Webhook:
POST   /webhooks/stripe              — Handle payment_intent.succeeded / failed
       (No JWT required, verify Stripe-Signature header)
```

---

### 6.5 Records Routes (`/api/records`) — ADMIN BLOCKED

```
GET    /records/patient/:patientId   — Therapist: full records list for patient
                                       Patient: own read-only records
POST   /records/upload               — Therapist uploads file for patient
       Body (multipart): { file, patientId, type }
       → validates file type (PDF, DOCX, JPG, PNG)
       → encrypts AES-256
       → uploads to S3
       → stores fileUri in MongoDB
GET    /records/:recordId            — Get record metadata
GET    /records/:recordId/download   — Generate signed S3 URL (expires 15 min)
PATCH  /records/:recordId/status     — Therapist updates review status
DELETE /records/:recordId            — Therapist soft deletes record
POST   /records/:reportId/feedback   — Patient submits feedback on report
```

---

### 6.6 Goals Routes (`/api/goals`)

```
GET    /goals/patient/:patientId     — All active goals for patient
POST   /goals/assign                 — Therapist assigns goal to patient
       Body: { patientId, description, category, dueDate, pointsValue }
POST   /goals/self-assign            — Patient self-assigns goal
       Body: { description, category, dueDate }
PATCH  /goals/:goalId/status         — Update slider value
       Body: { currentStatusValue: 0-100 }
PATCH  /goals/:goalId/complete       — Mark goal complete → awards points
GET    /goals/community-stats        — Get platform-wide sentiment counts (Neg/Neutral/Pos)
DELETE /goals/:goalId                — Therapist soft deletes goal (status: DELETED)
```

---

### 6.7 Services Routes (`/api/services`) — Role: therapist

```
GET    /services/therapist/:id       — Get therapist's services list
POST   /services                     — Create new service
       Body: { name, type, description, durationMinutes, pricePerSession }
PATCH  /services/:id                 — Edit service
DELETE /services/:id                 — Delete service
GET    /services/public/:therapistId — Public service listing (unauthenticated)
```

---

### 6.8 Therapist Routes (`/api/therapists`)

```
GET    /therapists/:id/profile       — Get therapist profile (public-facing)
PATCH  /therapists/:id/profile       — Update therapist professional info
POST   /therapists/onboarding        — Submit initial onboarding data
PATCH  /therapists/:id/onboarding-complete — Mark onboarding done
GET    /therapists/dashboard/:id     — Dashboard KPIs + today's appts + revenue + packages
```

---

### 6.9 Client Management Routes (`/api/clients`) — Role: therapist

```
GET    /clients/therapist/:id        — Get therapist's client list
       ?search=&page=&limit=
GET    /clients/:patientId/profile   — View specific patient's full profile
POST   /clients/add                  — Add/link a patient to therapist
DELETE /clients/:patientId           — Unlink patient from therapist
```

---

### 6.10 Payment Routes (`/api/payments`)

```
GET    /payments/therapist/:id       — Therapist payment history
       ?from=ISO_DATE&to=ISO_DATE
GET    /payments/:id                 — Single payment detail
POST   /payments/create-intent       — Create Stripe PaymentIntent
       Body: { appointmentId, amount, currency: "usd" }
       Returns: { clientSecret }     — frontend uses clientSecret with Stripe.js
```

---

### 6.11 Subscription Routes (`/api/subscriptions`)

```
GET    /subscriptions/plans          — All available plans (public)
GET    /subscriptions/therapist/:id  — Therapist's active subscription
POST   /subscriptions/create         — Create Stripe subscription for therapist
       Body: { therapistId, planId, billingCycle }
PATCH  /subscriptions/change         — Upgrade or downgrade plan
       Body: { therapistId, newPlanId }
DELETE /subscriptions/cancel         — Cancel subscription at period end
```

---

### 6.12 Admin Routes (`/api/admin`) — Role: admin only

```
GET    /admin/dashboard              — Aggregate stats (total doctors, patients, revenue, subscriptions)
                                       + revenue 12-month chart + most sold packages + today's appts

GET    /admin/doctors                — Doctors list with pagination + search
       ?search=&page=&limit=6&status=
POST   /admin/doctors                — Add new doctor manually
PATCH  /admin/doctors/:id            — Edit doctor
PATCH  /admin/doctors/:id/verify     — Verify/approve pending therapist
       Body: { status: "VERIFIED"|"REJECTED" }
DELETE /admin/doctors/:id            — Delete / suspend doctor
       Body: { status: "INACTIVE" }

GET    /admin/patients               — Patients grouped by therapist
       ?search=&page=
GET    /admin/patients/stats         — Distribution donut + new patients chart

GET    /admin/subscriptions          — All plan cards + assignments table
POST   /admin/subscriptions/plans    — Create new plan (+ Stripe Product)
PATCH  /admin/subscriptions/plans/:id — Edit plan
PATCH  /admin/subscriptions/assign   — Assign/change plan for therapist

GET    /admin/revenue                — Revenue KPIs + payments table + charts
       ?from=&to=&page=
GET    /admin/payments               — All payments paginated

POST   /admin/credentials/send       — Send login credentials to doctor via SendGrid
       Body: { firstName, lastName, email, phone, specialization, planId, tempPassword, welcomeMessage }
GET    /admin/credentials/log        — Recently sent credentials log

GET    /admin/profile                — Admin profile (placeholder)

POST   /admin/support/respond        — Admin responds to support ticket
GET    /admin/support/tickets        — All support tickets
PATCH  /admin/support/tickets/:id/status — Update ticket status
```

---

### 6.13 Notification Routes (`/api/notifications`)

```
GET    /notifications                — Get user's notification list (unread first)
PATCH  /notifications/:id/read       — Mark as read
DELETE /notifications/:id            — Delete notification
```

---

### 6.14 Support Routes (`/api/support`)

```
POST   /support/ticket               — Submit support ticket (auth or guest)
GET    /support/tickets/:userId      — User's submitted tickets + status
```

---

### 6.15 Misc Public Routes

```
POST   /contact                      — Contact Us form → creates support ticket + SendGrid email
POST   /newsletter/subscribe         — Newsletter signup { email }
GET    /health                       — API health check (no auth)
```

---

## 7. Service Layer Design

### 7.1 Project File Structure

```
benzi-backend/
├── src/
│   ├── config/
│   │   ├── database.js           ← MongoDB Singleton connection
│   │   ├── environment.js        ← All env vars centralized
│   │   ├── stripe.js             ← Stripe client singleton
│   │   ├── sendgrid.js           ← SendGrid client singleton
│   │   └── twilio.js             ← Twilio client singleton
│   ├── models/
│   │   ├── User.js               ← Mongoose schema + FLE config
│   │   ├── Patient.js
│   │   ├── Therapist.js
│   │   ├── Appointment.js
│   │   ├── Record.js
│   │   ├── Goal.js
│   │   ├── Mood.js
│   │   ├── Service.js
│   │   ├── Subscription.js
│   │   ├── SubscriptionPlan.js
│   │   ├── Notification.js
│   │   ├── AuditLog.js
│   │   ├── SupportTicket.js
│   │   └── AILog.js
│   ├── services/
│   │   ├── AuthService.js        ← JWT, bcrypt, TOTP logic
│   │   ├── AppointmentService.js ← Booking, conflict check, slot availability
│   │   ├── RecordsService.js     ← S3 upload/download, encryption
│   │   ├── GoalService.js        ← Goal CRUD, points awarding
│   │   ├── NotificationService.js← SendGrid + Twilio dispatch
│   │   ├── PaymentService.js     ← Stripe PaymentIntent, webhooks
│   │   ├── SubscriptionService.js← Stripe Subscriptions
│   │   ├── UserService.js        ← Profile, avatar, password
│   │   ├── AdminService.js       ← Aggregation queries for admin
│   │   ├── DashboardService.js   ← Patient + Therapist dashboard aggregations
│   │   ├── MoodService.js        ← Mood logging + chart data
│   │   └── AuditService.js       ← Audit log writes
│   ├── controllers/
│   │   ├── authController.js
│   │   ├── appointmentController.js
│   │   ├── recordsController.js
│   │   ├── goalController.js
│   │   ├── notificationController.js
│   │   ├── paymentController.js
│   │   ├── adminController.js
│   │   ├── therapistController.js
│   │   ├── patientController.js
│   │   └── subscriptionController.js
│   ├── middleware/
│   │   ├── verifyJWT.js          ← JWT validation + attach req.user
│   │   ├── rbacGuard.js          ← Role-based access check
│   │   ├── adminRecordsBlock.js  ← Hard block admin from /records/*
│   │   ├── rateLimiter.js        ← express-rate-limit config
│   │   ├── auditMiddleware.js    ← Async audit logging
│   │   ├── uploadMiddleware.js   ← multer config for file uploads
│   │   └── errorHandler.js       ← Global error handler
│   ├── routes/
│   │   ├── auth.routes.js
│   │   ├── user.routes.js
│   │   ├── patient.routes.js
│   │   ├── therapist.routes.js
│   │   ├── appointment.routes.js
│   │   ├── records.routes.js
│   │   ├── goal.routes.js
│   │   ├── service.routes.js
│   │   ├── payment.routes.js
│   │   ├── subscription.routes.js
│   │   ├── admin.routes.js
│   │   ├── notification.routes.js
│   │   └── support.routes.js
│   ├── utils/
│   │   ├── tokenUtils.js         ← JWT sign/verify helpers
│   │   ├── encryptionUtils.js    ← AES-256 encrypt/decrypt helpers
│   │   ├── s3Utils.js            ← S3 upload/presigned URL
│   │   ├── validators.js         ← Joi or Zod validation schemas
│   │   ├── passwordUtils.js      ← bcrypt helpers
│   │   ├── dateUtils.js          ← Date range, week number helpers
│   │   └── responseUtils.js      ← Standard API response formatter
│   └── app.js                    ← Express app setup (no listen)
├── server.js                     ← Server start + DB connect
├── .env                          ← Never commit
├── .env.example                  ← Commit this
├── package.json
└── docker-compose.yml
```

### 7.2 Appointment Service — Key Business Logic

```javascript
// Conflict check before booking
async checkSlotAvailability(therapistId, date, time) {
  const start = new Date(`${date}T${time}`);
  const end = new Date(start.getTime() + 60 * 60 * 1000); // +1 hour

  const conflict = await Appointment.findOne({
    therapistId,
    status: { $in: ["CONFIRMED", "PENDING"] },
    date: { $gte: start, $lt: end }
  });
  return conflict === null; // true = slot is free
}

// Full booking flow
async bookAppointment(patientId, therapistId, serviceId, slot, paymentMethod) {
  // 1. Validate slot is free
  // 2. Create Stripe PaymentIntent
  // 3. Insert appointment with status PAYMENT_PENDING
  // 4. Return clientSecret to frontend for Stripe.js
  // 5. Webhook (stripe) will CONFIRM or FAIL the appointment
  // 6. On success: send notifications, schedule n8n reminder
}
```

### 7.3 Records Service — S3 Upload Flow

```javascript
async uploadRecord(file, patientId, therapistId, type) {
  // 1. Validate file type: only PDF, DOCX, JPG, PNG, max 10MB
  const allowed = ['application/pdf','application/vnd.openxmlformats-officedocument.wordprocessingml.document','image/jpeg','image/png'];
  if (!allowed.includes(file.mimetype)) throw new Error('UNSUPPORTED_MEDIA_TYPE');

  // 2. Encrypt file buffer with AES-256 before S3 upload
  const encryptedBuffer = encryptionUtils.encrypt(file.buffer);

  // 3. Upload to S3 with server-side encryption
  const result = await s3Utils.upload({
    Bucket: process.env.S3_BUCKET,
    Key: `records/${patientId}/${Date.now()}-${file.originalname}`,
    Body: encryptedBuffer,
    ServerSideEncryption: 'aws:kms',
    ContentType: file.mimetype
  });

  // 4. Store file URI in MongoDB (URI itself is FLE encrypted)
  return await Record.create({
    patientId, therapistId, type,
    fileUri: result.Location,
    fileName: file.originalname,
    fileChecksum: computeChecksum(file.buffer),
    mimeType: file.mimetype,
    fileSizeBytes: file.size,
    status: 'NOT_REVIEWED'
  });
}
```

### 7.4 Goal Service — Points System

```javascript
async completeGoal(goalId, patientId) {
  const goal = await Goal.findOne({ _id: goalId, patientId, status: 'ACTIVE' });
  if (!goal) throw new Error('GOAL_NOT_FOUND');

  // Update goal status
  await Goal.updateOne({ _id: goalId }, {
    status: 'COMPLETED',
    completedAt: new Date()
  });

  // Award points to patient
  const updatedPatient = await Patient.findOneAndUpdate(
    { userId: patientId },
    { $inc: { totalPoints: goal.pointsValue } },
    { new: true }
  );

  // Observer Pattern: trigger notifications
  await NotificationService.triggerGoalComplete(patientId, goal.therapistId, goal.description);

  return { status: 'COMPLETED', totalPoints: updatedPatient.totalPoints };
}
```

---

## 8. Security Implementation Guide

### 8.1 Helmet.js Configuration
```javascript
app.use(helmet({
  contentSecurityPolicy: {
    directives: {
      defaultSrc: ["'self'"],
      scriptSrc: ["'self'", "https://js.stripe.com"],
      connectSrc: ["'self'", "https://api.stripe.com"],
      frameSrc: ["https://js.stripe.com", "https://zoom.us"],
      imgSrc: ["'self'", "data:", "https://*.amazonaws.com"]
    }
  },
  hsts: { maxAge: 31536000, includeSubDomains: true },
  noSniff: true,
  xssFilter: true
}));
```

### 8.2 Rate Limiting
```javascript
// General API limit
const generalLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,    // 15 minutes
  max: 100,
  message: { success: false, message: 'Too many requests' }
});

// Auth routes — stricter
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,                      // max 10 login attempts per 15 min
  message: { success: false, message: 'Too many login attempts' }
});

app.use('/api/', generalLimiter);
app.use('/api/auth/login', authLimiter);
app.use('/api/auth/forgot-password', authLimiter);
```

### 8.3 Input Validation (Joi)
```javascript
// Every controller validates input BEFORE any database operation
const registerSchema = Joi.object({
  firstName: Joi.string().min(2).max(50).required(),
  lastName: Joi.string().min(2).max(50).required(),
  email: Joi.string().email().required(),
  phone: Joi.string().pattern(/^\+?[0-9]{10,15}$/).required(),
  password: Joi.string()
    .min(8)
    .pattern(/^(?=.*[A-Z])(?=.*[a-z])(?=.*[0-9])(?=.*[!@#$%^&*])/)
    .required(),
  confirmPassword: Joi.ref('password'),
  role: Joi.string().valid('patient','therapist').required()
});
```

### 8.4 CORS Configuration
```javascript
app.use(cors({
  origin: [process.env.FRONTEND_URL],  // Only whitelisted frontend origin
  credentials: true,                   // Allow httpOnly cookie for refresh token
  methods: ['GET','POST','PATCH','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization']
}));
```

### 8.5 Stripe Webhook Signature Verification
```javascript
// /webhooks/stripe route MUST NOT use express.json() parser
// Use express.raw({ type: 'application/json' })
app.post('/webhooks/stripe', express.raw({ type: 'application/json' }), (req, res) => {
  const sig = req.headers['stripe-signature'];
  let event;
  try {
    event = stripe.webhooks.constructEvent(req.body, sig, process.env.STRIPE_WEBHOOK_SECRET);
  } catch (err) {
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }
  // Handle event.type
});
```

### 8.6 MongoDB Connection with FLE
```javascript
// database.js
const { MongoClient, ClientEncryption } = require('mongodb');

const encryptedFieldsMap = {
  'benzi.users': {
    fields: [
      { path: 'email', bsonType: 'string', algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Deterministic' },
      { path: 'phone', bsonType: 'string', algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random' },
      { path: 'twoFactorSecret', bsonType: 'string', algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random' }
    ]
  },
  'benzi.records': {
    fields: [
      { path: 'fileUri', bsonType: 'string', algorithm: 'AEAD_AES_256_CBC_HMAC_SHA_512-Random' }
    ]
  }
  // Add other collections as needed
};
```

### 8.7 Password Requirements (Enforced at API Level)
- Minimum 8 characters
- At least 1 uppercase, 1 lowercase, 1 digit, 1 special character
- Bcrypt with 12 salt rounds
- Never returned in any API response
- Never logged to console or files

### 8.8 File Upload Security
```javascript
// Only these MIME types allowed for record uploads
const ALLOWED_MIME_TYPES = [
  'application/pdf',
  'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  'image/jpeg',
  'image/png'
];
const MAX_FILE_SIZE = 10 * 1024 * 1024; // 10MB

// Always store files with randomized S3 keys, never original filenames as keys
// Always validate file magic bytes, not just extension
```

---

## 9. Third-Party Integration Details

### 9.1 Stripe Integration

**Used for**: Appointment payment processing + Therapist subscription billing

```javascript
// Setup
const stripe = require('stripe')(process.env.STRIPE_SECRET_KEY);

// Appointment Payment Flow:
// 1. Backend creates PaymentIntent
const intent = await stripe.paymentIntents.create({
  amount: servicePrice * 100,           // amount in cents
  currency: 'usd',
  metadata: { appointmentId, patientId, therapistId }
});
// 2. Return intent.client_secret to frontend
// 3. Frontend uses Stripe.js confirmPayment() — card data NEVER reaches backend
// 4. Stripe fires webhook: payment_intent.succeeded or payment_intent.payment_failed
// 5. Backend webhook handler updates appointment status

// Subscription Flow:
// 1. Create Stripe Customer for therapist on first subscription
const customer = await stripe.customers.create({ email, name, metadata: { therapistId } });
// 2. Create Subscription
const subscription = await stripe.subscriptions.create({
  customer: customer.id,
  items: [{ price: stripePriceId }],
  expand: ['latest_invoice.payment_intent']
});
// 3. Handle subscription.updated and customer.subscription.deleted webhooks
```

**Webhook Events to Handle**:
- `payment_intent.succeeded` → set appointment CONFIRMED, send notifications
- `payment_intent.payment_failed` → set appointment PAYMENT_FAILED
- `customer.subscription.created` → set therapist subscription ACTIVE
- `customer.subscription.updated` → update plan details
- `customer.subscription.deleted` → set subscription CANCELLED

### 9.2 SendGrid Integration

**Used for**: Email verification, password reset, appointment confirmations, session summaries, credential dispatch, support tickets, newsletter

```javascript
const sgMail = require('@sendgrid/mail');
sgMail.setApiKey(process.env.SENDGRID_API_KEY);

// Example: Appointment Confirmation
await sgMail.send({
  to: patient.email,
  from: { email: 'noreply@benzi.ai', name: 'BENZI.AI' },
  templateId: process.env.SENDGRID_TEMPLATE_APPT_CONFIRM,
  dynamicTemplateData: {
    patientName: patient.firstName,
    therapistName: therapist.firstName,
    date: appointment.date,
    time: appointment.time,
    location: appointment.location,
    appointmentId: appointment._id
  }
});
```

**Templates Needed in SendGrid**:
1. `APPT_CONFIRM` — Appointment confirmation (patient + therapist)
2. `APPT_REMINDER` — 24-hour reminder
3. `APPT_CANCELLED` — Cancellation notice
4. `EMAIL_VERIFY` — Email verification link
5. `PASSWORD_RESET` — Password reset link
6. `GOAL_COMPLETE` — Congratulation on goal completion
7. `SESSION_SUMMARY` — Post-session summary to patient
8. `CREDENTIAL_DISPATCH` — New therapist credentials
9. `SUBSCRIPTION_RECEIPT` — Subscription payment receipt
10. `SUPPORT_REPLY` — Admin response to support ticket
11. `NEWSLETTER_WELCOME` — Newsletter subscription welcome

### 9.3 Twilio Integration

**Used for**: SMS notifications for appointments, goal reminders

```javascript
const twilio = require('twilio')(process.env.TWILIO_ACCOUNT_SID, process.env.TWILIO_AUTH_TOKEN);

await twilio.messages.create({
  body: `BENZI.AI: Your appointment with Dr. ${therapistName} is confirmed for ${date} at ${time}.`,
  from: process.env.TWILIO_PHONE_NUMBER,
  to: patient.phone                     // E.164 format: +923001234567
});
```

**SMS Events**: Appointment confirmation, 24-hour reminder, goal deadline reminder

### 9.4 AWS S3 Integration

**Used for**: Encrypted patient record storage, profile avatars

```javascript
const { S3Client, PutObjectCommand, GetObjectCommand } = require('@aws-sdk/client-s3');
const { getSignedUrl } = require('@aws-sdk/s3-request-presigner');

// Upload encrypted file
const command = new PutObjectCommand({
  Bucket: process.env.S3_BUCKET_NAME,
  Key: `records/${patientId}/${uuid()}.enc`,
  Body: encryptedBuffer,
  ServerSideEncryption: 'aws:kms',
  SSEKMSKeyId: process.env.AWS_KMS_KEY_ID,
  ContentType: mimetype
});

// Generate presigned download URL (expires 15 min)
const downloadUrl = await getSignedUrl(s3Client, new GetObjectCommand({
  Bucket: process.env.S3_BUCKET_NAME,
  Key: record.fileKey
}), { expiresIn: 900 });
```

### 9.5 n8n Automation Workflows

**Used for**: Scheduled reminders, background workflows

**Workflows to Create**:
1. `appointment-reminder` — Triggered 24 hours before appointment → calls `/api/internal/reminders/appointment`
2. `goal-overdue-check` — Daily cron at midnight → finds overdue goals → calls `/api/internal/reminders/goals`
3. `subscription-expiry-check` — Daily cron → finds subscriptions expiring in 3 days → sends warning email
4. `ai-analytics-batch` — Weekly cron → triggers AI progress report generation (deferred)
5. `failed-notification-retry` — Polls failed notifications → retries with exponential backoff

n8n connects to backend via webhook URLs. Backend exposes `/api/internal/*` endpoints protected by an internal API key (`x-internal-key` header), not JWT.

---

## 10. AI Module — Leave for Later (Embedding Phase)

> **⚠️ DO NOT implement this section until all backend routes in Sections 6 and 7 are complete and tested.**

### 10.1 What Screens Are AI-Dependent

| Screen | AI Feature | Leave Until? |
|---|---|---|
| **Patient — Conversations (Screen #6)** | BENZI AI chatbot — full RAG + LLM pipeline | ✅ Full AI phase |
| **Patient — Goals (Screen #7)** | AI Insights & Recommendations feed | ✅ Full AI phase |
| **Patient — Reports (Screen #10)** | Task generation + Notes/Guidance generation sections | ✅ Full AI phase |
| **Therapist — Dashboard (Screen #14)** | AI-generated session summary display | ✅ Full AI phase |
| **Patient — Progress (Screen #8)** | AI-generated insights overlaid on charts | ⚠️ Partial — charts are pure data, implement data first |

### 10.2 What to Stub Now (So Frontend Doesn't Break)

While AI is deferred, return stub responses from these endpoints:

```javascript
// POST /api/ai/chat — stub response
{
  "success": true,
  "data": {
    "responseText": "I'm here to support you. Our AI assistant is being set up — please check back soon.",
    "suggestions": [],
    "isStub": true
  }
}

// GET /api/goals/insights/:patientId — stub
{
  "success": true,
  "data": { "insights": [], "isStub": true }
}
```

### 10.3 AI Module Architecture (Future Implementation)

```
Technology: Python 3.11 + FastAPI
LLM: Llama 3 (via Ollama, local inference) OR Mistral 7B OR Phi-3
RAG Pipeline: LangChain + ChromaDB (vector store)
Guardrails: Guardrails.ai + custom topic classifier

Service Structure:
  ai-service/
  ├── main.py                  — FastAPI app
  ├── routes/
  │   ├── chat.py              — POST /ai/v1/respond
  │   └── context.py           — POST /api/ai/context
  ├── services/
  │   ├── rag_service.py       — Document chunking, embedding, retrieval
  │   ├── llm_service.py       — LLM inference with Ollama
  │   ├── guardrails.py        — Safety filter pipeline
  │   └── context_builder.py   — Assembles patient context payload
  └── models/
      └── schemas.py           — Pydantic request/response models

Safety Filter Rules (safetyFilter() module):
  1. NEVER produce clinical diagnosis → detect intent → redirect to therapist
  2. NEVER prescribe medications
  3. NEVER provide crisis intervention (redirect to crisis hotline)
  4. NEVER reveal information from other patients
  5. All responses tagged with source attribution
  6. Crisis keyword detection → flag + alert therapist notification

AI Chat History (implement NOW as backend storage, no AI logic yet):
  POST /api/ai/chat/session/new         — Create new chat session
  GET  /api/ai/chat/history/:patientId  — Get all chat sessions (metadata)
  GET  /api/ai/chat/:sessionId          — Get messages in a session
  DELETE /api/ai/chat/:sessionId        — Delete chat session
```

---

## 11. n8n Automation Workflows

### 11.1 Appointment Reminder Workflow

```
Trigger: Webhook from backend (called when appointment is booked)
  → Backend calls POST http://n8n:5678/webhook/appointment-reminder
  → Payload: { appointmentId, patientId, therapistId, scheduledTime }

Wait: Until 24 hours before scheduledTime (n8n Wait node)

Action 1: HTTP Request → POST /api/internal/reminders/appointment
  Header: x-internal-key: ${INTERNAL_API_KEY}
  Body: { appointmentId }
  → Backend dispatches SendGrid email + Twilio SMS

Error handling: 3 retries with 5-minute intervals
```

### 11.2 Goal Overdue Check Workflow

```
Trigger: Schedule node — every day at 00:01 UTC
  
Action: HTTP Request → GET /api/internal/goals/overdue
  Header: x-internal-key: ${INTERNAL_API_KEY}
  
Returns: [{ goalId, patientId, description }]

For each overdue goal:
  HTTP Request → POST /api/internal/reminders/goal
  Body: { goalId, patientId }
  → Backend sends reminder notification
```

### 11.3 Internal API Endpoints (n8n only)

```javascript
// Protected by x-internal-key header, NOT JWT
const internalKeyGuard = (req, res, next) => {
  if (req.headers['x-internal-key'] !== process.env.INTERNAL_API_KEY) {
    return res.status(403).json({ success: false, message: 'Forbidden' });
  }
  next();
};

POST /api/internal/reminders/appointment  — Dispatches appointment reminder
POST /api/internal/reminders/goal         — Dispatches goal reminder  
GET  /api/internal/goals/overdue          — Returns overdue goals list
POST /api/internal/ai/batch               — Triggers AI batch (future, stub for now)
```

---

## 12. Step-by-Step Implementation Plan

> Implement in exact order. Do NOT skip steps. Each step must pass its test cases before moving to the next.

---

### ✅ STEP 1: Project Setup & Infrastructure
**Goal**: Working server, connected database, environment configured

Tasks:
1. Initialize Node.js project: `npm init -y`
2. Install core dependencies: `express`, `mongoose`, `dotenv`, `cors`, `helmet`, `morgan`, `express-rate-limit`
3. Install auth dependencies: `jsonwebtoken`, `bcryptjs`, `speakeasy`, `qrcode`
4. Install validation: `joi`
5. Install AWS SDK: `@aws-sdk/client-s3`, `@aws-sdk/s3-request-presigner`
6. Install integrations: `stripe`, `@sendgrid/mail`, `twilio`
7. Set up `src/app.js` with middleware stack
8. Set up `server.js` with MongoDB connection (Singleton pattern)
9. Set up `src/config/environment.js` to validate all required env vars on startup — app MUST NOT start if any required variable is missing
10. Create `.env.example` file with all variable names (no values)
11. Set up `src/utils/responseUtils.js` — standardized `{ success, data, message, statusCode }` format
12. Set up `src/middleware/errorHandler.js` — catches all unhandled errors, returns sanitized messages in production

**Test**: `GET /health` returns `{ success: true, data: { status: "ok" }, statusCode: 200 }`

---

### ✅ STEP 2: Database Models
**Goal**: All Mongoose schemas defined with correct validation and FLE markers

Tasks:
1. Create all 14 collection schemas from Section 4
2. Add indexes:
   - `users.email` — unique index
   - `appointments.therapistId + date` — compound index
   - `goals.patientId + status` — compound index
   - `records.patientId` — index
   - `auditLogs.actorId + createdAt` — compound index
3. Add Mongoose middleware (pre-save hooks):
   - Hash password before saving User if modified
   - Set `updatedAt` on every update
4. Configure MongoDB FLE for sensitive fields (see Section 8.6)

**Test**: Run `node scripts/seedTestData.js` — verify collections created with correct structure

---

### ✅ STEP 3: Authentication System
**Goal**: Full registration → email verification → login → 2FA → JWT flow

Tasks:
1. Build `AuthService.js`:
   - `register()` — hash password, create user, send verification email
   - `verifyEmail()` — validate token, update status
   - `login()` — validate credentials, check 2FA, issue tokens
   - `verify2FA()` — validate TOTP, issue full JWT
   - `setup2FA()` — generate TOTP secret + QR code
   - `confirm2FA()` — store secret, enable 2FA
   - `forgotPassword()` — generate reset token, send email
   - `resetPassword()` — validate token, hash new password
   - `refreshToken()` — validate refresh token, issue new access token
   - `logout()` — invalidate refresh token
2. Build `verifyJWT` middleware
3. Build `rbacGuard` middleware
4. Build `adminRecordsBlock` middleware — hardcoded 403 for admin on /records/*
5. Build `auditMiddleware` — async write to auditLogs
6. Wire auth routes

**Test Cases**: TC-1 (Login), TC-2 (Registration) from document Section 6.1 — both should Pass

---

### ✅ STEP 4: User & Profile Management
**Goal**: Profile read/write, avatar upload, password change

Tasks:
1. Set up S3 bucket with correct CORS and KMS encryption policy
2. Build `s3Utils.js` — upload file buffer, generate presigned URL
3. Build `UserService.js` — getProfile, updateProfile, changePassword, uploadAvatar
4. Build patient-specific profile routes
5. Build therapist profile + onboarding routes (Therapist Profile Setup screen — Screen #21)
6. Build avatar upload with multer + S3 (validate: image only, max 2MB)

**Test**: Upload avatar → verify presigned URL returns correct image → verify non-owner cannot access

---

### ✅ STEP 5: Appointment System
**Goal**: Full appointment booking with Stripe payment, availability checking, status management

Tasks:
1. Build `AppointmentService.js`:
   - `getAvailableSlots()` — query confirmed appointments for therapist on date, return free slots
   - `bookAppointment()` — validate slot free → create Stripe PaymentIntent → insert PAYMENT_PENDING appointment → return clientSecret
   - `confirmFromWebhook()` — called by Stripe webhook handler → set CONFIRMED
   - `failFromWebhook()` — set PAYMENT_FAILED
2. Build Stripe webhook route (`/webhooks/stripe`) with signature verification
3. Build appointment routes for patient (book, list, view, cancel)
4. Build appointment routes for therapist (list, confirm, cancel, view)
5. Set up n8n webhook call on successful booking (schedule reminder)
6. Test Stripe test mode with card 4242 4242 4242 4242 (success) and 4000 0000 0000 0002 (failure)

**Test Cases**: TC-3 (Book Appointment with Payment), TC-7 (Payment Failure) — both should Pass

---

### ✅ STEP 6: Medical Records System
**Goal**: Encrypted file upload to S3, RBAC-enforced access, download via presigned URL

Tasks:
1. Build `RecordsService.js`:
   - `uploadRecord()` — validate type → encrypt → S3 upload → store metadata
   - `getRecords()` — enforces ownership (patient: own records only, therapist: own patients only)
   - `generateDownloadUrl()` — presigned URL, 15-minute expiry
   - `updateStatus()` — therapist updates review status
   - `deleteRecord()` — soft delete
2. Wire records routes with `adminRecordsBlock` middleware
3. Test: therapist uploads → patient reads own → admin gets 403

**Test Case**: TC-4 (Upload and Access Encrypted Patient Record) — should Pass

---

### ✅ STEP 7: Goal Tracking & Gamification
**Goal**: Goal assignment by therapist, self-assignment by patient, completion, points system

Tasks:
1. Build `GoalService.js`:
   - `assignGoal()` — therapist assigns to patient
   - `selfAssignGoal()` — patient sets own goal
   - `updateStatus()` — update slider value
   - `completeGoal()` — mark complete → award points → trigger notifications
   - `getOverdueGoals()` — internal API for n8n
   - `getGoalStats()` — pie chart data (Completed/InProgress/Pending counts)
   - `getCommunityStats()` — Negative/Neutral/Positive sentiment counts
2. Wire goal routes
3. Set up n8n goal overdue workflow

**Test Case**: TC-5 (Assign Wellness Goal and Award Gamification Points) — should Pass

---

### ✅ STEP 8: Notification System
**Goal**: Full email + SMS dispatch with delivery tracking

Tasks:
1. Create all 11 SendGrid email templates (Section 9.2)
2. Build `NotificationService.js`:
   - `sendEmail()` — SendGrid dispatch with template
   - `sendSMS()` — Twilio dispatch
   - `triggerAppointmentConfirmation()`
   - `triggerGoalComplete()`
   - `triggerSessionSummary()`
   - `triggerCredentialDispatch()`
   - Persist all notifications to `notifications` collection
3. Build notification list routes (patient: GET own notifications, PATCH read)

**Test Case**: TC-6 (Automated Notification Dispatch) — should Pass

---

### ✅ STEP 9: Subscription Management
**Goal**: Therapist subscription plans visible and manageable, Stripe subscription billing

Tasks:
1. Seed subscription plans into `subscriptionPlans` collection (Standard, Pro, Enterprise)
2. Build `SubscriptionService.js`:
   - `getPlans()` — public endpoint
   - `createCustomer()` — Stripe customer for new therapist
   - `createSubscription()` — Stripe subscription + MongoDB record
   - `changeSubscription()` — upgrade/downgrade
   - `cancelSubscription()`
3. Handle Stripe subscription webhooks
4. Build subscription routes for therapist and admin

---

### ✅ STEP 10: Therapist Services (Listings)
**Goal**: Therapist can create/edit/delete their offered services

Tasks:
1. Build services CRUD — `ServicesService.js`
2. Wire routes (therapist auth required for write, public GET for patient discovery)
3. Connect to appointment booking (patient selects service when booking)

---

### ✅ STEP 11: Dashboard Aggregations
**Goal**: Patient dashboard, Therapist dashboard, Admin dashboard data endpoints

Tasks:
1. Build `DashboardService.js`:
   - `getPatientDashboard()` — task score (total points), today's mood status, progress rings (goals by category), weekly mood chart, overall report chart
   - `getTherapistDashboard()` — KPI cards (active services, new services, avg reviews, avg reply time), today's appointments, calendar events, most bought packages, revenue by month
2. Build `AdminService.js`:
   - `getAdminDashboard()` — total doctors, total patients, monthly revenue, active subscriptions, most sold packages, 12-month revenue chart
   - `getDoctorsList()` — paginated, searchable
   - `getPatientsList()` — grouped by therapist
   - `getRevenueData()` — KPIs + payments table + charts

---

### ✅ STEP 12: Admin Panel Functionality
**Goal**: Admin can manage doctors, verify therapists, send credentials, manage subscriptions

Tasks:
1. Build admin doctor management routes (CRUD + verify)
2. Build admin send credentials endpoint — generates temp password, dispatches email via SendGrid template
3. Build admin patients overview
4. Build admin revenue endpoints (aggregates from appointments + subscriptions)
5. Ensure `adminRecordsBlock` is tested in integration — confirm HTTP 403 on all /records/* attempts

**Test Case**: TC-8 (Admin Therapist Verification and Subscription Assignment) — should Pass

---

### ✅ STEP 13: Mood Tracking & Progress Analytics
**Goal**: Patient mood log, progress data for all chart screens

Tasks:
1. Build `MoodService.js` — log mood (one per day per patient), get history, get chart data
2. Build progress aggregation — per-goal category completion % over time period
3. Build `GET /api/progress/:patientId` endpoint returning all chart data for Progress screen
4. Build usage stats (Benzi usage hours — stubbed from AI logs count)

---

### ✅ STEP 14: Support & Contact
**Goal**: Support ticket creation, admin management of tickets

Tasks:
1. Build support ticket creation (authenticated + guest)
2. Build admin support management routes
3. Contact Us form → creates ticket + sends notification email

---

### ✅ STEP 15: AI Chat Stubs & Session History
**Goal**: AI Conversations screen works with stub responses, chat history persists

Tasks:
1. Build AI chat session creation/deletion endpoints (real persistence, no AI logic)
2. Implement stub `POST /api/ai/chat` response (Section 10.2)
3. Stub `/api/goals/insights/:patientId`
4. All AI endpoints respond with `isStub: true` until AI phase

---

### ✅ STEP 16: End-to-End Testing & Security Hardening
**Goal**: All 9 test cases from Section 6.1 pass, security audit clean

Tasks:
1. Run all 9 TC test cases from document Section 6.1
2. Audit all routes — confirm no route accessible without proper role
3. Confirm admin 403 on all /records/* paths
4. SQL injection / NoSQL injection tests on all inputs
5. XSS: confirm all user input is sanitized before storage/display
6. JWT expiry test: confirm 401 on expired token
7. Rate limiter test: confirm 429 after 10 login attempts
8. S3 presigned URL test: confirm expiry after 15 minutes

---

## 13. Environment Variables & Secrets

Create `.env.example` (commit) and `.env` (never commit):

```bash
# App
NODE_ENV=development
PORT=5000
FRONTEND_URL=http://localhost:3000

# MongoDB
MONGODB_URI=mongodb+srv://...

# JWT
JWT_SECRET=minimum-64-char-random-string-use-crypto-randomBytes-64-toString-hex
JWT_EXPIRES_IN=3600
REFRESH_TOKEN_SECRET=different-minimum-64-char-random-string
REFRESH_TOKEN_EXPIRES_IN=7d

# Internal API (for n8n)
INTERNAL_API_KEY=minimum-32-char-random-key

# AWS
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=
AWS_SECRET_ACCESS_KEY=
AWS_KMS_KEY_ID=
S3_BUCKET_NAME=benzi-records-prod

# Stripe
STRIPE_SECRET_KEY=sk_live_...   (use sk_test_... in development)
STRIPE_PUBLISHABLE_KEY=pk_live_...
STRIPE_WEBHOOK_SECRET=whsec_...

# SendGrid
SENDGRID_API_KEY=SG.xxx
SENDGRID_FROM_EMAIL=noreply@benzi.ai
SENDGRID_TEMPLATE_APPT_CONFIRM=d-xxx
SENDGRID_TEMPLATE_APPT_REMINDER=d-xxx
SENDGRID_TEMPLATE_APPT_CANCELLED=d-xxx
SENDGRID_TEMPLATE_EMAIL_VERIFY=d-xxx
SENDGRID_TEMPLATE_PASSWORD_RESET=d-xxx
SENDGRID_TEMPLATE_GOAL_COMPLETE=d-xxx
SENDGRID_TEMPLATE_SESSION_SUMMARY=d-xxx
SENDGRID_TEMPLATE_CREDENTIAL_DISPATCH=d-xxx
SENDGRID_TEMPLATE_SUBSCRIPTION_RECEIPT=d-xxx
SENDGRID_TEMPLATE_SUPPORT_REPLY=d-xxx
SENDGRID_TEMPLATE_NEWSLETTER_WELCOME=d-xxx

# Twilio
TWILIO_ACCOUNT_SID=ACxxx
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=+1xxxxxxxxxx

# n8n
N8N_WEBHOOK_BASE_URL=http://n8n:5678
N8N_APPOINTMENT_REMINDER_WEBHOOK=http://n8n:5678/webhook/appointment-reminder
N8N_GOAL_CHECK_WEBHOOK=http://n8n:5678/webhook/goal-check

# AI Service (deferred)
AI_SERVICE_URL=http://ai-service:8000
AI_SERVICE_KEY=
```

**Security Rules for Env Vars**:
- Use `crypto.randomBytes(64).toString('hex')` to generate JWT secrets
- Rotate all secrets on any suspected breach
- In production: use AWS Secrets Manager or Azure Key Vault instead of `.env` files
- Never log env var values — log only names at startup verification

---

## 14. Error Handling Standards

### HTTP Status Codes Used

```
200 OK               — Successful GET or PATCH
201 Created          — Successful POST (resource created)
204 No Content       — Successful DELETE
400 Bad Request      — Validation error, malformed input
401 Unauthorized     — Missing or invalid JWT
403 Forbidden        — Valid JWT but wrong role
404 Not Found        — Resource doesn't exist
409 Conflict         — Duplicate resource (slot taken, email exists)
415 Unsupported Media Type — Invalid file type on upload
422 Unprocessable    — Business logic violation (e.g., goal due date in past)
429 Too Many Requests — Rate limit exceeded
500 Internal Server  — Unexpected server error (never expose stack trace in production)
503 Service Unavailable — External service (Stripe/Twilio) temporarily down
```

### Response Format (ALL responses)

```javascript
// Success
{
  "success": true,
  "data": { ... },
  "message": "Appointment booked successfully",
  "statusCode": 201
}

// Error
{
  "success": false,
  "data": null,
  "message": "Slot unavailable — please select a different time",
  "statusCode": 409,
  "errors": [{ "field": "slotId", "message": "Conflict" }]  // optional, validation errors
}
```

### Production vs Development Error Detail

```javascript
// Global error handler
app.use((err, req, res, next) => {
  const statusCode = err.statusCode || 500;
  const message = process.env.NODE_ENV === 'production'
    ? (statusCode < 500 ? err.message : 'Internal server error')  // never expose stack in prod
    : err.message;

  // Log full error internally
  console.error(`[${new Date().toISOString()}] ${req.method} ${req.path} — ${err.message}`);

  res.status(statusCode).json({
    success: false,
    data: null,
    message,
    statusCode,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});
```

---

## 15. Testing Checklist

Map directly from Section 6 of Phase 3 document:

| Test Case | Description | Steps Available | Expected Status |
|---|---|---|---|
| TC-1 | Login with valid credentials + JWT issuance + role isolation | Section 6.1 Table 6.1 | Pass |
| TC-2 | New patient registration + email verification | Section 6.1 Table 6.2 | Pass |
| TC-3 | Book appointment with online Stripe payment | Section 6.1 Table 6.3 | Pass |
| TC-4 | Upload encrypted record + patient read-only + admin 403 | Section 6.1 Table 6.4 | Pass |
| TC-5 | Assign goal + patient completes + points awarded | Section 6.1 Table 6.5 | Pass |
| TC-6 | Automated email + SMS notification dispatch | Section 6.1 Table 6.6 | Pass |
| TC-7 | Payment failure — no orphaned appointment record | Section 6.1 Table 6.7 | Pass |
| TC-8 | Admin verifies therapist + assigns subscription | Section 6.1 Table 6.8 | Pass |
| TC-9 | AI context-aware response + guardrail (DEFERRED) | Section 6.1 Table 6.9 | Deferred to AI phase |

### Additional Security Tests (Not in Document — Required)

- [ ] JWT tampered → 401
- [ ] Expired JWT → 401  
- [ ] Patient accessing another patient's records → 403
- [ ] Therapist accessing admin routes → 403
- [ ] Admin accessing `/api/records/*` → 403 (CRITICAL)
- [ ] NoSQL injection in login email field → safe
- [ ] XSS in goal description field → sanitized
- [ ] File upload with `.exe` extension → 415
- [ ] File upload exceeding 10MB → 413
- [ ] Stripe webhook without signature → 400
- [ ] 11th login attempt within 15 minutes → 429
- [ ] Presigned S3 URL after 15 minutes → expired

---

## Summary: UI Screens vs Backend

| Portal | Screens Total | Backend Complete | AI Deferred | Static Only |
|---|---|---|---|---|
| Public/Guest | 11 screens | 3 (Login, Register, Contact/Newsletter) | 0 | 8 |
| Patient Portal | 9 screens | 8 (Dashboard, Goals, Progress, Appointments, Reports, Profile, Help, Mood) | 1 (Conversations) | 0 |
| Therapist Portal | 8 screens | 8 (Dashboard, Appointments, Clients, Services, Subscription, Payments, Profile, Setup) | 0 | 0 |
| Admin Panel | 9 screens | 8 (Dashboard, Doctors, Patients, Subscriptions, Revenue, Send Credentials, Support, Profile) | 0 | 1 (About Benzi) |
| **TOTAL** | **37 screens** | **27 screens** | **1 screen** | **9 screens** |

> The AI Virtual Assistant (Conversations screen) is the ONLY screen that requires the AI module. All 36 other screens can be fully backed by the Node.js/Express/MongoDB backend described in this document.

---

*Document generated from DTS Phase 3 — BENZI.AI — F25CS186 — University of Central Punjab*  
*Backend implementation by: Sameed Saeed (Backend/AI) | Context document: May 2026*
