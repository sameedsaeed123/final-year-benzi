import mongoose from 'mongoose'

const appointmentReminderSchema = new mongoose.Schema(
  {
    appointmentId: { type: mongoose.Schema.Types.ObjectId, ref: 'Appointment', required: true },
    hoursBeforeAppointment: { type: Number, required: true },
    scheduledFor: { type: Date, required: true },
    sent: { type: Boolean, default: false },
    sentAt: { type: Date, default: null },
    emailLogId: { type: mongoose.Schema.Types.ObjectId, ref: 'EmailLog', default: null },
  },
  { timestamps: true }
)

// Compound index to guarantee uniqueness of reminders per appointment per interval
appointmentReminderSchema.index({ appointmentId: 1, hoursBeforeAppointment: 1 }, { unique: true })
appointmentReminderSchema.index({ scheduledFor: 1, sent: 1 })

export const AppointmentReminder = mongoose.model('AppointmentReminder', appointmentReminderSchema)
