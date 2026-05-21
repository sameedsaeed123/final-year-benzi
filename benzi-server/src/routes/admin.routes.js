import express from 'express'
import { verifyJWT, requireRoles } from '../middleware/verifyJWT.js'
import {
  getDashboardStats,
  getAdminAppointments,
  getDoctorsList,
  getTickets,
  replyToTicket,
  updateTicketStatus,
  getPendingVerifications,
  verifyTherapist,
  getEmailLogs,
  getEmailMetrics,
  retryEmailJob,
  testSMTPSettings
} from '../controllers/adminController.js'

const router = express.Router()

// Secure all admin routes with JWT and admin role verification
router.use(verifyJWT)
router.use(requireRoles('admin'))

router.get('/dashboard', getDashboardStats)
router.get('/appointments', getAdminAppointments)
router.get('/doctors', getDoctorsList)
router.get('/tickets', getTickets)
router.post('/tickets/:id/reply', replyToTicket)
router.patch('/tickets/:id/status', updateTicketStatus)
router.get('/pending-verifications', getPendingVerifications)
router.post('/verify-therapist/:id', verifyTherapist)

// Email Admin Routes
router.get('/email/logs', getEmailLogs)
router.get('/email/metrics', getEmailMetrics)
router.post('/email/retry/:jobId', retryEmailJob)
router.post('/email/test-smtp', testSMTPSettings)

export default router
