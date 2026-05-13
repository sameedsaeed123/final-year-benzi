import { sendSuccess, sendError } from '../utils/responseUtils.js'
import { getTherapistDashboard } from '../services/therapistDashboardService.js'
import { listTherapistDirectory } from '../services/therapistDirectoryService.js'
import { getTherapistProfileForUser, updateTherapistProfileForUser } from '../services/therapistProfileService.js'
import { therapistProfilePatchSchema } from '../validators/therapistProfileValidators.js'
import { getTherapistAvailability, setTherapistAvailability, weeklyAvailabilitySchema } from '../services/therapistAvailabilityService.js'

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

