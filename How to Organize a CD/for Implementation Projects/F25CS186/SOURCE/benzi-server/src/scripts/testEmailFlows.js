/**
 * Test Email Flows Script
 * 
 * Verifies compiling and queueing for all 9 email flows:
 * - 2FA code
 * - Password reset
 * - Appointment reminders
 * - Therapist approved/rejected
 * - Patient invitation
 * - Support ticket created/reply/resolved
 * 
 * Run with: node src/scripts/testEmailFlows.js
 */

import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from '../config/database.js'
import emailService from '../services/emailService.js'
import { EmailLog } from '../models/EmailLog.js'
import { checkQueueHealth } from '../queues/emailQueue.js'
import { maskEmail } from '../utils/emailValidator.js'

async function runTests() {
  console.log('='.repeat(60))
  console.log('BENZI EMAIL SYSTEM INTEGRATION TEST')
  console.log('='.repeat(60))

  try {
    // Connect to database
    console.log('[1/5] Connecting to MongoDB...')
    await connectDB()
    console.log('✓ Connected to MongoDB successfully.')

    // Health check Redis queue
    console.log('\n[2/5] Checking Redis and BullMQ health...')
    const health = await checkQueueHealth()
    console.log(`✓ Redis connected. Active: ${health.active}, Waiting: ${health.waiting}, Failed: ${health.failed}`)

    const recipientEmail = process.env.EMAIL_USER || 'therealfaizyabahmad@gmail.com'
    console.log(`\n[3/5] Target email for test dispatches: ${recipientEmail}`)

    // Clean previous test logs to make validation easier
    console.log('\n[4/5] Cleaning up old test logs...')
    await EmailLog.deleteMany({ category: 'test-flow' })
    console.log('✓ Cleaned previous test-flow logs.')

    console.log('\n[5/5] Queueing all 9 email template dispatches...')

    // 1. Two-Factor Authentication Code
    console.log('  -> Queueing 2FA Code email...');
    await emailService.send2FACode(recipientEmail, 'Faizyab Ahmad', '734912')

    // 2. Password Reset link
    console.log('  -> Queueing Password Reset email...');
    await emailService.sendPasswordResetEmail(recipientEmail, 'Faizyab Ahmad', 'http://localhost:3000/reset-password?token=testtoken', 1)

    // 3. Appointment Reminder
    console.log('  -> Queueing Appointment Reminder email...');
    await emailService.sendAppointmentReminder(
      recipientEmail,
      'Faizyab Ahmad',
      'Dr. Sameed Saeed',
      'Monday, May 25, 2026',
      '10:00 AM UTC',
      '24',
      'Online Video Call Session',
      'http://localhost:3000/appointments/appt123',
      'http://localhost:3000/patient/reminder-preferences/me'
    )

    // 4. Therapist Verification Approved
    console.log('  -> Queueing Therapist Approved email...');
    await emailService.sendTherapistVerificationApproved(recipientEmail, 'Dr. Sameed Saeed')

    // 5. Therapist Verification Rejected
    console.log('  -> Queueing Therapist Rejected email...');
    await emailService.sendTherapistVerificationRejected(
      recipientEmail,
      'Dr. Sameed Saeed',
      'The degree transcript upload was blurry and illegible.',
      'http://localhost:3000/therapist/verify'
    )

    // 6. Patient Invitation
    console.log('  -> Queueing Patient Invitation email...');
    await emailService.sendPatientInvitation(
      recipientEmail,
      'John Patient',
      'Dr. Sameed Saeed',
      'TempPass123!',
      'http://localhost:3000/login'
    )

    // 7. Support Ticket Created
    console.log('  -> Queueing Support Ticket Created email...');
    await emailService.sendTicketCreated(
      recipientEmail,
      'Faizyab Ahmad',
      'TKT-1042',
      'Billing Inquiry - Stripe Payment Issue',
      'http://localhost:3000/support/tickets/TKT-1042'
    )

    // 8. Support Ticket Reply
    console.log('  -> Queueing Support Ticket Reply email...');
    await emailService.sendTicketReply(
      recipientEmail,
      'Faizyab Ahmad',
      'TKT-1042',
      'Hello Faizyab, we have looked into your transaction. The charge was refunded successfully.',
      'http://localhost:3000/support/tickets/TKT-1042'
    )

    // 9. Support Ticket Resolved
    console.log('  -> Queueing Support Ticket Resolved email...');
    await emailService.sendTicketResolved(
      recipientEmail,
      'Faizyab Ahmad',
      'TKT-1042',
      'Billing Inquiry - Stripe Payment Issue',
      'http://localhost:3000/support/tickets/TKT-1042'
    )

    console.log('\n✓ All 9 email dispatches queued successfully!')
    console.log('\nVerifying DB EmailLog creations in 2 seconds...')
    await new Promise(resolve => setTimeout(resolve, 2000))

    const masked = maskEmail(recipientEmail)
    const logs = await EmailLog.find({ recipient: masked }).sort({ createdAt: -1 })
    console.log(`\nFound ${logs.length} EmailLog records in MongoDB for ${masked}:`)
    for (const log of logs) {
      console.log(`  - [${log.status.toUpperCase()}] Category: ${log.category.padEnd(12)} Template: ${log.template.padEnd(25)} Attempts: ${log.attempts}`)
    }

    console.log('\n' + '='.repeat(60))
    console.log('✓ All verification flows completed successfully!')
    console.log('='.repeat(60) + '\n')

    await mongoose.disconnect()
    process.exit(0)
  } catch (err) {
    console.error('\n✗ Test run failed with error:', err)
    process.exit(1)
  }
}

runTests()
