import { sendSuccess, sendError } from '../utils/responseUtils.js'
import {
  listTherapistServices,
  createTherapistService,
  updateTherapistService,
  deleteTherapistService,
} from '../services/therapistServicesService.js'
import { serviceCreateSchema, servicePatchSchema } from '../validators/therapistServicesValidators.js'

export async function therapistServicesList(req, res, next) {
  try {
    const rows = await listTherapistServices(req.user.id)
    return sendSuccess(res, { services: rows }, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function therapistServiceCreate(req, res, next) {
  try {
    const { error, value } = serviceCreateSchema.validate(req.body, { abortEarly: false, stripUnknown: true })
    if (error) {
      return sendError(res, 'Validation failed', 400, error.details.map((d) => ({ field: d.path.join('.'), message: d.message })))
    }
    const row = await createTherapistService(req.user.id, value)
    return sendSuccess(res, row, 'Created', 201)
  } catch (e) {
    next(e)
  }
}

export async function therapistServicePatch(req, res, next) {
  try {
    const { error, value } = servicePatchSchema.validate(req.body, { abortEarly: false, stripUnknown: true })
    if (error) {
      return sendError(res, 'Validation failed', 400, error.details.map((d) => ({ field: d.path.join('.'), message: d.message })))
    }
    const row = await updateTherapistService(req.user.id, req.params.serviceId, value)
    return sendSuccess(res, row, 'Updated', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function therapistServiceDelete(req, res, next) {
  try {
    await deleteTherapistService(req.user.id, req.params.serviceId)
    return sendSuccess(res, { ok: true }, 'Deleted', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}
