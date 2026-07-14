import 'dotenv/config'
import { connectDB } from './src/config/database.js'
import { User } from './src/models/User.js'

async function listAllUsers() {
  await connectDB()
  
  const users = await User.find().select('email firstName lastName role').lean()
  
  console.log(`\n📋 Total users in database: ${users.length}\n`)
  
  const therapists = users.filter(u => u.role === 'therapist')
  const patients = users.filter(u => u.role === 'patient')
  const admins = users.filter(u => u.role === 'admin')
  
  console.log(`👨‍⚕️ Therapists (${therapists.length}):`)
  therapists.forEach((user, i) => {
    console.log(`   ${i + 1}. ${user.email} - ${user.firstName} ${user.lastName}`)
  })
  
  console.log(`\n👤 Patients (${patients.length}):`)
  patients.forEach((user, i) => {
    console.log(`   ${i + 1}. ${user.email} - ${user.firstName} ${user.lastName}`)
  })
  
  console.log(`\n👑 Admins (${admins.length}):`)
  admins.forEach((user, i) => {
    console.log(`   ${i + 1}. ${user.email} - ${user.firstName} ${user.lastName}`)
  })
  
  console.log('\n🔍 Searching for sameedjutt2345@gmail.com...')
  const target = users.find(u => u.email.toLowerCase() === 'sameedjutt2345@gmail.com')
  if (target) {
    console.log('✅ FOUND:', target.email, '-', target.firstName, target.lastName)
  } else {
    console.log('❌ NOT FOUND - This email is not registered')
  }
  
  process.exit(0)
}

listAllUsers()
