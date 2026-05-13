import express from 'express'
import path from 'path'
import fs from 'fs'
import helmet from 'helmet'
import cors from 'cors'
import morgan from 'morgan'
import { env } from './config/environment.js'
import { apiLimiter } from './middleware/rateLimiters.js'
import { sendSuccess } from './utils/responseUtils.js'
import { errorHandler } from './middleware/errorHandler.js'
import authRoutes from './routes/auth.routes.js'
import appointmentRoutes from './routes/appointment.routes.js'
import patientRoutes from './routes/patient.routes.js'
import therapistRoutes from './routes/therapist.routes.js'

const app = express()

const uploadsRoot = path.join(process.cwd(), 'uploads')
fs.mkdirSync(path.join(uploadsRoot, 'profiles'), { recursive: true })
fs.mkdirSync(path.join(uploadsRoot, 'payments'), { recursive: true })

app.use(helmet({ crossOriginResourcePolicy: { policy: 'cross-origin' } }))
app.use(
  cors({
    origin: env.FRONTEND_URL,
    credentials: true,
    methods: ['GET', 'POST', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
)
app.use(morgan(env.NODE_ENV === 'production' ? 'combined' : 'dev'))
app.use(express.json({ limit: '1mb' }))

app.use('/api/files', express.static(uploadsRoot))

app.use('/api', apiLimiter)

app.get('/api/health', (req, res) => {
  return sendSuccess(res, { status: 'ok' }, 'OK', 200)
})

app.use('/api/auth', authRoutes)
app.use('/api/appointments', appointmentRoutes)
app.use('/api/patients', patientRoutes)
app.use('/api/therapists', therapistRoutes)

app.use((req, res) => {
  res.status(404).json({
    success: false,
    data: null,
    message: 'Not found',
    statusCode: 404,
  })
})

app.use(errorHandler)

export default app
