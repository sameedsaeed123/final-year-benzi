import Joi from 'joi'
import { Therapist } from '../models/Therapist.js'

const timeRe = /^([01]\d|2[0-3]):[0-5]\d$/
const slotSchema = Joi.object({
  start: Joi.string().pattern(timeRe).required(),
  end: Joi.string().pattern(timeRe).required(),
})
const daySchema = Joi.array().items(slotSchema).max(12)

export const weeklyAvailabilitySchema = Joi.object({
  mon: daySchema.optional(),
  tue: daySchema.optional(),
  wed: daySchema.optional(),
  thu: daySchema.optional(),
  fri: daySchema.optional(),
  sat: daySchema.optional(),
  sun: daySchema.optional(),
}).unknown(false)

export async function getTherapistAvailability(userId) {
  const t = await Therapist.findOne({ userId }).select('weeklyAvailability').lean()
  return t?.weeklyAvailability && typeof t.weeklyAvailability === 'object' ? t.weeklyAvailability : {}
}

export async function setTherapistAvailability(userId, value) {
  const t = await Therapist.findOneAndUpdate(
    { userId },
    { $set: { weeklyAvailability: value } },
    { new: true }
  )
  if (!t) {
    const err = new Error('Therapist profile not found')
    err.statusCode = 404
    throw err
  }
  return getTherapistAvailability(userId)
}
