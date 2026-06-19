import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { sendSuccess, sendError } from '../utils/responseUtils.js'
import { getTherapistDashboard } from '../services/therapistDashboardService.js'
import { listTherapistDirectory } from '../services/therapistDirectoryService.js'
import { getTherapistProfileForUser, updateTherapistProfileForUser } from '../services/therapistProfileService.js'
import { therapistProfilePatchSchema } from '../validators/therapistProfileValidators.js'
import { getTherapistAvailability, setTherapistAvailability, weeklyAvailabilitySchema } from '../services/therapistAvailabilityService.js'
import { listClientsForTherapist, unlinkPatientFromTherapist } from '../services/patientService.js'
import { listActiveTherapistServices } from '../services/therapistServicesService.js'
import { User } from '../models/User.js'
import { Patient } from '../models/Patient.js'
import { Therapist } from '../models/Therapist.js'
import emailService from '../services/emailService.js'
import { env } from '../config/environment.js'

export async function therapistAvailabilityMe(req, res, next) {
  try {
    const data = await getTherapistAvailability(req.user.id)
    return sendSuccess(res, { weeklyAvailability: data }, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function therapistAvailabilityPatch(req, res, next) {
  try {
    const { error, value } = weeklyAvailabilitySchema.validate(req.body || {}, { abortEarly: false, stripUnknown: true })
    if (error) {
      return sendError(res, 'Validation failed', 400, error.details.map((d) => ({ field: d.path.join('.'), message: d.message })))
    }
    const data = await setTherapistAvailability(req.user.id, value)
    return sendSuccess(res, { weeklyAvailability: data }, 'Updated', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function therapistPublicDetail(req, res, next) {
  try {
    const { therapistUserId } = req.params
    if (!mongoose.Types.ObjectId.isValid(therapistUserId)) {
      return sendError(res, 'Invalid therapist ID', 400)
    }

    const [user, therapist] = await Promise.all([
      User.findById(therapistUserId).select('firstName lastName email profileImageUrl status role').lean(),
      Therapist.findOne({ userId: therapistUserId }).lean(),
    ])

    if (!user || user.role !== 'therapist' || !therapist) {
      return sendError(res, 'Therapist not found', 404)
    }

    const f = (user.firstName || '').trim()
    const l = (user.lastName || '').trim()
    const base = `${f} ${l}`.trim()
    const name = base.toLowerCase().startsWith('dr.') ? base : `Dr. ${base}`

    return sendSuccess(
      res,
      {
        id: String(therapistUserId),
        name: name || 'Therapist',
        specializationTitle: therapist.specializationTitle || '',
        qualification: therapist.qualification || '',
        practiceLocation: therapist.practiceLocation || '',
        city: therapist.city || 'Lahore',
        bio: therapist.bio || '',
        experienceYears: therapist.experienceYears ?? 0,
        avgRating: therapist.avgRating ?? 0,
        reviewCount: therapist.reviewCount ?? 0,
        profileImageUrl: (user.profileImageUrl || therapist.profileImageUrl || '').trim(),
        availableLocations: therapist.availableLocations?.length
          ? therapist.availableLocations
          : ['online'],
        availableLocationLabels: therapist.availableLocationLabels || {},
        payment: {
          bankName: therapist.paymentBankName || '',
          accountName: therapist.paymentAccountName || '',
          accountNumber: therapist.paymentAccountNumber || '',
        },
        paymentBankName: therapist.paymentBankName || '',
        paymentAccountName: therapist.paymentAccountName || '',
        paymentAccountNumber: therapist.paymentAccountNumber || '',
      },
      'OK',
      200
    )
  } catch (e) {
    next(e)
  }
}

export async function therapistDirectory(req, res, next) {
  try {
    const city = req.query.city
    const q = req.query.q
    const skip = req.query.skip
    const limit = req.query.limit
    const data = await listTherapistDirectory({ city, q, skip, limit })
    return sendSuccess(res, data, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function therapistProfileMe(req, res, next) {
  try {
    const data = await getTherapistProfileForUser(req.user.id)
    return sendSuccess(res, data, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function therapistProfilePatch(req, res, next) {
  try {
    const { error, value } = therapistProfilePatchSchema.validate(req.body, { abortEarly: false, stripUnknown: true })
    if (error) {
      return sendError(res, error.details.map((d) => d.message).join(' '), 400)
    }
    const data = await updateTherapistProfileForUser(req.user.id, value)
    return sendSuccess(res, data, 'Updated', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function therapistDashboard(req, res, next) {
  try {
    const data = await getTherapistDashboard(req.user.id)
    return sendSuccess(res, data, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function therapistClientsList(req, res, next) {
  try {
    const clients = await listClientsForTherapist(req.user.id)
    return sendSuccess(res, { clients, total: clients.length }, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function therapistUnlinkClient(req, res, next) {
  try {
    const { patientUserId } = req.params
    if (!mongoose.Types.ObjectId.isValid(patientUserId)) {
      return sendError(res, 'Invalid patient ID', 400)
    }
    const data = await unlinkPatientFromTherapist(patientUserId, req.user.id)
    return sendSuccess(res, data, 'Patient unlinked. Records and past sessions are preserved.', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}


export async function therapistServicesPublic(req, res, next) {
  try {
    const { therapistUserId } = req.params
    if (!mongoose.Types.ObjectId.isValid(therapistUserId)) {
      return sendError(res, 'Invalid therapist ID', 400)
    }
    const services = await listActiveTherapistServices(therapistUserId)
    return sendSuccess(res, { services }, 'OK', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function invitePatient(req, res, next) {
  try {
    const { assertCanAddPatient } = await import('../services/subscriptionLimitsService.js')
    await assertCanAddPatient(req.user.id)

    const { email, firstName, lastName, phone = '' } = req.body
    if (!email || !firstName || !lastName) {
      return sendError(res, 'Email, first name, and last name are required', 400)
    }

    const emailNormalized = email.toLowerCase().trim()
    const existingUser = await User.findOne({ email: emailNormalized })
    if (existingUser) {
      return sendError(res, 'A user with this email address already exists', 400)
    }

    // Auto-generate a secure random temporary password (12 chars: uppercase, lowercase, digit, spec symbol)
    const generateTempPassword = () => {
      const chars = 'abcdefghijklmnopqrstuvwxyzABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789!@#$%^&*'
      let temp = ''
      temp += 'A' + 'a' + '1' + '!' // Ensure it satisfies our Joi rules
      for (let i = 0; i < 8; i++) {
        temp += chars.charAt(Math.floor(Math.random() * chars.length))
      }
      return temp.split('').sort(() => 0.5 - Math.random()).join('')
    }

    const tempPassword = generateTempPassword()
    const passwordHash = await bcrypt.hash(tempPassword, 12)

    // Save as patient user
    const newUser = new User({
      email: emailNormalized,
      firstName: firstName.trim(),
      lastName: lastName.trim(),
      phone: phone.trim(),
      role: 'patient',
      passwordHash,
      isTemporaryPassword: true,
      status: 'VERIFIED',
    })
    await newUser.save()

    // Save patient profile
    const newPatient = new Patient({
      userId: newUser._id,
      assignedTherapistUserId: req.user.id,
      assignedAt: new Date(),
      therapistLinks: [
        { therapistUserId: req.user.id, linkedAt: new Date(), unlinkedAt: null },
      ],
    })
    await newPatient.save()

    // Retrieve therapist info for invitation branding
    const therapistUser = await User.findById(req.user.id)
    const therapistName = `Dr. ${therapistUser.firstName} ${therapistUser.lastName}`

    const loginUrl = `${env.FRONTEND_URL || 'http://localhost:3000'}/login`

    // Send invitation email in background
    await emailService.sendPatientInvitation(
      newUser.email,
      `${newUser.firstName} ${newUser.lastName}`,
      therapistName,
      tempPassword,
      loginUrl
    )

    return sendSuccess(res, {
      id: newPatient._id,
      userId: newUser._id,
      email: newUser.email,
      firstName: newUser.firstName,
      lastName: newUser.lastName,
    }, 'Patient invited and invitation email dispatched successfully.', 201)
  } catch (e) {
    next(e)
  }
}
