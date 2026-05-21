# BENZI.AI — AI Context Injection & Integration Planning Guide

> **Date:** May 2026  
> **Author:** Kiro (AI Development Assistant)  
> **Purpose:** Future implementation roadmap for (1) injecting patient report PDFs as context into the AI prompt, and (2) integrating Google Meet + Google Calendar for online appointment management.

---

## PART 1 — AI Context Injection from Patient Reports (PDF → Prompt)

### 1.1 The Goal

When a patient chats with the Benzi AI assistant, the AI should have access to the patient's uploaded medical reports and session notes as context. This allows the AI to give personalised, clinically-informed responses instead of generic answers.

**Example:** Patient uploads a "Stress Assessment Report" PDF. When they ask the AI "What should I focus on this week?", the AI reads the report and responds with specific recommendations based on the patient's actual clinical data.

---

### 1.2 Architecture Overview

```
Patient uploads PDF
        ↓
Backend stores file on disk (currently) / S3 (future)
        ↓
Background job: PDF → text extraction (pdf-parse / pdfjs-dist)
        ↓
Text chunked into ~500-token segments
        ↓
Each chunk embedded via OpenAI text-embedding-3-small (or local model)
        ↓
Embeddings stored in MongoDB (vector field) or Pinecone / Qdrant
        ↓
At chat time: patient query → embed query → cosine similarity search
        ↓
Top-K relevant chunks retrieved
        ↓
Chunks injected into system prompt as context
        ↓
LLM (GPT-4o / Llama 3) generates response with clinical context
```

---

### 1.3 Step-by-Step Implementation Plan

#### Step 1 — PDF Text Extraction (Backend)

**When:** Immediately after a record is uploaded (post-upload hook in `recordService.js`)

**Package:** `pdf-parse` (Node.js)
```bash
npm install pdf-parse
```

**Code location:** `benzi-server/src/services/pdfExtractService.js`

```javascript
import pdfParse from 'pdf-parse'
import fs from 'fs'

export async function extractTextFromPdf(filePath) {
  const buffer = fs.readFileSync(filePath)
  const data = await pdfParse(buffer)
  return data.text // raw text string
}
```

**Add to `uploadRecord()` in `recordService.js`:**
```javascript
// After Record.create(...)
if (file.mimetype === 'application/pdf') {
  const localPath = path.join(process.cwd(), 'uploads', 'records', file.filename)
  const text = await extractTextFromPdf(localPath)
  // Store extracted text on the record for embedding
  await Record.findByIdAndUpdate(doc._id, { extractedText: text })
  // Trigger embedding job (async, don't await)
  void embedRecordText(String(doc._id), text, String(patientUserId))
}
```

---

#### Step 2 — Text Chunking

**Code location:** `benzi-server/src/services/chunkService.js`

```javascript
export function chunkText(text, maxTokens = 500) {
  // Rough approximation: 1 token ≈ 4 characters
  const chunkSize = maxTokens * 4
  const chunks = []
  for (let i = 0; i < text.length; i += chunkSize) {
    const chunk = text.slice(i, i + chunkSize).trim()
    if (chunk.length > 50) chunks.push(chunk) // skip tiny fragments
  }
  return chunks
}
```

---

#### Step 3 — Embedding Storage

**Option A (Simple — MongoDB vector field):**

Add to `Record` model:
```javascript
extractedText: { type: String, default: '' },
textChunks: [{
  chunkIndex: Number,
  text: String,
  embedding: [Number],  // 1536-dim for text-embedding-3-small
}]
```

MongoDB Atlas supports vector search natively via `$vectorSearch` aggregation stage (Atlas Search index required).

**Option B (Recommended for scale — Pinecone or Qdrant):**

Each chunk becomes a vector with metadata:
```json
{
  "id": "record_<recordId>_chunk_<index>",
  "values": [0.023, -0.14, ...],  // 1536-dim embedding
  "metadata": {
    "patientUserId": "...",
    "recordId": "...",
    "recordTitle": "Stress Assessment",
    "chunkText": "Patient reports high anxiety levels...",
    "uploadedAt": "2026-01-15"
  }
}
```

---

#### Step 4 — Embedding Service

**Code location:** `benzi-server/src/services/embeddingService.js`

