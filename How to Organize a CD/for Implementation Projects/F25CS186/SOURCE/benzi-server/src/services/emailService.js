import nodemailer from 'nodemailer'
import { addEmailJob } from '../queues/emailQueue.js'
import { renderTemplate } from './templateService.js'
import { EmailLog } from '../models/EmailLog.js'
import { validateAndNormalize, maskEmail } from '../utils/emailValidator.js'
import { smtpConfig, senderConfig, templateIds, emailPriority, emailCategory } from '../config/email.js'
import { getBenziLogoAttachment } from '../utils/emailLogo.js'

/**
 * Dispatch Email to BullMQ Queue
 * 
 * @param {Object} options
 * @param {string} options.to - Recipient email
 * @param {string} options.templateId - Template identifier
 * @param {Object} options.data - Template variables
 * @param {string} options.category - Category of email
 * @param {string} [options.priority='normal'] - Priority level
 * @param {Object} [options.metadata] - Extra context
 */
export async function sendEmail({ to, templateId, data, category, priority = emailPriority.NORMAL, metadata = {} }) {
  // Validate and normalize recipient
  const validatedEmail = validateAndNormalize(to, false)
  if (!validatedEmail) {
    throw new Error(`Invalid email address: ${to}`)
  }

  // Compile / Render HTML, text and subject from templateId
  const { html, text, subject } = await renderTemplate(templateId, data)

  // Initialize EmailLog in database (status: queued)
  const maskedRecipient = maskEmail(validatedEmail)
  const emailLog = new EmailLog({
    recipient: maskedRecipient,
    subject,
    template: templateId,
    status: 'queued',
    category,
    priority,
    attempts: 0,
    metadata,
  })
  await emailLog.save()

  // In development, let's try direct send first for absolute real-time delivery and error feedback!
  if (process.env.NODE_ENV === 'development') {
    try {
      console.log(`[EmailService] [DevMode] Attempting direct synchronous SMTP send for ${maskedRecipient}...`)
      const transporter = nodemailer.createTransport(smtpConfig)
      const logoAttachment = await getBenziLogoAttachment()
      const info = await transporter.sendMail({
        from: `"${senderConfig.name}" <${senderConfig.address}>`,
        to: validatedEmail,
        subject,
        html,
        text,
        attachments: logoAttachment ? [logoAttachment] : [],
      })

      emailLog.status = 'sent'
      emailLog.attempts = 1
      emailLog.sentAt = new Date()
      emailLog.error = null
      await emailLog.save()

      console.log(`[EmailService] [DevMode] Email sent successfully! MessageID: ${info.messageId}`)
      return { success: true, logId: emailLog._id }
    } catch (directError) {
      console.error(`[EmailService] [DevMode] Direct send failed:`, directError.message)
      console.log(`[EmailService] [DevMode] Falling back to BullMQ queue...`)
    }
  }

  try {
    // Add job to BullMQ queue
    const job = await addEmailJob({
      to: validatedEmail,
      subject,
      html,
      text,
      templateId,
      category,
      priority,
      metadata,
    })

    // Associate BullMQ job ID with the EmailLog
    emailLog.jobId = job.id
    await emailLog.save()

    console.log(`[EmailService] Email of template ${templateId} queued. JobID: ${job.id}`)
    return { success: true, logId: emailLog._id, jobId: job.id }
  } catch (error) {
    console.error(`[EmailService] Failed queueing email job:`, error.message)
    emailLog.status = 'failed'
    emailLog.error = error.message
    await emailLog.save()
    throw error
  }
}

/**
 * Send 2FA verification code email
 */
export async function send2FACode(email, recipientName, code, expiryMinutes = 10) {
  return sendEmail({
    to: email,
    templateId: templateIds.TWO_FACTOR_CODE,
    data: {
      recipientName,
      code,
      expiryMinutes,
    },
    category: emailCategory.TRANSACTIONAL,
    priority: emailPriority.HIGH,
  })
}

/**
 * Send Password Reset link email
 */
