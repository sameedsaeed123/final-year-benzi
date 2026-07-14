import http from 'http'

async function testForgotPasswordAPI() {
  console.log('=== TESTING FORGOT PASSWORD API ===\n')
  
  const email = 'sameedjutt2345@gmail.com'
  console.log('Testing with email:', email)
  console.log('Sending POST to: http://127.0.0.1:5000/api/auth/forgot-password\n')
  
  const postData = JSON.stringify({ email })
  
  const options = {
    hostname: '127.0.0.1',
    port: 5000,
    path: '/api/auth/forgot-password',
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Content-Length': Buffer.byteLength(postData)
    }
  }
  
  const req = http.request(options, (res) => {
    let data = ''
    
    res.on('data', (chunk) => {
      data += chunk
    })
    
    res.on('end', () => {
      console.log('Response Status:', res.statusCode)
      console.log('Response Body:', data)
      console.log('')
      
      if (res.statusCode === 200) {
        console.log('✅ API call successful')
        console.log('📧 Email should be queued')
        console.log('⏱️  Wait 10-15 seconds then check:')
        console.log('   1. sameedjutt2345@gmail.com inbox')
        console.log('   2. Run: node check-email-logs.js')
      } else {
        console.log('❌ API call failed')
      }
      
      process.exit(0)
    })
  })
  
  req.on('error', (error) => {
    console.error('❌ Request failed:', error.message)
    console.log('\nIs the server running? Check with: lsof -i :5000')
    process.exit(1)
  })
  
  req.write(postData)
  req.end()
}

testForgotPasswordAPI()
