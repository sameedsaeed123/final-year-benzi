import 'dotenv/config'
import { connectDB } from './src/config/database.js'
import { sendPasswordResetEmail } from './src/services/emailService.js'
import './src/workers/emailWorker.js'
import { EmailLog } from './src/models/EmailLog.js'

async function testViaQueue() {
  try {
    await connectDB()
    
    console.log('=== TESTING EMAIL VIA QUEUE SYSTEM ===\n')
    console.log('Sending to: sameedjutt2345@gmail.com')
    console.log('Method: Application queue system (BullMQ + Worker)\n')
    
    const resetUrl = 'https://benzi.mentalhealth:5173/reset-password?token=test-abc123'
    
    const result = await sendPasswordResetEmail(
      'sameedjutt2345@gmail.com',
      'Sameed Jutt',
      resetUrl,
      1
    )
    
    console.log('✅ Email queued:', result)
    console.log('\nWaiting 15 seconds for worker to process...\n')
    
    await new Promise(resolve => setTimeout(resolve, 15000))
    
    // Check the log
    const log = await EmailLog.findOne({ jobId: result.jobId })
    
    console.log('=== EMAIL LOG ===')
    console.log('Status:', log.status)
    console.log('Recipient:', log.recipient)
    console.log('Template:', log.template)
    console.log('Attempts:', log.attempts)
    console.log('Sent At:', log.sentAt)
    console.log('Error:', log.error || 'None')
    console.log('')
    
    if (log.status === 'sent') {
      console.log('✅ Email was SENT successfully by worker')
      console.log('📧 Check sameedjutt2345@gmail.com inbox and spam')
      console.log('')
      console.log('If you received the direct test but not this one:')
      console.log('- The issue is in the EMAIL CONTENT or HEADERS')
      console.log('- Gmail may be filtering based on content')
      console.log('- Check for spam trigger words in template')
    } else {
      console.log('❌ Email was NOT sent')
      console.log('Error:', log.error)
    }
    
    process.exit(0)
  } catch (error) {
    console.error('Test failed:', error)
    process.exit(1)
  }
}

testViaQueue()
