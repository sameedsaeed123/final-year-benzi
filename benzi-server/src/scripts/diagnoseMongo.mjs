/**
 * Quick Mongo connectivity check using your .env (or env vars).
 * Run: cd benzi-server && npm run diagnose:mongo
 */
import 'dotenv/config'
import mongoose from 'mongoose'
import { normalizeMongoUri, ensureAuthSource } from '../config/database.js'

const ms = Number(process.env.MONGODB_SERVER_SELECTION_MS) || 8000

async function main() {
  if (!process.env.MONGODB_URI) {
    console.error('Set MONGODB_URI in benzi-server/.env (copy from .env.example).')
    process.exit(1)
  }
  const uri = ensureAuthSource(normalizeMongoUri(process.env.MONGODB_URI))
  console.log('Connecting (timeout', ms, 'ms)...')
  console.log('Using URI host (redacted):', uri.replace(/\/\/([^:]+):[^@]+@/, '//***:***@'))

  try {
    await mongoose.connect(uri, { serverSelectionTimeoutMS: ms, maxPoolSize: 2 })
    console.log('SUCCESS: MongoDB is reachable. Database:', mongoose.connection?.db?.databaseName)
  } catch (e) {
    console.error('FAILED:', e.message)
    console.error('Hints: Is Mongo running? Correct port (often 27017)? Firewall/VPN? authSource for user root?')
    process.exit(1)
  } finally {
    await mongoose.disconnect().catch(() => {})
  }
}

main()
