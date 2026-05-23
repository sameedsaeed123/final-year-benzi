import { Router } from 'express'
import { verifyJWT, requireRoles } from '../middleware/verifyJWT.js'
import {
  listPlans,
  getMySubscription,
  validateCouponCode,
  activateFreePlan,
  createCheckout,
  confirmDevCheckout,
  verifyCheckoutSession,
  publicConfirmCheckoutSession,
} from '../controllers/subscriptionController.js'

const router = Router()

router.get('/plans', listPlans)

router.get('/public/session/:sessionId/confirm', publicConfirmCheckoutSession)

router.post('/coupons/validate', validateCouponCode)

router.get('/me', verifyJWT, requireRoles('therapist'), getMySubscription)
router.post('/activate-free', verifyJWT, requireRoles('therapist'), activateFreePlan)
router.post('/checkout', verifyJWT, requireRoles('therapist'), createCheckout)
router.post('/confirm-dev', verifyJWT, requireRoles('therapist'), confirmDevCheckout)
router.get(
  '/checkout-session/:sessionId',
  verifyJWT,
  requireRoles('therapist'),
  verifyCheckoutSession
)

export default router
