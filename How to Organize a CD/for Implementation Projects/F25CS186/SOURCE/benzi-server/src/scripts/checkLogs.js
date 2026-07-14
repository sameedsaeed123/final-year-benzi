import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from '../config/database.js'
import { EmailLog } from '../models/EmailLog.js'

async function check() {
  await connectDB()
  const logs = await EmailLog.find().sort({ createdAt: -1 }).limit(15).lean()
  console.log('='.repeat(80))
  console.log('RECENT EMAIL LOGS (Newest First):')
  console.log('='.repeat(80))
  for (const log of logs) {
    console.log(`Time: ${log.createdAt.toISOString()}`)
    console.log(`Recipient: ${log.recipient}`)
    console.log(`Subject: ${log.subject}`)
    console.log(`Template: ${log.template}`)
    console.log(`Category: ${log.category}`)
    console.log(`Status: ${log.status.toUpperCase()}`)
    console.log(`Attempts: ${log.attempts}/${log.maxAttempts}`)
    console.log(`Job ID: ${log.jobId}`)
    console.log(`Error: ${log.error || 'None'}`)
    console.log('-'.repeat(80))
  }
  await mongoose.disconnect()
}

check()
