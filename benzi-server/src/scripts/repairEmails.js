import 'dotenv/config'
import mongoose from 'mongoose'
import { User } from '../models/User.js'
import { normalizeMongoUri, ensureAuthSource } from '../config/database.js'

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is required')
    process.exit(1)
  }
  const uri = ensureAuthSource(normalizeMongoUri(process.env.MONGODB_URI))
  await mongoose.connect(uri)

  console.log('\n🔍 Repairing and lowercasing all emails in the database...')
  const users = await User.find({})

  for (const user of users) {
    const originalEmail = user.email
    const lowerEmail = originalEmail.toLowerCase().trim()
    
    if (originalEmail !== lowerEmail) {
      user.email = lowerEmail
      await user.save()
      console.log(`✅ Repaired: "${originalEmail}" -> "${lowerEmail}"`)
    }
  }

  console.log('\n✨ Database active accounts overview:')
  const updatedUsers = await User.find({}).lean()
  updatedUsers.forEach((user, index) => {
    console.log(`[${index + 1}] Email: "${user.email}" | Role: "${user.role}" | Status: "${user.status}"`)
  })

  await mongoose.disconnect()
}

run().catch((e) => {
  console.error('Repair failed:', e.message)
  process.exit(1)
})
