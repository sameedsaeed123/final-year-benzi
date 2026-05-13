import 'dotenv/config'
import mongoose from 'mongoose'
import bcrypt from 'bcryptjs'
import { User } from '../models/User.js'
import { normalizeMongoUri, ensureAuthSource } from '../config/database.js'

const email = (process.env.SEED_ADMIN_EMAIL || 'admin@benzi.local').toLowerCase()
const password = process.env.SEED_ADMIN_PASSWORD || 'ChangeMe!Admin1'

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is required')
    process.exit(1)
  }
  const uri = ensureAuthSource(normalizeMongoUri(process.env.MONGODB_URI))
  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: Number(process.env.MONGODB_SERVER_SELECTION_MS) || 25000,
  })
  const passwordHash = await bcrypt.hash(password, 12)
  const existing = await User.findOne({ email }).select('+passwordHash')
  if (existing) {
    await User.updateOne(
      { _id: existing._id },
      {
        $set: {
          passwordHash,
          role: 'admin',
          status: 'VERIFIED',
          firstName: 'Admin',
          lastName: 'User',
        },
      }
    )
    console.log('Updated admin user:', email)
  } else {
    await User.create({
      email,
      passwordHash,
      role: 'admin',
      firstName: 'Admin',
      lastName: 'User',
      phone: '',
      status: 'VERIFIED',
    })
    console.log('Created admin user:', email)
  }
  console.log('Use this password (set SEED_ADMIN_PASSWORD in .env to override):', password)
  await mongoose.disconnect()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
