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
import {
  adminListPlans,
  adminUpdatePlan,
  adminListCoupons,
  adminCreateCoupon,
  adminUpdateCoupon,
  adminListAssignments,
  adminGetRevenueStats,
  adminListPayments,
  adminAssignSubscription,
} from '../controllers/adminSubscriptionController.js'
import { adminCache } from '../middleware/adminCache.js'

const router = express.Router()

// Secure all admin routes with JWT and admin role verification
router.use(verifyJWT)
router.use(requireRoles('admin'))

router.get('/dashboard', adminCache.dashboard, getDashboardStats)
router.get('/appointments', adminCache.list, getAdminAppointments)
router.get('/doctors', adminCache.list, getDoctorsList)
router.get('/tickets', adminCache.list, getTickets)
router.post('/tickets/:id/reply', replyToTicket)
router.patch('/tickets/:id/status', updateTicketStatus)
router.get('/pending-verifications', adminCache.list, getPendingVerifications)
router.post('/verify-therapist/:id', verifyTherapist)

// Email Admin Routes
router.get('/email/logs', adminCache.list, getEmailLogs)
router.get('/email/metrics', adminCache.list, getEmailMetrics)
router.post('/email/retry/:jobId', retryEmailJob)
router.post('/email/test-smtp', testSMTPSettings)

router.get('/subscription/plans', adminCache.list, adminListPlans)
router.patch('/subscription/plans/:slug', adminUpdatePlan)
router.get('/subscription/assignments', adminCache.list, adminListAssignments)
router.get('/subscription/coupons', adminCache.list, adminListCoupons)
router.post('/subscription/coupons', adminCreateCoupon)
router.patch('/subscription/coupons/:id', adminUpdateCoupon)
router.get('/subscription/revenue', adminCache.revenue, adminGetRevenueStats)
router.get('/subscription/payments', adminCache.list, adminListPayments)
router.post('/subscription/assign', adminAssignSubscription)

export default router
