import Joi from 'joi'

export const therapistProfilePatchSchema = Joi.object({
  firstName: Joi.string().trim().min(2).max(50).optional(),
  lastName: Joi.string().trim().min(2).max(50).optional(),
  phone: Joi.string().trim().max(30).allow('').optional(),
  city: Joi.string().trim().max(80).optional(),
  profileImageUrl: Joi.string().trim().max(2000).allow('').optional(),
  specializationTitle: Joi.string().trim().max(120).allow('').optional(),
  qualification: Joi.string().trim().max(200).allow('').optional(),
  practiceLocation: Joi.string().trim().max(200).allow('').optional(),
  experienceYears: Joi.number().min(0).max(80).optional(),
  bio: Joi.string().trim().max(4000).allow('').optional(),
  waitTimeLabel: Joi.string().trim().max(80).allow('').optional(),
}).min(1)
