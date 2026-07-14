import Joi from 'joi'
import { Ticket } from '../models/Ticket.js'
import { sendSuccess, sendError } from '../utils/responseUtils.js'
import emailService from '../services/emailService.js'
import { env } from '../config/environment.js'

const ticketCreateSchema = Joi.object({
  name: Joi.string().trim().min(2).max(100).required(),
  email: Joi.string().trim().lowercase().email({ tlds: { allow: false } }).required(),
  phone: Joi.string().trim().max(30).allow('').optional(),
  subject: Joi.string().trim().min(3).max(200).required(),
  message: Joi.string().trim().min(10).required(),
  priority: Joi.string().valid('Low', 'High', 'Billing', 'Subscription', 'Technical').optional(),
})

export async function createTicket(req, res, next) {
  try {
    const { error, value } = ticketCreateSchema.validate(req.body, { abortEarly: false, stripUnknown: true })
    if (error) {
      return sendError(res, 'Validation failed', 400, error.details.map((d) => ({ field: d.path.join('.'), message: d.message })))
    }

    // Generate unique auto-incrementing TKT-XXXX sequence ID
    const lastTicket = await Ticket.findOne().sort({ createdAt: -1 })
    let nextNum = 1042 // Start near screen mockup value or increment
    if (lastTicket && lastTicket.ticketId) {
      const match = lastTicket.ticketId.match(/\d+/)
      if (match) {
        nextNum = parseInt(match[0]) + 1
      }
    }
    const ticketId = `TKT-${nextNum}`

    const ticket = new Ticket({
      ticketId,
      name: value.name,
      email: value.email,
      subject: value.subject,
      priority: value.priority || 'Low',
      description: value.message,
      replies: [
        {
          sender: 'user',
          message: value.message,
          createdAt: new Date()
        }
      ]
    })

    await ticket.save()

    // Send ticket creation confirmation email in the background
    const ticketUrl = `${env.FRONTEND_URL || 'http://localhost:3000'}/support/tickets/${ticket.ticketId}`
    await emailService.sendTicketCreated(
      ticket.email,
      ticket.name,
      ticket.ticketId,
      ticket.subject,
      ticketUrl
    )

    return sendSuccess(res, ticket, 'Support ticket created successfully', 201)
  } catch (e) {
    next(e)
  }
}
