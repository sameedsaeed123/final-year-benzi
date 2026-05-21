# PDF Redaction System - Testing Guide

## Prerequisites
- Backend server running on port 5000
- Frontend server running on port 5173
- At least one patient account
- At least one therapist account
- Patient and therapist must be linked (patient has booked an appointment with therapist)

## Test Scenario 1: Basic Redaction Flow

### Step 1: Upload a PDF as Patient
1. Log in as a **patient**
2. Navigate to **Reports** page
3. Click **"Upload Report"**
4. Select a PDF file that contains:
   - Your name (e.g., "John Doe")
   - Your email address
   - Your phone number
   - An address
5. Add a title like "Medical Report Jan 2026"
6. Click **"Upload"**
7. ✅ **Expected**: Report appears in the table with status "Not Reviewed"

### Step 2: Enable Anonymous Mode
1. Still on the Reports page, find the **"Anonymous Mode"** banner at the top
2. Click **"Enable Anonymous"**
3. ✅ **Expected**: 
   - Banner turns green
   - Shows "Anonymous Mode — Active"
   - Shows your anonymous alias (e.g., "Patient #A1B2")
   - A **"Retry Redaction"** button appears next to "Disable Anonymous"
4. Wait 2-3 seconds, then refresh the page
5. ✅ **Expected**: Your uploaded PDF should show in the table (redaction happens in background)

### Step 3: Check Therapist View
1. Log in as the **therapist** linked to this patient
2. Navigate to **Reports** page
3. Select the patient from the patient selector
4. ✅ **Expected**:
   - Patient appears with a 🔒 icon and anonymous alias (e.g., "Patient #A1B2")
   - Anonymous notice banner appears: "This patient has enabled Anonymous Mode..."
   - The uploaded report appears in the table

5. Check the **Actions** column for the report:
   - If redaction is complete: Shows **"Redacted PDF"** download button
   - If still processing: Shows **"⏳ Processing…"**
   - If file is not a PDF or scanned image: Shows **"🔒 Blocked"**

6. If "Redacted PDF" is available, click **Download**
7. Open the downloaded PDF
8. ✅ **Expected**:
   - PDF has a header: "! REDACTED DOCUMENT - Anonymous Mode Active"
   - Patient's name is replaced with `[NAME REDACTED]`
   - Email is replaced with `[EMAIL REDACTED]`
   - Phone is replaced with `[PHONE REDACTED]`
   - Address is replaced with `[ADDRESS REDACTED]`

### Step 4: Disable Anonymous Mode
1. Log back in as the **patient**
2. Navigate to **Reports** page
3. Click **"Disable Anonymous"** in the banner
4. ✅ **Expected**:
   - Banner turns back to cream color
   - Shows "Anonymous Mode — Off"
   - "Retry Redaction" button disappears

5. Log back in as the **therapist**
6. Navigate to **Reports** page
7. Select the same patient
8. ✅ **Expected**:
   - Patient now shows with their real name and profile image (no 🔒 icon)
   - Anonymous notice banner is gone
   - Download button shows **"Download"** instead of "Redacted PDF"
   - Clicking download gives the **original PDF** (not redacted)

---

## Test Scenario 2: Retry Stuck Redaction

### Step 1: Simulate Stuck Record
This is hard to simulate without breaking the code, but if you have records stuck in "PROCESSING" status:

1. Log in as **patient**
2. Navigate to **Reports** page
3. Enable **Anonymous Mode** if not already enabled
4. Look for any reports that show "⏳ Processing…" in the therapist view for more than 10 seconds

### Step 2: Trigger Retry
1. On the patient Reports page, click **"Retry Redaction"** button in the anonymous mode banner
2. ✅ **Expected**:
   - Button shows "Retrying…" with spinning icon
   - After 1 second, reports table reloads
   - Check server logs (backend terminal) for redaction progress:
     ```
     [recordService] Starting redaction for record 67a1b2c3d4e5f6...
     [recordService] Redaction complete for record 67a1b2c3d4e5f6 → /api/files/records/redacted_abc123.pdf
     ```

