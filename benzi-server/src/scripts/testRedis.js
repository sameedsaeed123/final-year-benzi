import 'dotenv/config'
import Redis from 'ioredis'
import { redisConfig } from '../config/email.js'

async function run() {
  console.log('Testing Redis connection with config:', {
    host: redisConfig.host,
    port: redisConfig.port,
    db: redisConfig.db,
  })

  const redis = new Redis({
    ...redisConfig,
    connectTimeout: 5000,
  })

  redis.on('error', (err) => {
    console.error('❌ Redis client error event:', err.message)
  })

  try {
    const pong = await redis.ping()
    console.log(`✅ Redis ping success! Response: ${pong}`)
    await redis.quit()
  } catch (error) {
    console.error('❌ Redis ping failed:', error.message)
  }
}

run()