export async function sendPasswordResetEmail(email, recipientName, resetUrl, expiryHours = 1) {
  let resetCode = ''
  try {
    const urlObj = new URL(resetUrl)
    resetCode = urlObj.searchParams.get('token') || ''
  } catch (err) {
    const match = resetUrl.match(/[?&]token=([^&]+)/)
    if (match) resetCode = match[1]
  }

  // Clean URL for email delivery - remove port and use standard domain
  // Gmail filters emails with non-standard ports and unrecognized TLDs
  let cleanUrl = resetUrl
    .replace(':5173', '')  // Remove dev port
    .replace(':3000', '')  // Remove any other ports
    .replace('benzi.mentalhealth', 'localhost')  // Use localhost for dev
  
  // For production, this should be the actual domain without port
  // e.g., https://app.benzi.com/reset-password?token=...

  return sendEmail({
    to: email,
    templateId: templateIds.PASSWORD_RESET,
    data: {
      recipientName,
      resetUrl: cleanUrl,
      resetCode,
      expiryHours,
    },
    category: emailCategory.TRANSACTIONAL,
    priority: emailPriority.HIGH,
  })
}

/**
 * Send Appointment Reminder email
 */
export async function sendAppointmentReminder(email, recipientName, therapistName, appointmentDate, appointmentTime, hoursUntil, location = '', appointmentUrl = '', preferencesUrl = '') {
  return sendEmail({
    to: email,
    templateId: templateIds.APPOINTMENT_REMINDER,
    data: {
      recipientName,
      therapistName,
      appointmentDate,
      appointmentTime,
      hoursUntil,
      location,
      appointmentUrl,
      preferencesUrl,
    },
    category: emailCategory.INFORMATIONAL,
    priority: emailPriority.NORMAL,
  })
}

/**
 * Send Appointment Confirmation email
 */
export async function sendAppointmentConfirmation(
  email,
  recipientName,
  therapistName,
  appointmentDate,
  appointmentTime,
  status,
  location,
  price,
  paymentMethod,
  appointmentUrl = '',
  meetLink = '',
  anonymousMeet = false,
  meetJoinAlias = ''
) {
  return sendEmail({
    to: email,
    templateId: templateIds.APPOINTMENT_CONFIRMATION,
    data: {
      recipientName,
      therapistName,
      appointmentDate,
      appointmentTime,
      status,
      location,
      price,
      paymentMethod,
      appointmentUrl,
      meetLink,
      anonymousMeet: Boolean(anonymousMeet),
      meetJoinAlias: meetJoinAlias || 'Anonymous Patient',
    },
    category: emailCategory.TRANSACTIONAL,
    priority: emailPriority.HIGH,
  })
}

/**
 * Send Appointment Payment Update email
 */
export async function sendAppointmentPaymentUpdate(email, recipientName, therapistName, appointmentDate, appointmentTime, paymentStatus, price, appointmentUrl = '') {
  return sendEmail({
    to: email,
    templateId: templateIds.APPOINTMENT_PAYMENT_UPDATE,
    data: {
      recipientName,
      therapistName,
      appointmentDate,
      appointmentTime,
      paymentStatus,
      price,
      appointmentUrl,
    },
    category: emailCategory.TRANSACTIONAL,
    priority: emailPriority.HIGH,
  })
}

/**
 * Send Appointment Status Update email (both status and paymentStatus changes)
 */
export async function sendAppointmentStatusUpdate(
  email,
  recipientName,
  therapistName,
  appointmentDate,
  appointmentTime,
  status,
  paymentStatus,
  price,
  appointmentUrl = '',
  meetLink = '',
  anonymousMeet = false,
  meetJoinAlias = ''
) {
  return sendEmail({
    to: email,
    templateId: templateIds.APPOINTMENT_STATUS_UPDATE,
    data: {
      recipientName,
      therapistName,
      appointmentDate,
      appointmentTime,
      status,
      paymentStatus,
      price,
      appointmentUrl,
      meetLink,
      anonymousMeet: Boolean(anonymousMeet),
      meetJoinAlias: meetJoinAlias || 'Anonymous Patient',
    },
    category: emailCategory.TRANSACTIONAL,
    priority: emailPriority.HIGH,
  })
}

