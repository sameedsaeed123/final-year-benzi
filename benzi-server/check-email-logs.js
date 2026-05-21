import 'dotenv/config'
import { connectDB } from './src/config/database.js'
import { EmailLog } from './src/models/EmailLog.js'

async function checkLogs() {
  try {
    await connectDB()
    
    console.log('\n📧 Recent Email Logs (Last 10):\n')
    const logs = await EmailLog.find()
      .sort({ createdAt: -1 })
      .limit(10)
      .lean()
    
    if (logs.length === 0) {
      console.log('No email logs found.')
    } else {
      logs.forEach((log, i) => {
        console.log(`${i + 1}. ${log.recipient}`)
        console.log(`   Status: ${log.status}`)
        console.log(`   Template: ${log.template}`)
        console.log(`   Priority: ${log.priority}`)
        console.log(`   Attempts: ${log.attempts}`)
        console.log(`   Created: ${log.createdAt}`)
        console.log(`   Sent: ${log.sentAt || 'Not sent yet'}`)
        if (log.error) console.log(`   Error: ${log.error}`)
        console.log('')
      })
      
      // Summary
      const statusCounts = logs.reduce((acc, log) => {
        acc[log.status] = (acc[log.status] || 0) + 1
        return acc
      }, {})
      
      console.log('📊 Status Summary:')
      Object.entries(statusCounts).forEach(([status, count]) => {
        console.log(`   ${status}: ${count}`)
      })
    }
    
    process.exit(0)
  } catch (error) {
    console.error('Error:', error)
    process.exit(1)
  }
}

checkLogs()
