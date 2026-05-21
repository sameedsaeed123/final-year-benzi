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

  console.log('\n🔍 Fetching latest 10 Email logs from the database...')
  const logs = await EmailLog.find({}).sort({ createdAt: -1 }).limit(10).lean()

  if (logs.length === 0) {
    console.log('❌ No email logs found in the database.')
  } else {
    logs.forEach((log, index) => {
      console.log(`\n--- [${index + 1}] Email Log ---`)
      console.log(`ID: ${log._id}`)
      console.log(`Recipient: ${log.recipient}`)
      console.log(`Subject: ${log.subject}`)
      console.log(`Template: ${log.template}`)
      console.log(`Status: ${log.status}`)
      console.log(`Attempts: ${log.attempts}`)
      console.log(`Created At: ${log.createdAt.toISOString()}`)
      if (log.error) {
        console.log(`Error: ${log.error}`)
      }
    })
  }

  await mongoose.disconnect()
}

run().catch((e) => {
  console.error('Diagnostic failed:', e.message)
  process.exit(1)
})
