import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from '../config/database.js'
import { EmailLog } from '../models/EmailLog.js'

async function check() {
  await connectDB()
  const fifteenMinutesAgo = new Date(Date.now() - 15 * 60 * 1000)
  const logs = await EmailLog.find({
    template: 'password-reset',
    createdAt: { $gte: fifteenMinutesAgo }
  }).sort({ createdAt: -1 }).lean()

  console.log('='.repeat(80))
  console.log(`RECENT PASSWORD RESET REQUESTS IN THE LAST 15 MINUTES: ${logs.length}`)
  console.log('='.repeat(80))
  for (const log of logs) {
    console.log(`Time: ${log.createdAt.toISOString()}`)
    console.log(`Recipient: ${log.recipient}`)
    console.log(`Subject: ${log.subject}`)
    console.log(`Status: ${log.status.toUpperCase()}`)
    console.log(`Attempts: ${log.attempts}/${log.maxAttempts}`)
    console.log(`Job ID: ${log.jobId}`)
    console.log(`Error: ${log.error || 'None'}`)
    console.log('-'.repeat(80))
  }
  await mongoose.disconnect()
}

check()
