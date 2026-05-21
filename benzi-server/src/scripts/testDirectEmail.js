import 'dotenv/config'
import nodemailer from 'nodemailer'
import { smtpConfig, senderConfig } from '../config/email.js'

async function run() {
  console.log('Sending direct test email...')
  console.log('SMTP Config:', {
    host: smtpConfig.host,
    port: smtpConfig.port,
    secure: smtpConfig.secure,
    user: smtpConfig.auth.user,
  })

  const transporter = nodemailer.createTransport(smtpConfig)

  try {
    const info = await transporter.sendMail({
      from: `"${senderConfig.name}" <${senderConfig.address}>`,
      to: smtpConfig.auth.user, // Send to self
      subject: 'BENZI SMTP Test Direct Email',
      text: 'This is a direct test email to verify SMTP configuration.',
      html: '<b>This is a direct test email to verify SMTP configuration.</b>',
    })

    console.log('✅ Direct email sent successfully! MessageID:', info.messageId)
  } catch (error) {
    console.error('❌ Failed to send direct email:', error.message)
  }
}

run()