```javascript
import OpenAI from 'openai'

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY })

export async function embedText(text) {
  const response = await openai.embeddings.create({
    model: 'text-embedding-3-small',
    input: text,
  })
  return response.data[0].embedding // float[]
}

export async function embedRecordText(recordId, fullText, patientUserId) {
  const { chunkText } = await import('./chunkService.js')
  const chunks = chunkText(fullText)
  for (let i = 0; i < chunks.length; i++) {
    const embedding = await embedText(chunks[i])
    // Store in Pinecone or MongoDB
    await storeEmbedding({
      id: `record_${recordId}_chunk_${i}`,
      embedding,
      metadata: { patientUserId, recordId, chunkText: chunks[i] }
    })
  }
}
```

---

#### Step 5 — Context Retrieval at Chat Time

**Code location:** `benzi-server/src/services/contextRetrievalService.js`

```javascript
export async function retrieveRelevantContext(patientUserId, userQuery, topK = 5) {
  const queryEmbedding = await embedText(userQuery)
  
  // Query Pinecone / MongoDB vector search
  const results = await vectorSearch({
    vector: queryEmbedding,
    filter: { patientUserId },
    topK,
  })
  
  return results.map(r => r.metadata.chunkText).join('\n\n---\n\n')
}
```

---

#### Step 6 — Inject into AI Prompt

**In `aiChatService.js` (to be built):**

```javascript
export async function sendMessage(patientUserId, userMessage, sessionId) {
  // 1. Retrieve relevant context from patient's reports
  const context = await retrieveRelevantContext(patientUserId, userMessage)
  
  // 2. Build system prompt
  const systemPrompt = `
You are Benzi, a compassionate AI mental health assistant.
You are speaking with a patient. Use the following clinical context from their reports to personalise your response.
If the context is not relevant to the question, ignore it and respond generally.

PATIENT CLINICAL CONTEXT:
${context || 'No reports available yet.'}

IMPORTANT RULES:
- Never diagnose. Always recommend consulting their therapist for clinical decisions.
- Be empathetic, warm, and supportive.
- If the patient seems in crisis, direct them to emergency services immediately.
- Do not reveal that you are reading their reports unless they ask.
  `.trim()
  
  // 3. Call LLM
  const response = await openai.chat.completions.create({
    model: 'gpt-4o',
    messages: [
      { role: 'system', content: systemPrompt },
      { role: 'user', content: userMessage },
    ],
  })
  
  return response.choices[0].message.content
}
```

---

### 1.4 Anonymous Mode Consideration for AI Context

When a patient is in anonymous mode:
- Their reports are still embedded and retrievable by the AI (the AI serves the patient, not the therapist)
- The AI should NOT include the patient's real name in responses
- Add a check in the system prompt:

```javascript
const anonStatus = await getAnonymousStatus(patientUserId)
const nameInstruction = anonStatus.anonymousModeEnabled
  ? `Do not use the patient's real name. Refer to them as "${anonStatus.anonymousAlias}" or "you".`
  : ''
```

---

### 1.5 Environment Variables Needed

```bash
# Add to benzi-server/.env
OPENAI_API_KEY=sk-...
PINECONE_API_KEY=...          # if using Pinecone
PINECONE_INDEX_NAME=benzi-records
PINECONE_ENVIRONMENT=us-east-1-aws
```

---

### 1.6 Packages to Install

```bash
cd benzi-server
npm install pdf-parse openai @pinecone-database/pinecone
```

---

### 1.7 Record Model Updates Needed

Add these fields to `Record.js`:
```javascript
extractedText: { type: String, default: '' },
embeddingStatus: { 
  type: String, 
  enum: ['PENDING', 'PROCESSING', 'DONE', 'FAILED', 'NOT_PDF'], 
  default: 'PENDING' 
},
embeddingError: { type: String, default: '' },
```

---

### 1.8 Implementation Priority

| Step | Task | Effort | Priority |
|------|------|--------|----------|
| 1 | PDF text extraction on upload | 2 hrs | 🔴 P0 |
| 2 | Text chunking service | 1 hr | 🔴 P0 |
| 3 | OpenAI embedding integration | 3 hrs | 🔴 P0 |
| 4 | MongoDB vector storage (simple) | 2 hrs | 🟡 P1 |
| 5 | Context retrieval service | 2 hrs | 🔴 P0 |
| 6 | AI chat service with context injection | 4 hrs | 🔴 P0 |
| 7 | Migrate to Pinecone for scale | 4 hrs | 🟢 P2 |
| 8 | Anonymous mode in AI prompt | 1 hr | 🟡 P1 |

**Total estimated effort:** ~19 hours

---

---

## PART 2 — Google Meet + Google Calendar Integration for Online Appointments

### 2.1 The Goal

When a therapist confirms an appointment with `location: 'online'`, automatically:
1. Create a Google Calendar event for both therapist and patient
2. Generate a Google Meet link attached to that event
3. Store the Meet link in the appointment record
4. Display the Meet link to both parties in their appointment views

---

### 2.2 Architecture Overview

```
Therapist confirms appointment (PATCH /appointments/:id → status: CONFIRMED)
        ↓
