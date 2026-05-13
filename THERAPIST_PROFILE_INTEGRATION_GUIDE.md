# Therapist Profile Dynamic Fields - Quick Integration Guide

**Date:** 13 May 2026  
**Status:** ✅ Backend Complete  

---

## What Was Changed

### ✅ Made Dynamic (Database-Backed)

All therapist profile fields now pull from the database:

| Field | Now Dynamic | Can Edit | Shows On Card |
|---|---|---|---|
| **Location (City)** | ✅ Yes | ✅ Yes | ✅ Yes |
| **PMDS Verified Badge** | ✅ Yes (NEW) | ✅ Yes (NEW) | ✅ Yes (NEW) |
| **Specialization** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Qualification** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Experience (Years)** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Wait Time** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Reviews Count** | ✅ Yes | ❌ No (auto) | ✅ Yes |
| **Rating Stars** | ✅ Yes | ❌ No (auto) | ✅ Yes |
| **Profile Image** | ✅ Yes | ✅ Yes | ✅ Yes |
| **Bio/Description** | ✅ Yes | ✅ Yes | ❌ No (details only) |

---

## Files Modified (3 Backend Files)

### 1. `/benzi-server/src/models/Therapist.js`
**Added 2 new fields:**
```javascript
pmdsVerified: { type: Boolean, default: false },
verificationBadges: { type: [String], default: [], enum: ['PMDS', 'BOARD_CERTIFIED', 'LICENSED'] }
```

### 2. `/benzi-server/src/services/therapistProfileService.js`
**Updated 2 functions:**
- `getTherapistProfileForUser()` - Returns new badge fields
- `updateTherapistProfileForUser()` - Accepts & validates new fields

### 3. `/benzi-server/src/services/therapistDirectoryService.js`
**Updated directory listing:**
- Includes verification fields in therapist cards
- Displays PMDS badge in public directory

---

## API Endpoints (Ready to Use)

### 1. Get Therapist Profile
```bash
GET /therapist/profile

Response:
{
  therapist: {
    city: "Lahore",
    specializationTitle: "Psychiatrist",
    qualification: "MBBS, FCPS (Psychiatry)",
    experienceYears: 12,
    waitTimeLabel: "Under 15 Min",
    pmdsVerified: true,              ← NEW
    verificationBadges: ["PMDS"],    ← NEW
    avgRating: 4.8,
    reviewCount: 190,
    ...
  }
}
```

### 2. Update Therapist Profile
```bash
PUT /therapist/profile
{
  "city": "Lahore",
  "experienceYears": 12,
  "qualification": "MBBS, FCPS (Psychiatry)",
  "specializationTitle": "Psychiatrist",
  "waitTimeLabel": "Under 15 Min",
  "pmdsVerified": true,              ← NEW
  "verificationBadges": ["PMDS"],    ← NEW
  "bio": "..."
}
```

### 3. Get Therapist Directory
```bash
GET /therapists/directory

Response includes:
{
  therapists: [
    {
      name: "Dr. Faizan Ahmed",
      city: "Lahore",
      experienceYears: 12,
      pmdsVerified: true,            ← NEW
      verificationBadges: ["PMDS"],  ← NEW
      ...
    }
  ]
}
```

---

## Frontend Implementation (Example)

### Profile Card Display (from image)
```jsx
// Display verification badge on therapist card
<div className="therapist-card">
  <img src={therapist.image} />
  <h2>{therapist.name}</h2>
  
  {/* NEW: Show verification badge */}
  {therapist.pmdsVerified && (
    <span className="badge">✓ PMDS Verified</span>
  )}
  
  <p>{therapist.city}</p>
  <p>{therapist.specializationTitle}</p>
  <p>{therapist.qualification}</p>
  <p>⏱ {therapist.waitTime}</p>
  <p>✨ {therapist.experience}</p>
  <p>⭐ {therapist.avgRating} ({therapist.reviews} reviews)</p>
</div>
```

### Profile Edit Form (for therapists)
```jsx
// Allow therapist to edit profile
<form onSubmit={handleSave}>
  <input
    name="city"
    value={profile.city}
    onChange={handleChange}
    placeholder="City"
  />
  
  <input
    name="specialization"
    value={profile.specializationTitle}
    onChange={handleChange}
    placeholder="Specialization"
  />
  
  <input
    name="qualification"
    value={profile.qualification}
    onChange={handleChange}
    placeholder="Qualification"
  />
  
  <input
    name="experienceYears"
    type="number"
    value={profile.experienceYears}
    onChange={handleChange}
    placeholder="Years of Experience"
  />
  
  <input
    name="waitTimeLabel"
    value={profile.waitTimeLabel}
    onChange={handleChange}
    placeholder="Wait Time (e.g., Under 15 Min)"
  />
  
  {/* NEW: Verification fields */}
  <label>
    <input
      type="checkbox"
      checked={profile.pmdsVerified}
      onChange={(e) => handleChange({
        target: { name: 'pmdsVerified', value: e.target.checked }
      })}
    />
    PMDS Verified
  </label>
  
  <button type="submit">Save Profile</button>
</form>
```

---

## Database Migration (If Needed)

### Add Fields to Existing Records
```javascript
// MongoDB shell
db.therapists.updateMany(
  {},
  {
    $set: {
      pmdsVerified: false,
      verificationBadges: []
    }
  }
)
```

