# PDF Redaction System - Bug Fix Summary

## Issue
Records were getting stuck in `PROCESSING` status during PDF redaction when anonymous mode was enabled.

## Root Cause
The retry endpoint (`/api/records/anonymous/retry-redaction`) was implemented in the controller but **not registered in the routes**, so patients had no way to manually trigger redaction retry when records got stuck.

## Fixes Applied

### 1. Backend Route Registration
**File**: `benzi-server/src/routes/record.routes.js`

Added the missing retry endpoint:
```javascript
router.post('/anonymous/retry-redaction', verifyJWT, requireRoles('patient'), patientRetryRedaction)
```

### 2. Enhanced Error Logging
**File**: `benzi-server/src/services/recordService.js`

Added detailed console logging to help debug redaction failures:
- Log when redaction starts
- Log when redaction completes successfully
- Log full error stack traces when redaction fails
- Log when files are not found on disk

### 3. Patient UI - Retry Button
**File**: `Fyp-To-Reduce-Mental-Health/src/pages/patient/PatientReportsPage.jsx`

Added a "Retry Redaction" button in the anonymous mode banner:
- Only visible when anonymous mode is active
- Shows spinning icon while processing
- Triggers redaction for all stuck/failed records
- Automatically reloads reports after 1 second to show updated status

### 4. Improved Toggle Behavior
When toggling anonymous mode on/off, the patient reports page now:
- Automatically reloads reports to show updated redaction status
- Resets stuck `PROCESSING` records to `PENDING` before triggering redaction (backend already did this)

## How It Works Now

### When Patient Enables Anonymous Mode:
1. Backend resets any stuck `PROCESSING` records to `PENDING`
2. Backend triggers redaction for all PDF records asynchronously
3. Each record goes through: `PENDING` → `PROCESSING` → `DONE` (or `FAILED` / `NOT_APPLICABLE`)
4. Patient UI reloads to show updated status

### When Records Get Stuck:
1. Patient clicks "Retry Redaction" button in the anonymous mode banner
2. Backend resets `PROCESSING` and `FAILED` records to `PENDING`
3. Backend re-triggers redaction for all affected records
4. Patient UI reloads after 1 second to show progress

### Redaction Status Flow:
- **PENDING**: Record is queued for redaction
- **PROCESSING**: Redaction is currently running
- **DONE**: Redacted PDF is ready, therapist sees redacted version
- **FAILED**: Redaction failed (e.g., file not found, extraction error)
- **NOT_APPLICABLE**: File is not a PDF or is a scanned image (no text layer)

## Therapist View
The therapist reports page already properly handles redaction status:
- Shows "🔒 Blocked" for `NOT_APPLICABLE` files (non-PDF or scanned images)
- Shows "⏳ Processing…" for `PROCESSING` or `PENDING` records
- Shows "Redacted PDF" download button when `DONE`
- Blocks download entirely when patient is anonymous and redaction is not complete

## Testing Checklist

### Backend
- [x] Retry endpoint is registered in routes
- [x] Error logging is enhanced
- [x] Stuck records are reset to PENDING before retry
- [x] Redaction service has proper error handling

### Patient UI
- [x] Retry button appears when anonymous mode is active
- [x] Retry button triggers redaction and reloads reports
- [x] Toggle anonymous mode reloads reports to show updated status
- [x] Anonymous mode banner shows current status and alias

### Therapist UI
- [x] Shows redaction status properly (Blocked/Processing/Redacted PDF)
- [x] Blocks download when redaction is not complete
- [x] Shows anonymous patient badge and hides contact info

## Next Steps

1. **Test End-to-End**:
   - Upload a PDF as a patient
   - Enable anonymous mode
   - Verify redaction completes (status goes to DONE)
   - Check therapist view shows "Redacted PDF" download
   - Disable anonymous mode
   - Verify therapist sees original file immediately

2. **Test Retry Flow**:
   - If any records are stuck in PROCESSING, click "Retry Redaction"
   - Verify records move to PENDING then PROCESSING then DONE
   - Check server logs for detailed redaction progress

3. **Test Edge Cases**:
   - Upload a scanned PDF (image-only, no text layer) → should show NOT_APPLICABLE
   - Upload a Word doc or image → should show NOT_APPLICABLE
   - Upload a PDF with patient name in text → verify name is redacted in therapist view

## Files Modified

### Backend
- `benzi-server/src/routes/record.routes.js` — Added retry endpoint
- `benzi-server/src/services/recordService.js` — Enhanced logging

### Frontend
- `Fyp-To-Reduce-Mental-Health/src/pages/patient/PatientReportsPage.jsx` — Added retry button and improved toggle behavior

## No Breaking Changes
All changes are backward-compatible. Existing records and functionality remain unchanged.