Backend detects location === 'online' && status changed to CONFIRMED
        ↓
Call Google Calendar API (service account or OAuth2)
        ↓
Create Calendar event with conferenceData (Google Meet)
        ↓
Google returns: { hangoutLink, conferenceId }
        ↓
Store in Appointment: { googleMeetLink, googleCalendarEventId }
        ↓
Frontend shows "Join Meeting" button in appointment row
```

---

### 2.3 Authentication Strategy

**Recommended: Google Service Account (server-to-server)**

This avoids requiring therapists to connect their Google account. The platform uses a single service account to create calendar events and invite both parties by email.

**Alternative: OAuth2 per therapist**
Each therapist connects their Google Calendar. More complex but events appear in their personal calendar.

For a student FYP, **Service Account is strongly recommended** — simpler setup, no OAuth flow needed.

---

### 2.4 Setup Steps

#### Step 1 — Google Cloud Console Setup

1. Go to [console.cloud.google.com](https://console.cloud.google.com)
2. Create a new project: `benzi-ai`
3. Enable APIs:
   - **Google Calendar API**
   - **Google Meet API** (part of Calendar — conferenceData)
4. Create a **Service Account**:
   - IAM & Admin → Service Accounts → Create
   - Name: `benzi-calendar-service`
   - Download JSON key file → store as `benzi-server/credentials/google-service-account.json`
5. In Google Workspace (if using): Share the service account email with domain-wide delegation

#### Step 2 — Install SDK

```bash
cd benzi-server
npm install googleapis
```

#### Step 3 — Calendar Service

**Code location:** `benzi-server/src/services/googleCalendarService.js`

```javascript
import { google } from 'googleapis'
import path from 'path'

const SCOPES = ['https://www.googleapis.com/auth/calendar']
const CALENDAR_ID = process.env.GOOGLE_CALENDAR_ID || 'primary'

function getAuth() {
  const keyFile = path.join(process.cwd(), 'credentials', 'google-service-account.json')
  return new google.auth.GoogleAuth({ keyFile, scopes: SCOPES })
}

export async function createMeetingEvent({ 
  title, 
  startIso,      // e.g. "2026-06-15T10:00:00+05:00"
  endIso,        // e.g. "2026-06-15T11:00:00+05:00"
  therapistEmail, 
  patientEmail,
  description = ''
}) {
  const auth = getAuth()
  const calendar = google.calendar({ version: 'v3', auth })
  
  const event = {
    summary: title,
    description,
    start: { dateTime: startIso, timeZone: 'Asia/Karachi' },
    end: { dateTime: endIso, timeZone: 'Asia/Karachi' },
    attendees: [
      { email: therapistEmail },
      { email: patientEmail },
    ],
    conferenceData: {
      createRequest: {
        requestId: `benzi-${Date.now()}`,
        conferenceSolutionKey: { type: 'hangoutsMeet' },
      },
    },
    reminders: {
      useDefault: false,
      overrides: [
        { method: 'email', minutes: 24 * 60 },  // 24h before
        { method: 'popup', minutes: 30 },         // 30min before
      ],
    },
  }
  
  const response = await calendar.events.insert({
    calendarId: CALENDAR_ID,
    resource: event,
    conferenceDataVersion: 1,  // Required for Meet link generation
    sendUpdates: 'all',        // Sends email invites to attendees
  })
  
  return {
    googleCalendarEventId: response.data.id,
    googleMeetLink: response.data.hangoutLink,
    htmlLink: response.data.htmlLink,
  }
}

