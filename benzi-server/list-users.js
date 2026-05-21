import 'dotenv/config'
import { connectDB } from './src/config/database.js'
import { User } from './src/models/User.js'

async function listUsers() {
  await connectDB()
  
  const users = await User.find().select('email firstName lastName role').limit(10).lean()
  
  console.log(`\n📋 Found ${users.length} users:\n`)
  users.forEach((user, i) => {
    console.log(`${i + 1}. ${user.email}`)
    console.log(`   Name: ${user.firstName} ${user.lastName}`)
    console.log(`   Role: ${user.role}`)
    console.log('')
  })
  
  console.log('💡 Use one of these emails to test forgot password')
  
  process.exit(0)
}

listUsers()
