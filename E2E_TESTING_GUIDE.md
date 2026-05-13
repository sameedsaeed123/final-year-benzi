# End-to-End Testing Guide: Fresh User Onboarding & Appointment Flow

## Status Summary
✅ **All implementation complete and verified**
- Frontend build: Successful (no errors)
- Backend syntax: All files verified
- Model imports: PatientAiStats working
- Modal component: Fully integrated
- Gate status caching: Implemented in AuthContext
- Conflict detection: Logic in place

## Test Scenarios

### 1. Fresh Patient Registration → Restricted Navigation
**Objective:** Verify fresh patients see only "Book Appointment" + "Appointments" navigation

**Steps:**
1. Open frontend (typically http://localhost:3000)
2. Click "Register" or "Sign Up"
3. Fill patient details with new email (e.g., `test-patient-${Date.now()}@example.com`)
4. Submit registration
5. Verify you are redirected to `/doctors` page
6. Check left sidebar: Should show ONLY 2 items
   - 📅 Book Appointment
   - 📋 Appointments

**Expected Results:**
- ✅ Cannot see: Goals, Progress, Reports, Settings, Achievements, Community
- ✅ PatientSidebar conditionally renders based on `patientLinked === false`
- ✅ If user tries to navigate directly to `/patient-goals` → redirected back to `/doctors`

**Code Location:** [PatientSidebar.jsx](Fyp-To-Reduce-Mental-Health/src/components/PatientSidebar.jsx)

---

### 2. Doctor Selection & Modal Opening
**Objective:** Verify clicking a doctor card opens the booking modal

**Steps:**
1. (From fresh patient) Browse doctor list on `/doctors`
2. Click any doctor card → **Appointment Booking Modal** should open
3. Verify modal displays:
   - Doctor's profile picture, name, specialization
   - Date picker (defaults to today)
   - Location selector (Video Call / Office / Clinic)
   - Available slots section

**Expected Results:**
- ✅ Modal opens without navigation change
- ✅ Modal is prefilled with selected doctor's ID
- ✅ "Book Appointment" button is visible
- ✅ Date picker is functional

**Code Location:**
- Modal: [AppointmentBookingModal.jsx](Fyp-To-Reduce-Mental-Health/src/components/AppointmentBookingModal.jsx)
- Integration: [DoctorsPage.jsx](Fyp-To-Reduce-Mental-Health/src/pages/DoctorsPage.jsx#L307-L312)

---

### 3. Real-Time Slot Loading
**Objective:** Verify slots load dynamically based on selected date and therapist availability

**Steps:**
1. (From modal open) Change the date in date picker
2. Observe "Loading slots…" message briefly
3. Verify available time slots appear (e.g., 09:00-10:00, 10:00-11:00, etc.)
4. Try dates with no availability → should show "No available slots for this date"

**Expected Results:**
- ✅ Slots load via GET `/appointments/availability/:therapistId?date=YYYY-MM-DD&durationMinutes=60`
- ✅ Slots are disabled if already booked (visual feedback)
- ✅ Slot selection works (button highlights when clicked)

**Code Location:** [AppointmentBookingModal.jsx](Fyp-To-Reduce-Mental-Health/src/components/AppointmentBookingModal.jsx#L24-L57)

---

### 4. Appointment Booking & Conflict Validation
**Objective:** Verify booking succeeds and conflict detection prevents double-booking

**Test 4A: Successful Single Booking**
1. (From modal with slot selected) Click "Confirm Appointment"
2. Modal should close
3. Success message should appear (check top of page)
4. Verify appointment appears in `/patient-appointments`

**Expected Results:**
- ✅ POST `/appointments` succeeds with status PENDING
- ✅ Appointment record created in database
- ✅ Patient linked to therapist (stored in `Patient.assignedTherapistUserId`)

**Test 4B: Conflict Detection (Same Slot, Different Browser)**
1. Open two browser windows/incognito tabs
2. Patient A: Navigate to doctor booking modal, select slot 10:00-11:00
3. Patient B: Navigate to same doctor, select same slot 10:00-11:00
4. Patient A: Click "Confirm Appointment" → Should succeed
5. Patient B: Click "Confirm Appointment" → Should show error: "This slot was just booked. Please select another time"
6. Verify slots refresh for Patient B showing updated availability

**Expected Results:**
- ✅ Pre-booking validation re-checks slot freshness
- ✅ Conflict detection prevents double-booking
- ✅ Overlapping time windows are detected: `(aStart < bEnd) && (aEnd > bStart)`

**Code Location:**
- Backend conflict logic: [appointmentMutationService.js](benzi-server/src/services/appointmentMutationService.js#L51-L75)
- Frontend pre-booking check: [AppointmentBookingModal.jsx](Fyp-To-Reduce-Mental-Health/src/components/AppointmentBookingModal.jsx#L63-L76)

---

### 5. Gate Status Refresh & Dashboard Unlock
**Objective:** Verify dashboard unlocks (full navigation) after first successful appointment

**Steps:**
1. (Fresh patient who just booked first appointment)
2. Verify appointment success modal closes
3. Check left sidebar → Should now show FULL navigation (8 items):
   - 📅 Book Appointment
   - 📋 Appointments
   - 🎯 Goals
   - 📈 Progress
   - 📊 Reports
   - ⚙️ Settings
   - 🏆 Achievements
   - 👥 Community

**Expected Results:**
- ✅ `patientLinked` state changes from `false` to `true`
- ✅ Full sidebar navigation appears automatically
- ✅ User can now access all dashboard pages
- ✅ `/patient-goals`, `/patient-progress`, `/patient-reports` no longer redirect to `/doctors`

**Code Location:**
- Gate status refresh: [AuthContext.jsx](Fyp-To-Reduce-Mental-Health/src/context/AuthContext.jsx#L30-L50)
- Trigger on booking: [DoctorsPage.jsx](Fyp-To-Reduce-Mental-Health/src/pages/DoctorsPage.jsx#L311) / [PatientAppointmentsPage.jsx](Fyp-To-Reduce-Mental-Health/src/pages/patient/PatientAppointmentsPage.jsx)
- Sidebar conditional: [PatientSidebar.jsx](Fyp-To-Reduce-Mental-Health/src/components/PatientSidebar.jsx)

---

### 6. Single Therapist Assignment
**Objective:** Verify patient can only book with one assigned therapist

**Steps:**
1. (Patient who has already booked Therapist A)
2. Navigate to doctors page and try to select Therapist B
3. Attempt to book an appointment with Therapist B

**Expected Results:**
- ✅ Backend returns 403 Forbidden: "You can only book appointments with your assigned therapist"
- ✅ Frontend should show this error in modal
- ✅ Patient cannot override or select different therapist

**Code Location:**
- Backend enforcement: [appointmentMutationService.js](benzi-server/src/services/appointmentMutationService.js#L52-57)
- Controller gate: [appointmentController.js](benzi-server/src/controllers/appointmentController.js#L37-50)

---

### 7. Fresh User AI Stats (DB Persistence)
**Objective:** Verify dashboard stats load from database with fresh-user defaults

**Steps:**
1. (Fresh patient, logged in, first time viewing dashboard)
2. Navigate to any dashboard page (e.g., Patient Goals, Progress)
3. Verify displayed stats show:
   - Task Score: 0
   - Weekly progress: All 0s
   - Mental Health progress bar: 0%
   - Self Care progress bar: 0%
   - Therapy progress bar: 0%
   - Monthly report: All months showing 0 weekly/monthly/yearly

**Expected Results:**
- ✅ Stats are fetched from `PatientAiStats` MongoDB model
- ✅ New `PatientAiStats` document auto-created on first access if missing
- ✅ All default values set to 0 (not hardcoded in frontend)
- ✅ Backend calls: GET `/patients/dashboard` returns data from DB

**Code Location:**
- DB Model: [PatientAiStats.js](benzi-server/src/models/PatientAiStats.js)
- Service logic: [patientDashboardService.js](benzi-server/src/services/patientDashboardService.js#L15-30)

---

### 8. Therapist Limited Navigation (If Applicable)
**Objective:** Verify therapists without appointments also see limited navigation

**Steps:**
1. Register as new therapist
2. Check sidebar → Should show ONLY 2 items:
   - 📅 Availability
   - 📋 Appointments
3. Accept or complete a first appointment
4. Check sidebar → Should show FULL navigation (8 items)

**Expected Results:**
- ✅ `therapistHasAppointments` state initially `false`
- ✅ Limited nav shows until first appointment
- ✅ After first appointment, full nav appears

**Code Location:** [TherapistSidebar.jsx](Fyp-To-Reduce-Mental-Health/src/components/TherapistSidebar.jsx)

---

## Integration Tests

### Test Suite: Complete Fresh User Journey
```
START → Register as Patient
  ✓ Fresh User Created
  ✓ patientLinked = false
  ✓ Limited sidebar (2 items)
  
→ Navigate to /doctors
  ✓ Doctor list loads
  ✓ Can see all therapists
  ✓ "Join as Doctor" hidden for patient
  
→ Select doctor, open modal
  ✓ Modal opens prefilled
  ✓ Slots load based on date
  
→ Select slot & confirm
  ✓ Pre-booking conflict check passes
  ✓ POST /appointments succeeds
  ✓ Appointment created in DB
  
→ Gate status refreshes
  ✓ patientLinked = true
  ✓ Full sidebar (8 items) appears
  
→ Navigate to dashboard
  ✓ Can access /patient-goals
  ✓ Can access /patient-progress
  ✓ Dashboard stats loaded from DB
  
→ Try booking therapist B
  ✓ GET 403: "Can only book with assigned therapist"
  
END → Onboarding complete ✓
```

---

## Debug Checklist

### If fresh patient NOT restricted to `/doctors`:
- [ ] Check RoleRoute.jsx: `patientLinked === false` condition
- [ ] Verify AuthContext calling `refreshGateStatus()` on login
- [ ] Check browser console for API errors loading gate status

### If modal NOT opening:
- [ ] Verify AppointmentBookingModal.jsx imported in DoctorsPage.jsx
- [ ] Check `<DoctorCard onBook={openBooking} />` wiring
- [ ] Verify modal `open` prop passed correctly

### If slots NOT loading:
- [ ] Check GET `/appointments/availability/:id` endpoint exists
- [ ] Verify therapist ID being passed correctly (doctor.id)
- [ ] Check browser network tab for API response
- [ ] Ensure date format is YYYY-MM-DD

### If conflict NOT prevented:
- [ ] Verify appointmentMutationService.js has conflict logic
- [ ] Check overlap formula: `s < end && e > start`
- [ ] Verify searching only PENDING/CONFIRMED appointments
- [ ] Test with console logs if needed

### If dashboard NOT unlocking:
- [ ] Verify `refreshGateStatus()` called after booking
- [ ] Check PatientSidebar.jsx using `patientLinked` from useAuth()
- [ ] Verify state updates propagate via AuthContext
- [ ] Check browser cache/reload if UI doesn't update

### If AI stats showing hardcoded zeros:
- [ ] Verify PatientAiStats.js model exists and has defaults
- [ ] Check patientDashboardService.js calling `.findOne()` or `.create()`
- [ ] Verify MongoDB has PatientAiStats collection
- [ ] Check /patients/dashboard endpoint returning DB data

---

## Success Criteria
- [ ] Fresh patient registration works (no console errors)
- [ ] Limited sidebar visible (2 items only)
- [ ] Modal booking flow works (open → select date → select slot → book)
- [ ] Conflict detection prevents double-booking
- [ ] Dashboard unlocks after first appointment (full nav appears)
- [ ] Single therapist assignment enforced (403 on other doctors)
- [ ] AI stats load from DB (not hardcoded zeros)
- [ ] All navigation works smoothly without page reloads

---

## Performance Notes
- Gate status cached in AuthContext (refreshed only on login/booking, not every render)
- Modal uses `useMemo` for slot key lookup → O(1) slot selection
- Appointment conflict check limited to same day (optimized query)
- PatientAiStats auto-created only on first dashboard access

---

## Known Limitations (Phase 1)
- AI stats are all zeros (future AI scoring will update values)
- Email notifications not yet implemented
- Video call integration pending
- Payment/subscription gating in separate phase

---

**Last Updated:** 13 May 2026
**Status:** ✅ Ready for Testing
