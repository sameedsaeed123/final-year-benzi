import Joi from 'joi'

export const createAppointmentSchema = Joi.object({
  therapistUserId: Joi.string().hex().length(24).required(),
  serviceId: Joi.string().hex().length(24).optional().allow(null, ''),
  date: Joi.date().required(),
  durationMinutes: Joi.number().integer().min(15).max(240).optional(),
  location: Joi.string().valid('online', 'office', 'clinic').optional(),
  paymentMethod: Joi.string().valid('online', 'onsite').optional(),
})

export const patchAppointmentSchema = Joi.object({
  status: Joi.string().valid('PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED').required(),
  paymentStatus: Joi.string().valid('PENDING', 'VERIFIED', 'REJECTED').optional(),
})

export const availabilityQuerySchema = Joi.object({
  date: Joi.string().pattern(/^\d{4}-\d{2}-\d{2}$/).required(),
  durationMinutes: Joi.number().integer().min(15).max(240).optional(),
})
