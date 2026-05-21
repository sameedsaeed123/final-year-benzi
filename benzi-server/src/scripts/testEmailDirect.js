import 'dotenv/config'
import nodemailer from 'nodemailer'

const user = process.env.EMAIL_USER
const pass = process.env.EMAIL_PASSWORD

console.log('--- SMTP Config Debugger ---')
console.log('EMAIL_USER:', user)
console.log('EMAIL_PASSWORD length:', pass ? pass.length : 0)
if (pass) {
  console.log('Char codes:')
  for (let i = 0; i < pass.length; i++) {
    console.log(`Char at ${i}: '${pass[i]}' (code: ${pass.charCodeAt(i)})`)
  }
}

const transporter = nodemailer.createTransport({
  host: 'smtp.gmail.com',
  port: 587,
  secure: false,
  auth: {
    user,
    pass,
  },
})

async function run() {
  console.log('Testing verify()...')
  await transporter.verify()
  console.log('Verification Success!')
}

run().catch((err) => {
  console.error('SMTP test failed:', err.message)
})
