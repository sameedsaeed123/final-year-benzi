import mongoose from 'mongoose'

const STATUSES = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']
const LOCATIONS = ['online', 'office', 'clinic']
const PAYMENT_METHODS = ['online', 'onsite']
const PAYMENT_STATUSES = ['PENDING', 'VERIFIED', 'REJECTED']

const appointmentSchema = new mongoose.Schema(
  {
    patientUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    therapistUserId: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true, index: true },
    serviceId: { type: mongoose.Schema.Types.ObjectId, ref: 'Service', required: true },
    serviceName: { type: String, default: '' },
    servicePriceAtBooking: { type: Number, default: 0 },
    date: { type: Date, required: true },
    durationMinutes: { type: Number, default: 60 },
    location: { type: String, enum: LOCATIONS, default: 'online' },
    status: { type: String, enum: STATUSES, default: 'PENDING' },
    paymentMethod: { type: String, enum: PAYMENT_METHODS, default: 'onsite' },
    paymentScreenshotUrl: { type: String, default: '' },
    paymentStatus: { type: String, enum: PAYMENT_STATUSES, default: 'PENDING' },

    /** Video session — patient join URL (restricted for anonymous Jitsi) */
    meetLink: { type: String, default: '' },
    /** Therapist host URL (anonymous Jitsi only; full camera) */
    therapistMeetLink: { type: String, default: '' },
    googleCalendarEventId: { type: String, default: '' },
    /** google = Google Meet | jitsi = anonymous privacy room */
    videoProvider: { type: String, enum: ['google', 'jitsi'], default: 'google' },
    /** Snapshot at booking — anonymous Meet privacy (no patient on Google invite) */
    bookedAsAnonymous: { type: Boolean, default: false },
    patientMeetDisplayName: { type: String, default: '' },
  },
  { timestamps: true }
)

appointmentSchema.index({ therapistUserId: 1, date: 1 })
appointmentSchema.index({ patientUserId: 1, date: -1 })

export const Appointment = mongoose.model('Appointment', appointmentSchema)
export { STATUSES as APPOINTMENT_STATUSES }
