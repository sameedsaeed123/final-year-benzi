import { Patient } from '../models/Patient.js'
import { Therapist } from '../models/Therapist.js'
import { ensureTherapistDefaultPlan } from './subscriptionLimitsService.js'

/**
 * Ensures a Patient or Therapist extension doc exists for this user (upsert).
 * Safe for existing DB users who registered before profiles existed.
 */
export async function ensureProfilesAfterAuth(user) {
  if (!user?._id) return
  if (user.role === 'patient') {
    await Patient.findOneAndUpdate(
      { userId: user._id },
      {
        $setOnInsert: {
          userId: user._id,
          totalPoints: 0,
          assignedTherapistUserId: null,
          assignedAt: null,
        },
      },
      { upsert: true }
    )
  } else if (user.role === 'therapist') {
    await Therapist.findOneAndUpdate(
      { userId: user._id },
      {
        $setOnInsert: {
          userId: user._id,
          sessionCount: 0,
          clientCount: 0,
          avgReplyTimeMinutes: 0,
          avgRating: 0,
          reviewCount: 0,
          onboardingComplete: true,
        },
      },
      { upsert: true }
    )
    await ensureTherapistDefaultPlan(user._id)
  }
}
