import 'dotenv/config'
import mongoose from 'mongoose'
import { User } from '../models/User.js'
import { Patient } from '../models/Patient.js'
import { Appointment } from '../models/Appointment.js'
import { Message } from '../models/Message.js'
import { Record } from '../models/Record.js'
import { PatientAiStats } from '../models/PatientAiStats.js'
import { normalizeMongoUri, ensureAuthSource } from '../config/database.js'

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is required')
    process.exit(1)
  }
  const uri = ensureAuthSource(normalizeMongoUri(process.env.MONGODB_URI))
  
  console.log(`Connecting to MongoDB at: ${uri.replace(/:[^:]+@/, ':****@')}`)
  await mongoose.connect(uri)

  console.log('\n🧹 Purging all patient records and related data from the database...')

  // 1. Delete all Patient profile records
  const deletedPatients = await Patient.deleteMany({})
  console.log(`- Deleted ${deletedPatients.deletedCount} Patient profile records.`)

  // 2. Delete all Users with role 'patient'
  const deletedUsers = await User.deleteMany({ role: 'patient' })
  console.log(`- Deleted ${deletedUsers.deletedCount} User accounts (role: 'patient').`)

  // 3. Delete all Appointments
  const deletedAppointments = await Appointment.deleteMany({})
  console.log(`- Deleted ${deletedAppointments.deletedCount} Appointment records.`)

  // 4. Delete all chat messages
  const deletedMessages = await Message.deleteMany({})
  console.log(`- Deleted ${deletedMessages.deletedCount} Message records.`)

  // 5. Delete all Records
  const deletedRecords = await Record.deleteMany({})
  console.log(`- Deleted ${deletedRecords.deletedCount} Record documents.`)

  // 6. Delete all Patient AI stats
  const deletedStats = await PatientAiStats.deleteMany({})
  console.log(`- Deleted ${deletedStats.deletedCount} PatientAiStats documents.`)

  console.log('\n✅ Database cleanup completed successfully!')
  await mongoose.disconnect()
}

run().catch((e) => {
  console.error('Cleanup script failed:', e.message)
  process.exit(1)
})