export async function deleteMeetingEvent(eventId) {
  const auth = getAuth()
  const calendar = google.calendar({ version: 'v3', auth })
  await calendar.events.delete({ calendarId: CALENDAR_ID, eventId })
}
```

---

#### Step 4 — Update Appointment Model

Add to `Appointment.js`:
```javascript
googleCalendarEventId: { type: String, default: '' },
googleMeetLink: { type: String, default: '' },
```

---

#### Step 5 — Hook into Appointment Confirmation

In `appointmentMutationService.js`, inside `updateAppointmentByTherapist()`, after `doc.save()`:

```javascript
// Auto-create Google Meet when confirming an online appointment
if (body.status === 'CONFIRMED' && doc.location === 'online' && !doc.googleMeetLink) {
  try {
    const [patientUser, therapistUser] = await Promise.all([
      User.findById(doc.patientUserId).select('email firstName lastName').lean(),
      User.findById(doc.therapistUserId).select('email firstName lastName').lean(),
    ])
    
    const startIso = doc.date.toISOString()
    const endDate = new Date(doc.date.getTime() + doc.durationMinutes * 60 * 1000)
    const endIso = endDate.toISOString()
    
    const { googleCalendarEventId, googleMeetLink } = await createMeetingEvent({
      title: `Benzi Therapy Session — ${therapistUser?.firstName} & ${patientUser?.firstName}`,
      startIso,
      endIso,
      therapistEmail: therapistUser?.email,
      patientEmail: patientUser?.email,
      description: `Online therapy session via Benzi.AI platform.`,
    })
    
    doc.googleCalendarEventId = googleCalendarEventId
    doc.googleMeetLink = googleMeetLink
    await doc.save()
  } catch (err) {
    // Non-fatal — log but don't fail the confirmation
    console.error('Google Meet creation failed:', err.message)
  }
}
```

---

#### Step 6 — Expose Meet Link in API Responses

Update `listAppointmentsForTherapist()` and `listAppointmentsForPatient()` in `appointmentService.js`:

```javascript
return list.map((a) => ({
  // ... existing fields
  googleMeetLink: a.googleMeetLink || '',
  hasOnlineMeeting: !!(a.googleMeetLink && a.location === 'online'),
}))
```

---

#### Step 7 — Frontend: "Join Meeting" Button

In `PatientAppointmentsPage.jsx` and `TherapistAppointmentsPage.jsx`, add to the action column:

```jsx
{item.hasOnlineMeeting && (
  <a
    href={item.googleMeetLink}
    target="_blank"
    rel="noreferrer"
    className="inline-flex items-center gap-1.5 rounded-full bg-[#1a73e8] text-white px-3 py-1.5 text-[12px] font-semibold hover:bg-[#1557b0]"
  >
    <Video size={13} /> Join Meet
  </a>
)}
```

---

### 2.5 Environment Variables Needed

```bash
# Add to benzi-server/.env
GOOGLE_CALENDAR_ID=primary
# OR a specific shared calendar:
# GOOGLE_CALENDAR_ID=benzi-sessions@yourdomain.com

