/**
 * Automated smoke test: in-memory Mongo + Express app (no Docker).
 * Run: cd benzi-server && npm run test:api
 */
import http from 'http'
import mongoose from 'mongoose'
import { MongoMemoryServer } from 'mongodb-memory-server'

const JWT_TEST = '01234567890123456789012345678901'

async function main() {
  const mem = await MongoMemoryServer.create({
    instance: { startTimeout: 120000 },
  })
  const baseUri = mem.getUri().replace(/\/$/, '')
  process.env.MONGODB_URI = `${baseUri}/benzi_smoke`
  process.env.JWT_SECRET = JWT_TEST
  process.env.FRONTEND_URL = 'http://localhost:5173'
  process.env.NODE_ENV = 'test'

  const { validateEnv } = await import('../config/environment.js')
  validateEnv()

  const { connectDB } = await import('../config/database.js')
  const { default: app } = await import('../app.js')

  await connectDB()

  const server = http.createServer(app)
  await new Promise((resolve, reject) => {
    server.listen(0, '127.0.0.1', (err) => (err ? reject(err) : resolve()))
  })
  const { port } = server.address()

  const base = `http://127.0.0.1:${port}`

  const reg = await fetch(`${base}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      firstName: 'Smoke',
      lastName: 'User',
      email: 'smoke-patient@example.com',
      phone: '+10000000000',
      password: 'SmokeTest1!',
      confirmPassword: 'SmokeTest1!',
      role: 'patient',
    }),
  })
  const regJson = await reg.json()
  if (!reg.ok || !regJson.success || !regJson.data?.accessToken) {
    console.error('REGISTER FAILED', reg.status, regJson)
    process.exitCode = 1
    return
  }
  console.log('OK register ->', regJson.data.user.role)

  const login = await fetch(`${base}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      email: 'smoke-patient@example.com',
      password: 'SmokeTest1!',
      remember: false,
      expectedPortal: 'patient',
    }),
  })
  const loginJson = await login.json()
  if (!login.ok || !loginJson.success || !loginJson.data?.accessToken) {
    console.error('LOGIN FAILED', login.status, loginJson)
    process.exitCode = 1
    return
  }
  const token = loginJson.data.accessToken

  const me = await fetch(`${base}/api/auth/me`, {
    headers: { Authorization: `Bearer ${token}` },
  })
  const meJson = await me.json()
  if (!me.ok || !meJson.success || meJson.data?.user?.email !== 'smoke-patient@example.com') {
    console.error('ME FAILED', me.status, meJson)
    process.exitCode = 1
    return
  }
  console.log('OK login + /auth/me')

  const health = await fetch(`${base}/api/health`)
  const healthJson = await health.json()
  if (!health.ok || !healthJson.success) {
    console.error('HEALTH FAILED', healthJson)
    process.exitCode = 1
    return
  }
  console.log('OK /api/health')

  const dir = await fetch(`${base}/api/therapists/directory?city=Lahore&limit=5&skip=0`)
  const dirJson = await dir.json()
  if (!dir.ok || !dirJson.success || !Array.isArray(dirJson.data?.therapists) || typeof dirJson.data?.total !== 'number') {
    console.error('THERAPIST DIRECTORY FAILED', dir.status, dirJson)
    process.exitCode = 1
    return
  }
  console.log('OK GET /api/therapists/directory')

  await new Promise((r) => server.close(r))
  await mongoose.disconnect()
  await mem.stop()
  console.log('All API smoke checks passed.')
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})
