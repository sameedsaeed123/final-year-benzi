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

  console.log('\n🔍 Fetching all users from your remote database...')
  const users = await User.find({}).lean()

  if (users.length === 0) {
    console.log('❌ No users found in the database.')
  } else {
    users.forEach((user, index) => {
      console.log(`[${index + 1}] Email: "${user.email}" | Role: "${user.role}" | Status: "${user.status}" | 2FA: ${user.twoFactorEnabled || false}`)
    })
  }

  await mongoose.disconnect()
}

run().catch((e) => {
  console.error('User check failed:', e.message)
  process.exit(1)
})
