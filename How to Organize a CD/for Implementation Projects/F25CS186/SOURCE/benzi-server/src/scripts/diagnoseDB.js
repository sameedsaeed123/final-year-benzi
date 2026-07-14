import 'dotenv/config'
import mongoose from 'mongoose'
import { normalizeMongoUri, ensureAuthSource } from '../config/database.js'

async function checkConnection(name, uri) {
  console.log(`\n🔍 Testing connection to [${name}]: ${uri.replace(/:[^:]+@/, ':****@')}`)
  try {
    const conn = await mongoose.connect(uri, { serverSelectionTimeoutMS: 5000 })
    console.log(`✅ [${name}] CONNECTED SUCCESSFULLY!`)
    await mongoose.disconnect()
    return true
  } catch (err) {
    console.error(`❌ [${name}] CONNECTION FAILED:`, err.message)
    return false
  }
}

async function main() {
  const currentUri = ensureAuthSource(normalizeMongoUri(process.env.MONGODB_URI))
  const localUri = 'mongodb://127.0.0.1:27017/benzi'

  const currentOk = await checkConnection('Current Configured URI', currentUri)
  const localOk = await checkConnection('Local Fallback MongoDB', localUri)

  console.log('\n--- DIAGNOSTIC SUMMARY ---')
  if (currentOk) {
    console.log('👉 Your currently configured remote database is working perfectly.')
  } else if (localOk) {
    console.log('👉 Your current remote database is UNREACHABLE, but a local MongoDB IS running and available!')
    console.log('💡 Recommendation: Change MONGODB_URI in benzi-server/.env to: mongodb://127.0.0.1:27017/benzi')
  } else {
    console.log('❌ Both remote and local database options are unreachable. Please ensure MongoDB is started locally or check your network/VPN.')
  }
}

main().catch(console.error)
