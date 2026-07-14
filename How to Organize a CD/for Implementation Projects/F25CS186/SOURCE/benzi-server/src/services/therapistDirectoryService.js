import { Therapist } from '../models/Therapist.js'
import { Service } from '../models/Service.js'

const DEFAULT_IMAGE = '/images/Frame 33921.png'

function escapeRegex(s) {
  return s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
}

function formatExperience(years) {
  const y = Number(years) || 0
  if (y <= 0) return '—'
  if (y === 1) return '1 Year'
  if (Number.isInteger(y)) return `${y} Years`
  return `${y} Years`
}

function displayName(firstName, lastName) {
  const f = (firstName || '').trim()
  const l = (lastName || '').trim()
  const base = `${f} ${l}`.trim()
  if (!base) return 'Therapist'
  const withTitle = base.toLowerCase().startsWith('dr.') ? base : `Dr. ${base}`
  return withTitle
}

/**
 * @param {{ city?: string, q?: string, skip?: number, limit?: number }} opts
 */
export async function listTherapistDirectory(opts = {}) {
  const skip = Math.max(0, Number(opts.skip) || 0)
  const limit = Math.min(50, Math.max(1, Number(opts.limit) || 12))
  const cityRaw = (opts.city || '').trim()
  const q = (opts.q || '').trim()

  const matchUser = { 'u.role': 'therapist', 'u.status': 'VERIFIED' }
  const matchTherapist = {}
  if (cityRaw && cityRaw.toLowerCase() !== 'near you') {
    matchTherapist.city = new RegExp(`^${escapeRegex(cityRaw)}$`, 'i')
  }

  const nameMatch = q
    ? {
        $or: [
          { 'u.firstName': new RegExp(escapeRegex(q), 'i') },
          { 'u.lastName': new RegExp(escapeRegex(q), 'i') },
          { specializationTitle: new RegExp(escapeRegex(q), 'i') },
          { qualification: new RegExp(escapeRegex(q), 'i') },
        ],
      }
    : null

  const baseStages = [
    { $lookup: { from: 'users', localField: 'userId', foreignField: '_id', as: 'u' } },
    { $unwind: '$u' },
    { $match: matchUser },
    { $match: matchTherapist },
  ]
  if (nameMatch) baseStages.push({ $match: nameMatch })

  const countAgg = await Therapist.aggregate([...baseStages, { $count: 'n' }])
  const total = countAgg[0]?.n ?? 0

  const rows = await Therapist.aggregate([
    ...baseStages,
    { $sort: { avgRating: -1, reviewCount: -1, createdAt: -1 } },
    { $skip: skip },
    { $limit: limit },
    {
      $project: {
        userId: 1,
        city: 1,
        profileImageUrl: 1,
        specializationTitle: 1,
        qualification: 1,
        practiceLocation: 1,
        experienceYears: 1,
        avgRating: 1,
        reviewCount: 1,
        waitTimeLabel: 1,
        avgReplyTimeMinutes: 1,
          availableLocations: 1,
          availableLocationLabels: 1,
        pmdsVerified: 1,
        verificationBadges: 1,
        firstName: '$u.firstName',
        lastName: '$u.lastName',
        userProfileImage: '$u.profileImageUrl',
      },
    },
  ])

  const ids = rows.map((r) => r.userId).filter(Boolean)
  const services = await Service.find({ therapistUserId: { $in: ids }, isActive: true })
    .sort({ pricePerSession: -1 })
    .lean()

  const byTherapist = new Map()
  for (const s of services) {
    const tid = String(s.therapistUserId)
    if (!byTherapist.has(tid)) byTherapist.set(tid, [])
    const arr = byTherapist.get(tid)
    if (arr.length < 4) arr.push(s)
  }

  const therapists = rows.map((r) => {
    const tid = String(r.userId)
    const svcList = byTherapist.get(tid) || []
    const fees = svcList.map((s, i) => ({
      label: s.name,
      amount: Math.round((s.pricePerSession || 0) / 100),
      highlight: i === 0,
    }))
    if (fees.length === 0) {
      fees.push({ label: 'Consultation', amount: 0, highlight: true })
    }

    let waitTime = (r.waitTimeLabel || '').trim() || 'Under 15 Min'
    const reply = Number(r.avgReplyTimeMinutes) || 0
    if (reply > 0 && reply <= 120) {
      waitTime = `Under ${Math.max(15, Math.ceil(reply / 5) * 5)} Min`
    }

    const reviews = Number(r.reviewCount) || 0
    const rating = Math.min(5, Math.max(0, Number(r.avgRating) || 0))
    const spec = (r.specializationTitle || '').trim() || 'Mental health professional'
    const qual = (r.qualification || '').trim() || '—'

    return {
      id: tid,
      name: displayName(r.firstName, r.lastName),
      city: (r.city || 'Lahore').trim(),
      image: ((r.userProfileImage || r.profileImageUrl || '').trim() || DEFAULT_IMAGE),
      waitTime,
      experience: formatExperience(r.experienceYears),
      reviews,
      avgRating: rating,
      specializationTitle: spec,
      qualification: qual,
      availableLocations: Array.isArray(r.availableLocations) && r.availableLocations.length ? r.availableLocations : ['online'],
      availableLocationLabels: r.availableLocationLabels || {},
      pmdsVerified: r.pmdsVerified ?? false,
      verificationBadges: r.verificationBadges ?? [],
      fees,
    }
  })

  return { therapists, total }
}