**Note:** Not required - MongoDB will create fields with defaults on first update.

---

## Testing Checklist

### Backend
- [x] Therapist.js model syntax verified
- [x] therapistProfileService.js updated & verified
- [x] therapistDirectoryService.js updated & verified
- [ ] Test API endpoints manually

### Frontend (TODO)
- [ ] Add verification badge to therapist card UI
- [ ] Add PMDS checkbox to profile editor
- [ ] Display badges in directory listing
- [ ] Test save/update of new fields
- [ ] Test profile display after update

### Database
- [ ] Verify new fields saved to MongoDB
- [ ] Check existing therapists still display correctly
- [ ] Verify directory listing shows badges

---

## Summary of Changes

### Before (Hardcoded/Partial)
```javascript
// Location was hardcoded in some places
city: r.city || 'Lahore'  // Fallback to default

// No verification badges
// No way to mark PMDS verified
```

### After (Fully Dynamic)
```javascript
// Everything from database
city: "Lahore"                          // ✓ User-editable
pmdsVerified: true                      // ✓ NEW - User-editable
verificationBadges: ["PMDS"]            // ✓ NEW - User-editable
specializationTitle: "Psychiatrist"     // ✓ User-editable
qualification: "MBBS, FCPS (Psychiatry)"// ✓ User-editable
experienceYears: 12                     // ✓ User-editable
waitTimeLabel: "Under 15 Min"           // ✓ User-editable
avgRating: 4.8                          // ✓ Auto-calculated
reviewCount: 190                        // ✓ Auto-calculated
```

---

## Next Steps

1. **Frontend Profile Editor**
   - Add form fields for new verification badges
   - Update profile edit page in therapist dashboard

2. **Therapist Card Component**
   - Display PMDS badge next to therapist name
   - Show verification badges on hover/details

3. **Admin Dashboard (Optional)**
   - Admin can verify therapists
   - Admin can add/remove verification badges

4. **Email Notifications (Optional)**
   - Notify therapist when PMDS verified
   - Notify when badge added/removed

---

## Code Examples

### Get Current Profile (JavaScript/React)
```javascript
async function getProfile() {
  const response = await fetch('/therapist/profile', {
    headers: { 'Authorization': `Bearer ${token}` }
  })
  const data = await response.json()
  console.log(data.therapist.pmdsVerified)    // true/false
  console.log(data.therapist.verificationBadges) // ["PMDS"]
}
```

### Update Profile (JavaScript/React)
```javascript
async function updateProfile(updates) {
  const response = await fetch('/therapist/profile', {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${token}`,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      experienceYears: 12,
      pmdsVerified: true,          // NEW
      verificationBadges: ["PMDS"] // NEW
    })
  })
  return response.json()
}
```

---

## Verification Badges

### Available Badges
| Badge | Value | Use Case |
|---|---|---|
| **PMDS** | `'PMDS'` | Pakistan Medical & Dental Council certified |
| **BOARD_CERTIFIED** | `'BOARD_CERTIFIED'` | Board certified in specialty |
| **LICENSED** | `'LICENSED'` | Officially licensed to practice |

### How to Add Badges
```javascript
// Set single badge
{ verificationBadges: ["PMDS"] }

// Set multiple badges
{ verificationBadges: ["PMDS", "BOARD_CERTIFIED"] }

// Invalid badges are filtered out automatically
{ verificationBadges: ["INVALID", "PMDS"] } // Only PMDS saved
```

---

## API Response Examples

### Directory Listing (shows badges)
```json
{
  "therapists": [
    {
      "id": "123abc",
      "name": "Dr. Faizan Ahmed",
      "city": "Lahore",
      "experience": "12 Years",
      "specializationTitle": "Psychiatrist",
      "qualification": "MBBS, FCPS (Psychiatry)",
      "avgRating": 4.8,
      "reviews": 190,
      "waitTime": "Under 15 Min",
      "pmdsVerified": true,
      "verificationBadges": ["PMDS"],
      "fees": [...]
    }
  ],
  "total": 1
}
```

### Profile Page (full details)
```json
{
  "therapist": {
    "city": "Lahore",
    "profileImageUrl": "/profiles/...",
    "specializationTitle": "Psychiatrist",
    "qualification": "MBBS, FCPS (Psychiatry)",
    "practiceLocation": "DHA Hospital Phase III",
    "experienceYears": 12,
    "waitTimeLabel": "Under 15 Min",
    "pmdsVerified": true,
    "verificationBadges": ["PMDS"],
    "bio": "Experienced psychiatrist...",
    "avgRating": 4.8,
    "reviewCount": 190,
    "avgReplyTimeMinutes": 10,
    "sessionCount": 245,
    "clientCount": 89
  }
}
```

---

## Status

✅ **Backend Implementation Complete**
- All fields now dynamic in database
- Verification badge system added
- APIs ready for frontend integration

🔄 **Frontend Implementation Pending**
- UI form for editing verification badges
- Display badges on therapist cards
- Show PMDS badge prominently

---

## Support

For questions about:
- **Backend API:** See `/benzi-server/src/services/therapistProfileService.js`
- **Database:** See `/benzi-server/src/models/Therapist.js`
- **Directory:** See `/benzi-server/src/services/therapistDirectoryService.js`

All changes are **backwards compatible** - existing profiles continue to work with new features optional.
