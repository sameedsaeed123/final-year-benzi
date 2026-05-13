import dotenv from 'dotenv'

dotenv.config()

const required = ['MONGODB_URI', 'JWT_SECRET', 'FRONTEND_URL']

export function validateEnv() {
  const missing = required.filter((k) => !process.env[k] || String(process.env[k]).trim() === '')
  if (missing.length) {
    throw new Error(`Missing required environment variables: ${missing.join(', ')}`)
  }
  if (String(process.env.JWT_SECRET).length < 32) {
    throw new Error('JWT_SECRET must be at least 32 characters')
  }
}

export const env = {
  NODE_ENV: process.env.NODE_ENV || 'development',
  PORT: Number(process.env.PORT) || 5000,
  /** Bind address. Use 0.0.0.0 in Docker/production; default 127.0.0.1 matches Vite proxy in dev. */
  LISTEN_HOST: process.env.LISTEN_HOST || '127.0.0.1',
  FRONTEND_URL: process.env.FRONTEND_URL,
  MONGODB_URI: process.env.MONGODB_URI,
  JWT_SECRET: process.env.JWT_SECRET,
  JWT_EXPIRES_IN_REMEMBER: process.env.JWT_EXPIRES_IN_REMEMBER || '7d',
  JWT_EXPIRES_IN_SESSION: process.env.JWT_EXPIRES_IN_SESSION || '1h',
}
