import 'dotenv/config'
import { connectDB } from './src/config/database.js'
import { User } from './src/models/User.js'
import bcrypt from 'bcrypt'

async function createTestUser() {
  await connectDB()
  
  const email = 'sameedjutt2345@gmail.com'
  
  // Check if exists
  const existing = await User.findOne({ email })
  if (existing) {
    console.log('✅ User already exists:', email)
    process.exit(0)
  }
  
  // Create user
  const passwordHash = await bcrypt.hash('Test@1234', 12)
  
  const user = new User({
    email,
    passwordHash,
    firstName: 'Sameed',
    lastName: 'Jutt',
    role: 'therapist',
    isTemporaryPassword: false
  })
  
  await user.save()
  
  console.log('✅ User created successfully!')
  console.log('Email:', email)
  console.log('Password: Test@1234')
  console.log('\nNow you can test forgot password with this email!')
  
  process.exit(0)
}

createTestUser().catch(console.error)