3. Log in as **therapist** and check the report
4. ✅ **Expected**: Download button now shows "Redacted PDF" (no longer stuck)

---

## Test Scenario 3: Non-PDF Files

### Step 1: Upload a Word Document
1. Log in as **patient**
2. Navigate to **Reports** page
3. Enable **Anonymous Mode**
4. Upload a `.docx` file
5. ✅ **Expected**: Upload succeeds

### Step 2: Check Therapist View
1. Log in as **therapist**
2. Navigate to **Reports** page
3. Select the patient
4. ✅ **Expected**:
   - Report shows in the table
   - Actions column shows **"🔒 Blocked"** (not "Redacted PDF")
   - Tooltip says: "This file type cannot be redacted. Download blocked for patient privacy."

### Step 3: Upload a Scanned PDF (Image-Only)
1. Log in as **patient**
2. Upload a PDF that is a scanned image (no text layer)
3. ✅ **Expected**: Upload succeeds

4. Log in as **therapist**
5. Check the report
6. ✅ **Expected**:
   - Actions column shows **"🔒 Blocked"**
   - Redaction status is `NOT_APPLICABLE` (cannot extract text from scanned images)

---

## Test Scenario 4: Multiple Reports

### Step 1: Upload Multiple PDFs
1. Log in as **patient**
2. Upload 3 different PDF files (with your name/email/phone in them)
3. Enable **Anonymous Mode**
4. Wait 5 seconds, then refresh the page

### Step 2: Check All Reports
1. Log in as **therapist**
2. Navigate to **Reports** page
3. Select the patient
4. ✅ **Expected**:
   - All 3 reports appear in the table
   - Each report shows either "Redacted PDF" or "⏳ Processing…"
   - Eventually all should show "Redacted PDF" (may take 10-20 seconds for 3 files)

5. Download each redacted PDF
6. ✅ **Expected**: All PDFs have patient name/email/phone redacted

---

## Test Scenario 5: Therapist Upload for Anonymous Patient

### Step 1: Therapist Uploads Report
1. Log in as **therapist**
2. Navigate to **Reports** page
3. Click **"Upload Report"**
4. Select a patient who has **Anonymous Mode enabled** (shows 🔒 icon)
5. Upload a PDF file
6. ✅ **Expected**: Upload succeeds

### Step 2: Check Redaction
1. After upload, the report appears in the table
2. ✅ **Expected**:
   - If the PDF contains the patient's name/email/phone, it should be redacted
   - Download button shows "Redacted PDF" once processing is complete
   - Therapist cannot see the original file (patient privacy is protected)

---

## Test Scenario 6: Patient Feedback on Reports

### Step 1: Add Feedback
1. Log in as **patient**
2. Navigate to **Reports** page
3. Click the **message icon** (💬) next to any report
4. Add feedback like "This report is from my last checkup"
5. Click **"Save Feedback"**
6. ✅ **Expected**: Feedback is saved

### Step 2: Check Therapist View
1. Log in as **therapist**
2. Navigate to **Reports** page
3. Select the patient
4. Click **"Review"** on the report
5. ✅ **Expected**: 
   - Review modal opens
   - Patient feedback is NOT visible to therapist (it's for patient's own notes)
   - Therapist can add their own notes in "Notes for Patient" field

---

## Test Scenario 7: Review Status Workflow

### Step 1: Therapist Reviews Report
1. Log in as **therapist**
2. Navigate to **Reports** page
3. Select a patient
4. Click **"Review"** on a report
5. Change review status to **"Half Reviewed"**
6. Add notes: "Please bring this report to our next session"
7. Click **"Save Review"**
8. ✅ **Expected**: 
   - Review status badge updates to "Half Reviewed" (yellow/green)
   - Report stays in the table

### Step 2: Patient Sees Therapist Notes
1. Log in as **patient**
2. Navigate to **Reports** page
3. Scroll down to **"Therapist Notes on Your Reports"** section
4. ✅ **Expected**:
   - The reviewed report appears with therapist's notes
   - Notes are clearly visible: "Please bring this report to our next session"

---

## Debugging Tips

