import 'dotenv/config'
import { connectDB } from './src/config/database.js'
import { User } from './src/models/User.js'

async function run() {
  await connectDB()
  
  const emails = ['sameedjutt2345@gmail.com', 'sameedsaeed1246@gmail.com']
  
  console.log('\n--- Checking Users ---')
  for (const email of emails) {
    const user = await User.findOne({ email: email.toLowerCase() })
    if (user) {
      console.log(`✅ User found for: ${email}`)
      console.log(`   ID: ${user._id}`)
      console.log(`   Email in DB: ${user.email}`)
      console.log(`   Name: ${user.firstName} ${user.lastName}`)
      console.log(`   Role: ${user.role}`)
      console.log(`   2FA Enabled: ${user.twoFactorEnabled}`)
    } else {
      console.log(`❌ User NOT found for: ${email}`)
    }
  }
  
  process.exit(0)
}

run()
