import 'dotenv/config'
import mongoose from 'mongoose'
import { connectDB } from '../config/database.js'
import emailService from '../services/emailService.js'

async function run() {
  console.log('Connecting to Mongo...')
  await connectDB()
  console.log('Sending direct password reset email to sameedsaeed1246@gmail.com...')
  const res = await emailService.sendPasswordResetEmail(
    'sameedsaeed1246@gmail.com',
    'Sameed Saeed',
    'http://localhost:3000/reset-password?token=testtokendirect',
    1
  )
  console.log('Result:', res)
  await mongoose.disconnect()
}

run().catch(console.error)
