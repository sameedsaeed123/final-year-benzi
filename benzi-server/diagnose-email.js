import 'dotenv/config'
import nodemailer from 'nodemailer'
import { smtpConfig, senderConfig } from './src/config/email.js'

async function diagnoseEmail() {
  console.log('=== EMAIL DIAGNOSIS ===\n')
  
  console.log('1. SMTP Configuration:')
  console.log('   Host:', smtpConfig.host)
  console.log('   Port:', smtpConfig.port)
  console.log('   Secure:', smtpConfig.secure)
  console.log('   User:', smtpConfig.auth.user)
  console.log('   Password:', smtpConfig.auth.pass ? '***' + smtpConfig.auth.pass.slice(-4) : 'NOT SET')
  console.log('')
  
  console.log('2. Sender Configuration:')
  console.log('   Name:', senderConfig.name)
  console.log('   Address:', senderConfig.address)
  console.log('')
  
  console.log('3. Testing SMTP Connection...')
  const transporter = nodemailer.createTransport(smtpConfig)
  
  try {
    await transporter.verify()
    console.log('   ✅ SMTP connection successful')
  } catch (error) {
    console.log('   ❌ SMTP connection failed:', error.message)
    process.exit(1)
  }
  
  console.log('')
  console.log('4. Sending test email to sameedjutt2345@gmail.com...')
  
  try {
    const info = await transporter.sendMail({
      from: `"${senderConfig.name}" <${senderConfig.address}>`,
      to: 'sameedjutt2345@gmail.com',
      subject: 'BENZI Email System Test - Direct Send',
      html: `
        <div style="font-family: Arial, sans-serif; padding: 20px;">
          <h2 style="color: #4A90E2;">BENZI Email Test</h2>
          <p>This is a direct test email sent at ${new Date().toLocaleString()}</p>
          <p>If you receive this, the email system is working correctly.</p>
          <hr>
          <p style="color: #666; font-size: 12px;">
            From: ${senderConfig.address}<br>
            SMTP: ${smtpConfig.host}:${smtpConfig.port}
          </p>
        </div>
      `,
      text: `BENZI Email Test\n\nThis is a direct test email sent at ${new Date().toLocaleString()}\n\nIf you receive this, the email system is working correctly.`
    })
    
    console.log('   ✅ Email sent successfully!')
    console.log('   Message ID:', info.messageId)
    console.log('   Response:', info.response)
    console.log('')
    console.log('5. Email Details:')
    console.log('   Accepted:', info.accepted)
    console.log('   Rejected:', info.rejected)
    console.log('   Pending:', info.pending)
    console.log('')
    console.log('✅ DIAGNOSIS COMPLETE')
    console.log('')
    console.log('📧 Check sameedjutt2345@gmail.com inbox AND spam folder')
    console.log('⏱️  Email may take 1-5 minutes to arrive')
    console.log('')
    console.log('If still not receiving:')
    console.log('1. Check Gmail spam/junk folder')
    console.log('2. Search for "BENZI" in Gmail')
    console.log('3. Check Gmail filters (Settings > Filters)')
    console.log('4. Verify Gmail storage not full')
    console.log('5. Try different email address')
    
  } catch (error) {
    console.log('   ❌ Email send failed:', error.message)
    console.log('   Error details:', error)
  }
  
  process.exit(0)
}

diagnoseEmail()
