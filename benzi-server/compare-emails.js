import 'dotenv/config'
import { renderTemplate } from './src/services/templateService.js'

async function compareEmails() {
  console.log('=== COMPARING EMAIL CONTENT ===\n')
  
  // Render the password reset template
  const rendered = await renderTemplate('password-reset', {
    recipientName: 'Sameed Jutt',
    resetUrl: 'https://benzi.mentalhealth:5173/reset-password?token=test-abc123',
    resetCode: 'ABC123',
    expiryHours: 1
  })
  
  console.log('Subject:', rendered.subject)
  console.log('\n--- HTML Content (first 500 chars) ---')
  console.log(rendered.html.substring(0, 500))
  console.log('\n--- Text Content ---')
  console.log(rendered.text)
  console.log('\n=== POTENTIAL SPAM TRIGGERS ===')
  
  const spamWords = [
    'click here', 'verify', 'urgent', 'act now', 'limited time',
    'congratulations', 'winner', 'free', 'cash', 'prize'
  ]
  
  const content = (rendered.html + rendered.text + rendered.subject).toLowerCase()
  const found = spamWords.filter(word => content.includes(word))
  
  if (found.length > 0) {
    console.log('⚠️  Found potential spam triggers:', found.join(', '))
  } else {
    console.log('✅ No obvious spam trigger words found')
  }
  
  console.log('\n=== CHECKING URLS ===')
  const urls = rendered.html.match(/https?:\/\/[^\s"<>]+/g) || []
  console.log('URLs in email:', urls)
  
  if (urls.some(url => url.includes(':5173'))) {
    console.log('⚠️  WARNING: Using port :5173 in URL')
    console.log('   Gmail may flag non-standard ports as suspicious')
  }
  
  if (urls.some(url => url.includes('benzi.mentalhealth'))) {
    console.log('⚠️  WARNING: Using .mentalhealth TLD')
    console.log('   Gmail may not recognize this TLD')
  }
  
  process.exit(0)
}

compareEmails().catch(console.error)
