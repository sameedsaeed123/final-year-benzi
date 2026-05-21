import mongoose from 'mongoose'

const PRIORITIES = ['Low', 'High', 'Billing', 'Subscription', 'Technical']
const STATUSES = ['Pending', 'Completed']

const ticketSchema = new mongoose.Schema(
  {
    ticketId: { type: String, required: true, unique: true },
    subject: { type: String, required: true, trim: true },
    name: { type: String, required: true, trim: true },
    email: { type: String, required: true, trim: true, lowercase: true },
    priority: { type: String, enum: PRIORITIES, default: 'Low' },
    status: { type: String, enum: STATUSES, default: 'Pending' },
    description: { type: String, required: true, trim: true },
    replies: [
      {
        sender: { type: String, enum: ['user', 'admin'], required: true },
        message: { type: String, required: true },
        createdAt: { type: Date, default: Date.now },
      }
    ],
  },
  { timestamps: true }
)

export const Ticket = mongoose.model('Ticket', ticketSchema)
export { PRIORITIES, STATUSES }
