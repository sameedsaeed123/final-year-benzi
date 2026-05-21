import 'dotenv/config'
import { connectDB } from './src/config/database.js'
import { User } from './src/models/User.js'

async function checkUser() {
  await connectDB()
  
  const email = 'sameedjutt2345@gmail.com'
  const user = await User.findOne({ email: email.toLowerCase() })
  
  if (user) {
    console.log('✅ User EXISTS')
    console.log('Name:', user.firstName, user.lastName)
    console.log('Email:', user.email)
    console.log('Role:', user.role)
  } else {
    console.log('❌ User NOT FOUND')
    console.log('Email:', email)
    console.log('\nThe forgot password form will NOT send email if user doesn\'t exist')
    console.log('This is a security feature to prevent email enumeration')
  }
  
  process.exit(0)
}

checkUser()
