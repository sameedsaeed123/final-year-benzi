import { User } from '../models/User.js'
import { Therapist } from '../models/Therapist.js'

const DEFAULT_IMAGE = '/images/Frame 33921.png'

export async function getTherapistProfileForUser(userId) {
  const user = await User.findById(userId).select('firstName lastName email phone role profileImageUrl').lean()
  if (!user || user.role !== 'therapist') {
    const err = new Error('Therapist profile not found')
    err.statusCode = 404
    throw err
  }

  const t = await Therapist.findOne({ userId }).lean()
  if (!t) {
    const err = new Error('Therapist extension missing')
    err.statusCode = 404
    throw err
  }

  const userImg = (user.profileImageUrl || '').trim()
  const therapistImg = (t.profileImageUrl || '').trim()
  const effective = userImg || therapistImg || DEFAULT_IMAGE

  return {
    user: {
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || '',
      profileImageUrl: userImg,
    },
    therapist: {
      city: t.city ?? 'Lahore',
      profileImageUrl: therapistImg,
      profileImageUrlEffective: effective,
      specializationTitle: t.specializationTitle || '',
      qualification: t.qualification || '',
      practiceLocation: t.practiceLocation || '',
      experienceYears: t.experienceYears ?? 0,
      bio: t.bio || '',
      waitTimeLabel: t.waitTimeLabel || 'Under 15 Min',
      availableLocations: Array.isArray(t.availableLocations) ? t.availableLocations : ['online'],
      availableLocationLabels: t.availableLocationLabels || {},
      pmdsVerified: t.pmdsVerified ?? false,
      verificationBadges: t.verificationBadges ?? [],
      sessionCount: t.sessionCount ?? 0,
      clientCount: t.clientCount ?? 0,
      avgRating: t.avgRating ?? 0,
      reviewCount: t.reviewCount ?? 0,
      avgReplyTimeMinutes: t.avgReplyTimeMinutes ?? 0,
    },
  }
}

export async function updateTherapistProfileForUser(userId, body) {
  const user = await User.findById(userId)
  if (!user || user.role !== 'therapist') {
    const err = new Error('Therapist profile not found')
    err.statusCode = 404
    throw err
  }

  if (body.firstName !== undefined) user.firstName = String(body.firstName).trim()
  if (body.lastName !== undefined) user.lastName = String(body.lastName).trim()
  if (body.phone !== undefined) user.phone = String(body.phone).trim()
  await user.save()

  const tset = {}
  if (body.city !== undefined) tset.city = String(body.city).trim()
  if (body.profileImageUrl !== undefined) tset.profileImageUrl = String(body.profileImageUrl).trim()
  if (body.specializationTitle !== undefined) tset.specializationTitle = String(body.specializationTitle).trim()
  if (body.qualification !== undefined) tset.qualification = String(body.qualification).trim()
  if (body.practiceLocation !== undefined) tset.practiceLocation = String(body.practiceLocation).trim()
  if (body.experienceYears !== undefined) tset.experienceYears = Math.max(0, Math.min(80, Number(body.experienceYears) || 0))
  if (body.bio !== undefined) tset.bio = String(body.bio).trim().slice(0, 4000)
  if (body.waitTimeLabel !== undefined) tset.waitTimeLabel = String(body.waitTimeLabel).trim().slice(0, 80)
  if (body.availableLocations !== undefined) {
    const allowed = ['online', 'office', 'clinic']
    const arr = Array.isArray(body.availableLocations) ? body.availableLocations : []
    tset.availableLocations = arr.map(String).map(s => s.trim()).filter(s => allowed.includes(s))
    if (!tset.availableLocations.length) tset.availableLocations = ['online']
  }
  if (body.availableLocationLabels !== undefined && typeof body.availableLocationLabels === 'object' && body.availableLocationLabels !== null) {
    const allowed = ['online', 'office', 'clinic']
    const labels = {}
    for (const k of allowed) {
      if (Object.prototype.hasOwnProperty.call(body.availableLocationLabels, k)) {
        const v = String(body.availableLocationLabels[k] || '').trim()
        if (v) labels[k] = v
      }
    }
    tset.availableLocationLabels = labels
  }
  if (body.pmdsVerified !== undefined) tset.pmdsVerified = Boolean(body.pmdsVerified)
  if (body.verificationBadges !== undefined) {
    const badges = Array.isArray(body.verificationBadges) ? body.verificationBadges : []
    tset.verificationBadges = badges.filter(b => ['PMDS', 'BOARD_CERTIFIED', 'LICENSED'].includes(String(b)))
  }

  await Therapist.findOneAndUpdate({ userId }, { $set: tset }, { upsert: false })

  return getTherapistProfileForUser(userId)
}
