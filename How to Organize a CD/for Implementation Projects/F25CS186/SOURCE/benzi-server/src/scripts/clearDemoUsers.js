import 'dotenv/config'
import mongoose from 'mongoose'
import { User } from '../models/User.js'
import { Therapist } from '../models/Therapist.js'
import { Patient } from '../models/Patient.js'
import { Service } from '../models/Service.js'
import { Ticket } from '../models/Ticket.js'
import { normalizeMongoUri, ensureAuthSource } from '../config/database.js'

async function run() {
  if (!process.env.MONGODB_URI) {
    console.error('MONGODB_URI is required')
    process.exit(1)
  }
  const uri = ensureAuthSource(normalizeMongoUri(process.env.MONGODB_URI))
  await mongoose.connect(uri)

  console.log('Purging all patient and therapist records from the database...')

  // Delete all users except admins
  const deletedUsers = await User.deleteMany({ role: { $ne: 'admin' } })
  console.log(`Deleted ${deletedUsers.deletedCount} User records.`)

  // Delete all profiles
  const deletedTherapists = await Therapist.deleteMany({})
  console.log(`Deleted ${deletedTherapists.deletedCount} Therapist records.`)

  const deletedPatients = await Patient.deleteMany({})
  console.log(`Deleted ${deletedPatients.deletedCount} Patient records.`)

  // Delete associated records
  const deletedServices = await Service.deleteMany({})
  console.log(`Deleted ${deletedServices.deletedCount} Service records.`)

  const deletedTickets = await Ticket.deleteMany({})
  console.log(`Deleted ${deletedTickets.deletedCount} Support Ticket records.`)

  console.log('Database clean completed successfully!')
  await mongoose.disconnect()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