/**
 * Send Therapist Appointment Notification email
 */
export async function sendTherapistAppointmentNotification(
  email,
  recipientName,
  patientName,
  appointmentDate,
  appointmentTime,
  location,
  price,
  paymentMethod,
  appointmentUrl = '',
  meetLink = '',
  anonymousMeet = false
) {
  return sendEmail({
    to: email,
    templateId: templateIds.THERAPIST_APPOINTMENT_NOTIFICATION,
    data: {
      recipientName,
      patientName,
      appointmentDate,
      appointmentTime,
      location,
      price,
      paymentMethod,
      appointmentUrl,
      meetLink,
      anonymousMeet: Boolean(anonymousMeet),
    },
    category: emailCategory.TRANSACTIONAL,
    priority: emailPriority.HIGH,
  })
}

/**
 * Send Therapist Verification Approved email
 */
export async function sendTherapistVerificationApproved(email, recipientName) {
  return sendEmail({
    to: email,
    templateId: templateIds.THERAPIST_VERIFICATION_APPROVED,
    data: {
      recipientName,
    },
    category: emailCategory.TRANSACTIONAL,
    priority: emailPriority.NORMAL,
  })
}

/**
 * Send Therapist Verification Rejected email
 */
export async function sendTherapistVerificationRejected(email, recipientName, reason, resubmitUrl = '') {
  return sendEmail({
    to: email,
    templateId: templateIds.THERAPIST_VERIFICATION_REJECTED,
    data: {
      recipientName,
      reason,
      resubmitUrl,
    },
    category: emailCategory.TRANSACTIONAL,
    priority: emailPriority.NORMAL,
  })
}

/**
 * Send Patient Invitation email
 */
export async function sendPatientInvitation(email, recipientName, therapistName, temporaryPassword, loginUrl) {
  return sendEmail({
    to: email,
    templateId: templateIds.PATIENT_INVITATION,
    data: {
      recipientName,
      patientEmail: email,
      temporaryPassword,
      therapistName,
      loginUrl,
    },
    category: emailCategory.TRANSACTIONAL,
    priority: emailPriority.NORMAL,
  })
}

/**
 * Send Support Ticket Created notification
 */
export async function sendTicketCreated(email, recipientName, ticketId, ticketSubject, ticketUrl) {
  return sendEmail({
    to: email,
    templateId: templateIds.TICKET_CREATED,
    data: {
      recipientName,
      ticketId,
      ticketSubject,
      ticketUrl,
    },
    category: emailCategory.TRANSACTIONAL,
    priority: emailPriority.NORMAL,
  })
}

/**
 * Send Support Ticket Reply notification
 */
export async function sendTicketReply(email, recipientName, ticketId, replyMessage, ticketUrl) {
  return sendEmail({
    to: email,
    templateId: templateIds.TICKET_REPLY,
    data: {
      recipientName,
      ticketId,
      replyMessage,
      ticketUrl,
    },
    category: emailCategory.TRANSACTIONAL,
    priority: emailPriority.NORMAL,
  })
}

/**
 * Send Support Ticket Resolved notification
 */
export async function sendTicketResolved(email, recipientName, ticketId, ticketSubject, ticketUrl) {
  return sendEmail({
    to: email,
    templateId: templateIds.TICKET_RESOLVED,
    data: {
      recipientName,
      ticketId,
      ticketSubject,
      ticketUrl,
    },
    category: emailCategory.TRANSACTIONAL,
    priority: emailPriority.NORMAL,
  })
}

export default {
  sendEmail,
  send2FACode,
  sendPasswordResetEmail,
  sendAppointmentReminder,
  sendAppointmentConfirmation,
  sendAppointmentPaymentUpdate,
  sendAppointmentStatusUpdate,
  sendTherapistAppointmentNotification,
  sendTherapistVerificationApproved,
  sendTherapistVerificationRejected,
  sendPatientInvitation,
  sendTicketCreated,
  sendTicketReply,
  sendTicketResolved,
}
