import mongoose from 'mongoose'

const therapistSchema = new mongoose.Schema(
  {
    userId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, unique: true },
    sessionCount: { type: Number, default: 0 },
    clientCount: { type: Number, default: 0 },
    avgReplyTimeMinutes: { type: Number, default: 0 },
    avgRating: { type: Number, default: 0 },
    reviewCount: { type: Number, default: 0 },
    onboardingComplete: { type: Boolean, default: true },
    /** Public directory + profile (PK seed / therapist-editable) */
    city: { type: String, default: 'Lahore', trim: true },
    profileImageUrl: { type: String, default: '', trim: true },
    specializationTitle: { type: String, default: '', trim: true },
    qualification: { type: String, default: '', trim: true },
    practiceLocation: { type: String, default: '', trim: true },
    experienceYears: { type: Number, default: 0 },
    bio: { type: String, default: '', trim: true },
    waitTimeLabel: { type: String, default: 'Under 15 Min', trim: true },
    /** Verification badge - therapist can display their PMDS/credentials */
    pmdsVerified: { type: Boolean, default: false },
    verificationBadges: { type: [String], default: [], enum: ['PMDS', 'BOARD_CERTIFIED', 'LICENSED'] },
    /** Which appointment locations this therapist offers (codes). Labels are optional overrides. */
    availableLocations: { type: [String], default: ['online'], enum: ['online', 'office', 'clinic'] },
    availableLocationLabels: { type: mongoose.Schema.Types.Mixed, default: {} },
    /** Weekly slots: { mon: [{ start: '09:00', end: '12:00' }], ... } — validated loosely in service */
    weeklyAvailability: { type: mongoose.Schema.Types.Mixed, default: {} },
  },
  { timestamps: true }
)

therapistSchema.index({ city: 1 })

export const Therapist = mongoose.model('Therapist', therapistSchema)
