import Joi from 'joi'

export const serviceCreateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).required(),
  type: Joi.string().trim().max(80).allow('').optional(),
  description: Joi.string().trim().max(2000).allow('').optional(),
  durationMinutes: Joi.number().integer().min(5).max(480).optional(),
  pricePerSession: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
})

export const servicePatchSchema = Joi.object({
  name: Joi.string().trim().min(2).max(120).optional(),
  type: Joi.string().trim().max(80).allow('').optional(),
  description: Joi.string().trim().max(2000).allow('').optional(),
  durationMinutes: Joi.number().integer().min(5).max(480).optional(),
  pricePerSession: Joi.number().integer().min(0).optional(),
  isActive: Joi.boolean().optional(),
}).min(1)
