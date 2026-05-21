import 'dotenv/config'
import { connectDB } from './src/config/database.js'
import { sendPasswordResetEmail } from './src/services/emailService.js'
import './src/workers/emailWorker.js'

async function testPasswordReset() {
  try {
    console.log('Connecting to database...')
    await connectDB()
    
    console.log('Sending password reset email to sameedsaeed1246@gmail.com...')
    const resetUrl = 'https://benzi.mentalhealth:5173/reset-password?token=test-token-12345'
    
    const result = await sendPasswordResetEmail(
      'sameedsaeed1246@gmail.com',
      'Sameed',
      resetUrl,
      1
    )
    
    console.log('Password reset email queued:', result)
    console.log('Waiting 10 seconds for worker to process...')
    
    await new Promise(resolve => setTimeout(resolve, 10000))
    
    console.log('Done! Check sameedsaeed1246@gmail.com inbox (and spam folder)')
    process.exit(0)
  } catch (error) {
    console.error('Test failed:', error)
    process.exit(1)
  }
}

testPasswordReset()
