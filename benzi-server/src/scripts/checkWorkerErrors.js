import 'dotenv/config'
import mongoose from 'mongoose'
import { EmailLog } from '../models/EmailLog.js'
import { normalizeMongoUri, ensureAuthSource } from '../config/database.js'

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is required')
    process.exit(1)
  }
  const uri = ensureAuthSource(normalizeMongoUri(process.env.MONGODB_URI))
  await mongoose.connect(uri)

  console.log('\n🔍 Fetching latest 10 failed or queued email logs from the database...')
  const logs = await EmailLog.find({ status: { $in: ['failed', 'queued'] } }).sort({ createdAt: -1 }).limit(10).lean()

  if (logs.length === 0) {
    console.log('✅ No failed or queued email logs found. All emails in DB are marked as sent.')
    // Let's also print the last 5 sent emails just to check
    const sentLogs = await EmailLog.find({ status: 'sent' }).sort({ createdAt: -1 }).limit(5).lean()
    console.log('\n--- LATEST 5 SENT EMAILS ---')
    sentLogs.forEach((log, index) => {
      console.log(`[${index + 1}] Recipient: ${log.recipient} | Subject: ${log.subject} | Sent At: ${log.sentAt}`)
    })
  } else {
    logs.forEach((log, index) => {
      console.log(`\n--- [${index + 1}] Failed/Queued Email ---`)
      console.log(`ID: ${log._id}`)
      console.log(`Recipient: ${log.recipient}`)
      console.log(`Subject: ${log.subject}`)
      console.log(`Status: ${log.status}`)
      console.log(`Attempts: ${log.attempts}`)
      console.log(`Created At: ${log.createdAt.toISOString()}`)
      console.log(`Error Msg: ${log.error || 'None'}`)
    })
  }

  await mongoose.disconnect()
}

run().catch((e) => {
  console.error('Worker diagnostic failed:', e.message)
  process.exit(1)
})
