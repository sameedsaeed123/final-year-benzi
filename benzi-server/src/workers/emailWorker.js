import { Worker } from 'bullmq'
import Redis from 'ioredis'
import nodemailer from 'nodemailer'
import { smtpConfig, senderConfig, redisConfig, queueConfig, rateLimits } from '../config/email.js'
import { EmailLog } from '../models/EmailLog.js'
import { maskEmail } from '../utils/emailValidator.js'
import { getBenziLogoAttachment } from '../utils/emailLogo.js'

// Setup Redis connection for Worker
const workerConnection = new Redis({
  ...redisConfig,
  maxRetriesPerRequest: null,
  enableReadyCheck: false,
})

// Create SMTP Transporter
const transporter = nodemailer.createTransport(smtpConfig)

// Worker processing logic
export const emailWorker = new Worker(
  queueConfig.queueName,
  async (job) => {
    const { to, subject, html, text, templateId, category, priority, metadata = {} } = job.data
    const maskedRecipient = maskEmail(to)

    console.log(`[EmailWorker] Processing job ${job.id} of category ${category} for ${maskedRecipient}`)

    // Check daily sending limits before proceeding
    const startOfToday = new Date()
    startOfToday.setHours(0, 0, 0, 0)
    const todaySentCount = await EmailLog.countDocuments({
      status: 'sent',
      createdAt: { $gte: startOfToday },
    })

    if (todaySentCount >= rateLimits.dailyLimit) {
      const limitErr = new Error(`Gmail daily limit reached (${rateLimits.dailyLimit} emails). Job paused.`)
      console.error(`[EmailWorker] LIMIT REACHED: ${limitErr.message}`)
      throw limitErr
    }

    if (todaySentCount === rateLimits.alertThreshold) {
      console.warn(
        `[EmailWorker] ALERT: Daily email send count has reached 80% threshold (${todaySentCount}/${rateLimits.dailyLimit})`
      )
    }

    // Try finding or creating EmailLog for this job
    let emailLog = await EmailLog.findOne({ jobId: job.id })
    if (!emailLog) {
      emailLog = new EmailLog({
        recipient: maskedRecipient,
        subject,
        template: templateId || 'custom',
        status: 'queued',
        category: category || 'test',
        priority: priority || 'normal',
        jobId: job.id,
        attempts: 0,
        metadata,
      })
      await emailLog.save()
    }

    try {
      const logoAttachment = await getBenziLogoAttachment()
      const info = await transporter.sendMail({
        from: `"${senderConfig.name}" <${senderConfig.address}>`,
        to,
        subject,
        html,
        text,
        attachments: logoAttachment ? [logoAttachment] : [],
      })

      // Update log to sent
      emailLog.status = 'sent'
      emailLog.attempts = job.attemptsMade + 1
      emailLog.sentAt = new Date()
      emailLog.error = null
      await emailLog.save()

      console.log(`[EmailWorker] Job ${job.id} sent successfully. MessageID: ${info.messageId}`)
      return { success: true, messageId: info.messageId }
    } catch (sendError) {
      console.error(`[EmailWorker] Failed sending email job ${job.id}:`, sendError.message)

      // Update log with error details
      emailLog.attempts = job.attemptsMade + 1
      emailLog.error = sendError.message

      // If attempts made reaches maximum, mark as failed
      if (job.attemptsMade + 1 >= (job.opts.attempts || 3)) {
        emailLog.status = 'failed'
      } else {
        emailLog.status = 'queued' // queued/retrying state
      }
      await emailLog.save()

      throw sendError
    }
  },
  {
    connection: workerConnection,
    concurrency: queueConfig.workerOptions.concurrency,
    limiter: queueConfig.workerOptions.limiter,
  }
)

// Worker Event Listeners for tracking
emailWorker.on('completed', (job, result) => {
  console.log(`[EmailWorker] Job ${job.id} completed successfully!`)
})

emailWorker.on('failed', (job, err) => {
  console.error(`[EmailWorker] Job ${job?.id} failed with error: ${err.message}`)
})

emailWorker.on('error', (err) => {
  console.error('[EmailWorker] Worker connection/operational error:', err)
})

// Graceful Shutdown
const shutdownWorker = async () => {
  console.log('[EmailWorker] Shutting down worker...')
  try {
    await emailWorker.close()
    await workerConnection.quit()
    console.log('[EmailWorker] Worker shut down complete.')
  } catch (err) {
    console.error('[EmailWorker] Error during worker shutdown:', err)
  } finally {
    process.exit(0)
  }
}

process.on('SIGTERM', shutdownWorker)
process.on('SIGINT', shutdownWorker)

export default emailWorker
