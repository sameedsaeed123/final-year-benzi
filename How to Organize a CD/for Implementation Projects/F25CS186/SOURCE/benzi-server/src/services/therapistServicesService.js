import { Service } from '../models/Service.js'
import { User } from '../models/User.js'

function toDto(doc) {
  return {
    id: String(doc._id),
    name: doc.name,
    type: doc.type || '',
    description: doc.description || '',
    durationMinutes: doc.durationMinutes ?? 60,
    pricePerSession: doc.pricePerSession ?? 0,
    isActive: doc.isActive !== false,
    createdAt: doc.createdAt,
  }
}

export async function listTherapistServices(therapistUserId) {
  const rows = await Service.find({ therapistUserId }).sort({ createdAt: -1 }).lean()
  return rows.map(toDto)
}

export async function createTherapistService(therapistUserId, body) {
  const doc = await Service.create({
    therapistUserId,
    name: body.name,
    type: body.type || 'Individual Therapy',
    description: body.description || '',
    durationMinutes: body.durationMinutes ?? 60,
    pricePerSession: body.pricePerSession ?? 0,
    isActive: body.isActive !== false,
  })
  return toDto(doc.toObject())
}

export async function updateTherapistService(therapistUserId, serviceId, body) {
  const doc = await Service.findOne({ _id: serviceId, therapistUserId })
  if (!doc) {
    const err = new Error('Service not found')
    err.statusCode = 404
    throw err
  }
  if (body.name !== undefined) doc.name = String(body.name).trim()
  if (body.type !== undefined) doc.type = String(body.type).trim()
  if (body.description !== undefined) doc.description = String(body.description).trim()
  if (body.durationMinutes !== undefined) doc.durationMinutes = Math.max(5, Math.min(480, Number(body.durationMinutes) || 60))
  if (body.pricePerSession !== undefined) doc.pricePerSession = Math.max(0, Number(body.pricePerSession) || 0)
  if (body.isActive !== undefined) doc.isActive = Boolean(body.isActive)
  await doc.save()
  return toDto(doc.toObject())
}

export async function deleteTherapistService(therapistUserId, serviceId) {
  const res = await Service.deleteOne({ _id: serviceId, therapistUserId })
  if (res.deletedCount === 0) {
    const err = new Error('Service not found')
    err.statusCode = 404
    throw err
  }
  return { ok: true }
}

export async function listActiveTherapistServices(therapistUserId) {
  const user = await User.findById(therapistUserId).select('role').lean()
  if (!user || user.role !== 'therapist') {
    const err = new Error('Therapist not found')
    err.statusCode = 404
    throw err
  }
  const rows = await Service.find({ therapistUserId, isActive: true }).sort({ createdAt: -1 }).lean()
  return rows.map(toDto)
}
