import mongoose from 'mongoose'

const STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']
const LOCATIONS = ['online', 'office', 'clinic']
const PAYMENT_METHODS = ['online', 'onsite']
const PAYMENT_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED']

const appointmentSchema = new mongoose.Schema(
  {
    patientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    therapistUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', default: null },
    date: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60 },
    location: { type: String, enum: LOCATIONS, default: 'online' },
    status: { type: String, enum: STATUSES, default: 'PENDING' },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'onsite' },
    paymentScreenshotUrl: { type: String, default: '' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'PENDING' },
  },
  { timestamps: true }
)

appointmentSchema.index({ therapistUserId: 1, date: 1 })
appointmentSchema.index({ patientUserId: 1, date: -1 })

export const Appointment = mongoose.model('Appointment', appointmentSchema)
export { STATUSES as APPOINTMENT_STATUSES }
