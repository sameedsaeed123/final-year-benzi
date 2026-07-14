import 'dotenv/config'
import http from 'http'
import app from './src/app.js'
import { validateEnv, env } from './src/config/environment.js'
import { connectDB } from './src/config/database.js'
import { initSocket } from './src/socket.js'
import { validateEmailConfig } from './src/config/email.js'
import './src/workers/emailWorker.js'
import { initReminderScheduler } from './src/services/appointmentReminderService.js'
import { initCompletionScheduler } from './src/services/appointmentCompletionService.js'

async function retryPendingRedactions() {
  try {
    const { Record } = await import('./src/models/Record.js')
    const { User } = await import('./src/models/User.js')
    const { triggerRedactionForRecord } = await import('./src/services/recordService.js').catch(() => null) || {}

    // Use the service's internal retry function via the public API
    const { retryRedactionForPatient } = await import('./src/services/recordService.js')

    // Find all anonymous patients with pending/failed records
    const pendingRecords = await Record.find({
      isAnonymous: true,
      redactionStatus: { $in: ['PENDING', 'FAILED'] },
      deletedAt: null,
    }).select('patientUserId').lean()

    const patientIds = [...new Set(pendingRecords.map((r) => String(r.patientUserId)))]
    if (patientIds.length > 0) {
      console.log(`[startup] Retrying redaction for ${patientIds.length} patient(s) with pending records…`)
      for (const pid of patientIds) {
        void retryRedactionForPatient(pid)
      }
    }
  } catch (e) {
    console.error('[startup] Redaction retry error:', e.message)
  }
}

async function writeEmailDiagnostics() {
  try {
    const { EmailLog } = await import('./src/models/EmailLog.js')
    const logs = await EmailLog.find({}).sort({ createdAt: -1 }).limit(10).lean()
    
    let content = `=== BENZI STARTUP EMAIL LOG DIAGNOSTICS (GENERATED AT: ${new Date().toISOString()}) ===\n\n`
    if (logs.length === 0) {
      content += 'No email logs found in the database.\n'
    } else {
      logs.forEach((log, index) => {
        content += `[${index + 1}] ID: ${log._id}\n`
        content += `Recipient: ${log.recipient}\n`
        content += `Subject: ${log.subject}\n`
        content += `Status: ${log.status}\n`
        content += `Attempts: ${log.attempts}\n`
        content += `Created At: ${log.createdAt?.toISOString()}\n`
        if (log.error) {
          content += `Error: ${log.error}\n`
        }
        content += '-------------------------------------------\n'
      })
    }
    
    const fs = await import('fs')
    fs.writeFileSync('./email-diagnostics-output.txt', content, 'utf8')
    console.log('[diagnostics] Saved email logs to email-diagnostics-output.txt')
  } catch (err) {
    console.error('[diagnostics] Failed to write email logs:', err.message)
  }
}

async function main() {
  validateEnv()
  validateEmailConfig() // Enforce SMTP/Email configuration validation on startup
  await connectDB()
  
  initReminderScheduler() // Initialize Node-Cron appointment reminder scan scheduler
  initCompletionScheduler() // Auto-complete CONFIRMED appointments after end time
  
  const httpServer = http.createServer(app)
  initSocket(httpServer)
  const host = env.LISTEN_HOST
  let retries = 5
  function start() {
    const server = httpServer.listen(env.PORT, host, () => {
      console.log(`Benzi API listening on http://${host}:${env.PORT}`)
      void retryPendingRedactions()
      void writeEmailDiagnostics()
    })

    server.on('error', (err) => {
      if (err.code === 'EADDRINUSE' && retries > 0) {
        retries--
        console.warn(`[Benzi API] Port ${env.PORT} is busy, retrying in 1 second... (${retries} retries left)`)
        setTimeout(start, 1000)
      } else {
        console.error(
          `[Benzi API] Port ${env.PORT} is already in use on ${host}. Stop the other process (e.g. lsof -i :${env.PORT}) or set PORT in benzi-server/.env`
        )
        process.exit(1)
      }
    })
  }

  start()
}

main().catch((err) => {
  console.error(err)
  process.exit(1)
})

// Watcher trigger comment v2
