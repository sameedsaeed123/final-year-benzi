import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from '../config/database.js'
import { User } from '../models/User.js'

async function check() {
  await connectDB()
  const users = await User.find().lean()
  console.log('='.repeat(80))
  console.log(`TOTAL USERS IN DB: ${users.length}`)
  console.log('='.repeat(80))
  for (const user of users) {
    console.log(`ID: ${user._id}`)
    console.log(`Name: ${user.firstName} ${user.lastName}`)
    console.log(`Email: ${user.email}`)
    console.log(`Status: ${user.status}`)
    console.log(`Role: ${user.role}`)
    console.log('-'.repeat(80))
  }
  await mongoose.disconnect()
}

check()