### Check Server Logs
If redaction is not working:
1. Open the backend terminal
2. Look for logs like:
   ```
   [recordService] Starting redaction for record 67a1b2c3d4e5f6...
   [recordService] Redaction complete for record 67a1b2c3d4e5f6 → /api/files/records/redacted_abc123.pdf
   ```
3. If you see errors:
   ```
   [recordService] Redaction failed for record 67a1b2c3d4e5f6 Error: ...
   [recordService] Stack trace: ...
   ```
   This tells you exactly what went wrong

### Check Database
If records are stuck in PROCESSING:
1. Connect to MongoDB
2. Query the `records` collection:
   ```javascript
   db.records.find({ redactionStatus: 'PROCESSING' })
   ```
3. If any records are stuck for more than 1 minute, use the "Retry Redaction" button

### Check File System
If redaction fails with "Original file not found":
1. Check if the file exists:
   ```bash
   ls -la benzi-server/uploads/records/
   ```
2. Verify the `fileName` in the database matches the actual file on disk

---

## Expected Behavior Summary

| Scenario | Patient View | Therapist View (Anonymous ON) | Therapist View (Anonymous OFF) |
|----------|--------------|-------------------------------|--------------------------------|
| PDF uploaded | Can download original | Can download redacted PDF | Can download original |
| Word doc uploaded | Can download original | 🔒 Blocked | Can download original |
| Scanned PDF uploaded | Can download original | 🔒 Blocked | Can download original |
| Redaction in progress | Can download original | ⏳ Processing… | Can download original |
| Redaction failed | Can download original | 🔒 Blocked | Can download original |

---

## Success Criteria

✅ All test scenarios pass without errors  
✅ Redaction completes within 10 seconds for a typical PDF  
✅ Therapist cannot see patient's real name/email/phone when anonymous mode is on  
✅ Therapist can download redacted PDFs when anonymous mode is on  
✅ Therapist can download original files when anonymous mode is off  
✅ Retry button successfully reprocesses stuck records  
✅ Non-PDF files are properly blocked (not downloadable by therapist when anonymous)  
✅ Server logs show clear progress and error messages  

---

## Known Limitations

1. **Scanned PDFs**: Cannot be redacted (no text layer). Therapist download is blocked entirely.
2. **Non-PDF files**: Cannot be redacted. Therapist download is blocked entirely when anonymous.
3. **Complex PDFs**: PDFs with embedded images, forms, or complex layouts are converted to plain text. Formatting is not preserved.
4. **Non-Latin Characters**: Characters outside the latin-1 charset (e.g., Arabic, Chinese) are replaced with `?` in the redacted PDF.
5. **Async Processing**: Redaction happens in the background. Large PDFs may take 10-20 seconds.

---

## Troubleshooting

### Problem: Redaction stuck in PROCESSING
**Solution**: Click "Retry Redaction" button on patient Reports page

### Problem: Therapist sees "🔒 Blocked" for a text PDF
**Solution**: 
1. Check if the PDF has a text layer (try copying text from it)
2. If it's a scanned image, redaction is not possible
3. If it has text, check server logs for errors

### Problem: Redacted PDF still shows patient name
**Solution**:
1. Check if the patient's name in the database matches the name in the PDF
2. The redaction uses the patient's `firstName` and `lastName` from the User model
3. If the PDF uses a nickname or different spelling, it won't be caught

### Problem: "Retry Redaction" button does nothing
**Solution**:
1. Check browser console for errors
2. Verify the retry endpoint is registered: `POST /api/records/anonymous/retry-redaction`
3. Check if you're logged in as a patient (not therapist)

---

## Next Steps After Testing

1. If all tests pass, mark Task 3 (Reports System + Anonymous Mode) as **DONE**
2. Move to Task 4: AI Context + Google Meet Integration (see `AI_CONTEXT_AND_INTEGRATION_PLAN.md`)
3. Consider adding:
   - Email notification when redaction completes
   - Progress bar for redaction status
   - Bulk redaction retry (retry all failed records at once)
   - OCR support for scanned PDFs (using Tesseract.js or similar)
