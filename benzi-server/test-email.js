import 'dotenv/config'
import { connectDB } from './src/config/database.js'
import { send2FACode } from './src/services/emailService.js'
import './src/workers/emailWorker.js'

async function testEmail() {
  try {
    console.log('Connecting to database...')
    await connectDB()
    
    console.log('Sending test 2FA email...')
    const result = await send2FACode(
      'therealfaizyabahmad@gmail.com',
      'Test User',
      '123456',
      10
    )
    
    console.log('Email queued successfully:', result)
    console.log('Check your email inbox and the worker logs')
    
    // Wait 10 seconds for worker to process
    console.log('Waiting 10 seconds for worker to process...')
    await new Promise(resolve => setTimeout(resolve, 10000))
    
    console.log('Test complete. Check your email!')
    process.exit(0)
  } catch (error) {
    console.error('Test failed:', error)
    process.exit(1)
  }
}

testEmail()
