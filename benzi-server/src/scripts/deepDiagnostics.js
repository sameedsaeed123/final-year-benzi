import 'dotenv/config'
import mongoose from 'mongoose'
import Redis from 'ioredis'
import nodemailer from 'nodemailer'
import { connectDB } from '../config/database.js'
import { EmailLog } from '../models/EmailLog.js'
import { redisConfig, smtpConfig, queueConfig } from '../config/email.js'
import { Queue } from 'bullmq'

async function run() {
  console.log('=== BENZI BACKEND DEEP DIAGNOSTICS ===\n')

  // 1. Check MONGODB
  try {
    console.log('1. Connecting to MongoDB...')
    await connectDB()
    console.log('✓ MongoDB Connected Successfully')
  } catch (err) {
    console.error('✗ MongoDB Connection Failed:', err.message)
  }

  // 2. Check REDIS
  let redis;
  try {
    console.log('\n2. Connecting to Redis...')
    redis = new Redis(redisConfig)
    const pingRes = await redis.ping()
    console.log(`✓ Redis Connected successfully. Ping response: "${pingRes}"`)
  } catch (err) {
    console.error('✗ Redis Connection Failed:', err.message)
  }

  // 3. Check BullMQ Queue
  try {
    console.log('\n3. Inspecting BullMQ Queue...')
    const emailQueue = new Queue(queueConfig.queueName, { connection: redis })
    const [waiting, active, completed, failed, delayed] = await Promise.all([
      emailQueue.getWaitingCount(),
      emailQueue.getActiveCount(),
      emailQueue.getCompletedCount(),
      emailQueue.getFailedCount(),
      emailQueue.getDelayedCount(),
    ])
    console.log(`✓ Queue counts:`)
    console.log(`  - Waiting: ${waiting}`)
    console.log(`  - Active: ${active}`)
    console.log(`  - Completed: ${completed}`)
    console.log(`  - Failed: ${failed}`)
    console.log(`  - Delayed: ${delayed}`)

    if (failed > 0) {
      console.log('\nRetrieving last 3 failed jobs from BullMQ:')
      const failedJobs = await emailQueue.getFailed(0, 2)
      for (const job of failedJobs) {
        console.log(`  - Job ID ${job.id}: Failed Reason: "${job.failedReason}" (Attempts: ${job.attemptsMade})`)
      }
    }
  } catch (err) {
    console.error('✗ Queue Inspection Failed:', err.message)
  }

  // 4. Check SMTP Transporter
  try {
    console.log('\n4. Verifying Gmail SMTP Transporter...')
    console.log(`   Host: ${smtpConfig.host}:${smtpConfig.port}`)
    console.log(`   User: ${smtpConfig.auth.user}`)
    const transporter = nodemailer.createTransport(smtpConfig)
    const verifySuccess = await transporter.verify()
    console.log('✓ SMTP Transporter Verified: Ready to send emails!')
  } catch (err) {
    console.error('✗ SMTP Transporter Verification Failed:', err.message)
  }

  // 5. Check EmailLog Table
  try {
    console.log('\n5. Querying last 5 Email Logs from MongoDB...')
    const logs = await EmailLog.find().sort({ createdAt: -1 }).limit(5).lean()
    if (logs.length === 0) {
      console.log('   No email logs found.')
    } else {
      logs.forEach((log, idx) => {
        console.log(`  [Log #${idx+1}]`)
        console.log(`  - Recipient: ${log.recipient}`)
        console.log(`  - Subject: ${log.subject}`)
        console.log(`  - Template: ${log.template}`)
        console.log(`  - Status: ${log.status.toUpperCase()}`)
        console.log(`  - JobId: ${log.jobId}`)
        console.log(`  - Error: ${log.error || 'None'}`)
        console.log(`  - CreatedAt: ${log.createdAt.toISOString()}`)
        console.log('  --------------------------------------------')
      })
    }
  } catch (err) {
    console.error('✗ Querying EmailLogs Failed:', err.message)
  }

  // Close connections
  try {
    await mongoose.disconnect()
    if (redis) await redis.quit()
    console.log('\n=== DIAGNOSTICS COMPLETE ===')
  } catch (e) {}
}

run().catch(console.error)
