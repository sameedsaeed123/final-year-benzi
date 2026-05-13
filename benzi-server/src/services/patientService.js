import { Patient } from '../models/Patient.js'
import { Therapist } from '../models/Therapist.js'
import { User } from '../models/User.js'

export async function getLinkedTherapistForPatient(userId) {
  const patient = await Patient.findOne({ userId }).select('assignedTherapistUserId').lean()
  const therapistUserId = patient?.assignedTherapistUserId
  if (!therapistUserId) {
    return { linked: false }
  }

  const [user, therapist] = await Promise.all([
    User.findById(therapistUserId).select('firstName lastName email profileImageUrl').lean(),
    Therapist.findOne({ userId: therapistUserId })
      .select('specializationTitle qualification city waitTimeLabel experienceYears avgRating')
      .lean(),
  ])

  if (!user) {
    return { linked: false }
  }

  return {
    linked: true,
    therapist: {
      id: String(therapistUserId),
      name: `${user.firstName || ''} ${user.lastName || ''}`.trim() || 'Therapist',
      email: user.email || '',
      image: user.profileImageUrl || therapist?.profileImageUrl || '',
      specializationTitle: therapist?.specializationTitle || '',
      qualification: therapist?.qualification || '',
      city: therapist?.city || '',
      waitTimeLabel: therapist?.waitTimeLabel || '',
      experienceYears: therapist?.experienceYears ?? 0,
      avgRating: typeof therapist?.avgRating === 'number' ? therapist.avgRating : 0,
    },
  }
}

export async function linkPatientToTherapistIfEmpty(patientUserId, therapistUserId) {
  await Patient.updateOne(
    {
      userId: patientUserId,
      $or: [{ assignedTherapistUserId: { $exists: false } }, { assignedTherapistUserId: null }],
    },
    {
      $set: { assignedTherapistUserId: therapistUserId, assignedAt: new Date() },
      $setOnInsert: { userId: patientUserId, totalPoints: 0 },
    },
    { upsert: true }
  )
}