# Service account key path (relative to benzi-server/)
GOOGLE_SERVICE_ACCOUNT_KEY_PATH=credentials/google-service-account.json
```

---

### 2.6 Cancellation Handling

When an appointment is cancelled, delete the Google Calendar event:

```javascript
if (body.status === 'CANCELLED' && doc.googleCalendarEventId) {
  try {
    await deleteMeetingEvent(doc.googleCalendarEventId)
    doc.googleCalendarEventId = ''
    doc.googleMeetLink = ''
  } catch (err) {
    console.error('Google Calendar event deletion failed:', err.message)
  }
}
```

---

### 2.7 Packages to Install

```bash
cd benzi-server
npm install googleapis
```

---

### 2.8 Implementation Priority

| Step | Task | Effort | Priority |
|------|------|--------|----------|
| 1 | Google Cloud project + service account setup | 1 hr | 🔴 P0 |
| 2 | `googleCalendarService.js` | 2 hrs | 🔴 P0 |
| 3 | Update Appointment model | 30 min | 🔴 P0 |
| 4 | Hook into appointment confirmation | 1 hr | 🔴 P0 |
| 5 | Expose Meet link in API responses | 30 min | 🔴 P0 |
| 6 | Frontend "Join Meet" button | 1 hr | 🔴 P0 |
| 7 | Cancellation cleanup | 30 min | 🟡 P1 |
| 8 | Rescheduling (update event) | 1 hr | 🟡 P1 |
| 9 | Per-therapist OAuth2 (optional upgrade) | 6 hrs | 🟢 P2 |

**Total estimated effort:** ~8–9 hours for core integration

---

---

## PART 3 — What's Already Built (Reports & Anonymous Mode)

### 3.1 Backend (Completed)

| File | Purpose |
|------|---------|
| `benzi-server/src/models/Record.js` | MongoDB model for reports — stores file path, type, review status, anonymous flag, therapist notes, patient feedback |
| `benzi-server/src/models/Patient.js` | Updated with `anonymousModeEnabled` + `anonymousAlias` fields |
| `benzi-server/src/middleware/recordUpload.js` | Multer middleware — accepts PDF, Word, JPEG, PNG, WebP up to 10 MB |
| `benzi-server/src/services/recordService.js` | Full CRUD + anonymous masking + name scrubbing from report text |
| `benzi-server/src/controllers/recordController.js` | HTTP handlers for all record operations |
| `benzi-server/src/routes/record.routes.js` | Routes registered at `/api/records/*` |

### 3.2 API Endpoints (Completed)

| Method | Route | Role | Purpose |
|--------|-------|------|---------|
| GET | `/api/records/patient/me` | Patient | List own reports |
| GET | `/api/records/anonymous/status` | Patient | Get anonymous mode status |
| POST | `/api/records/anonymous/toggle` | Patient | Enable/disable anonymous mode |
| POST | `/api/records/upload` | Patient + Therapist | Upload a report file |
| GET | `/api/records/therapist/patients` | Therapist | List linked patients (for upload dropdown) |
| GET | `/api/records/therapist/patient/:id` | Therapist | List reports for a specific patient (masked if anonymous) |
| PATCH | `/api/records/:id/review` | Therapist | Update review status + add notes |
| POST | `/api/records/:id/feedback` | Patient | Add patient feedback on a report |
| DELETE | `/api/records/:id` | Patient + Therapist | Soft delete a report |

### 3.3 Frontend (Completed)

| File | Purpose |
|------|---------|
| `PatientReportsPage.jsx` | Dynamic reports list, upload modal, delete, feedback, anonymous mode banner |
| `TherapistReportsPage.jsx` | Patient selector, reports per patient, upload for patient, review modal |
| `PatientProfilePage.jsx` | Anonymous mode toggle section added |
| `TherapistClientsPage.jsx` | Anonymous badge, hidden contact info for anonymous patients |
| `TherapistSidebar.jsx` | Reports nav item added |
| `App.jsx` | `/therapist-reports` route registered |

### 3.4 Anonymous Mode — How It Works

```
Patient enables anonymous mode in Profile
        ↓
Patient.anonymousModeEnabled = true
Patient.anonymousAlias = "Patient #A3F2" (auto-generated from userId)
        ↓
Therapist views Clients page:
  → Name shows as "Patient #A3F2"
  → Email/phone hidden ("Contact hidden")
  → Anonymous badge shown
        ↓
Therapist views Reports page:
  → Patient selector shows "🔒 Patient #A3F2"
  → Report titles/descriptions have real name scrubbed → "[REDACTED]"
  → Anonymous notice banner shown
        ↓
Appointment detail modal:
  → Patient name/email/phone hidden for therapist
  (TODO: update getAppointmentDetail to check anonymous status)
```

### 3.5 Next Steps for Reports

1. **S3 migration** — Move file storage from local disk to AWS S3 for production
2. **PDF text extraction** — Implement Step 1 from Part 1 above
3. **Embedding pipeline** — Steps 2–5 from Part 1
4. **AI chat integration** — Step 6 from Part 1
5. **Update `getAppointmentDetail`** — Mask patient name/email/phone in appointment detail modal when anonymous mode is on
6. **Appointment detail anonymous masking** — In `appointmentService.js → getAppointmentDetail()`, check `Patient.anonymousModeEnabled` and mask accordingly

---

## PART 4 — Quick Reference: All Remaining Backend Work

See `BACKEND_REMAINING_WORK.md` for the full list. The highest-priority items that unblock the AI context pipeline:

1. ✅ Records system — **DONE**
2. ✅ Anonymous mode — **DONE**  
3. 🔲 PDF text extraction + embedding — **Next**
4. 🔲 AI chat stubs (`/api/ai/chat`) — **Next**
5. 🔲 Google Meet integration — **Next**
6. 🔲 Notification service (appointment confirmation emails) — **High priority**
7. 🔲 Admin panel APIs — **High priority**

---

*Document maintained by Kiro. Update this file as features are implemented.*
