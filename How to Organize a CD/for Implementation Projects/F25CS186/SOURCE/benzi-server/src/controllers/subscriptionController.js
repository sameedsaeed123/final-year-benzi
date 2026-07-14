import { User } from '../models/User.js'
import { StripeWebhookEvent } from '../models/StripeWebhookEvent.js'
import { sendSuccess, sendError } from '../utils/responseUtils.js'
import {
  listActivePlans,
  getPlanBySlug,
  getTherapistSubscription,
  applySubscriptionToTherapist,
  validateCoupon,
  incrementCouponRedemption,
  planToPublic,
} from '../services/subscriptionService.js'
import {
  createCheckoutSession,
  constructWebhookEvent,
  isStripeConfigured,
  retrieveCheckoutSession,
  getStripe,
} from '../services/stripeService.js'
import { getUsageSummary } from '../services/subscriptionLimitsService.js'
import { Coupon } from '../models/Coupon.js'
import { resolveFrontendBaseUrl } from '../utils/frontendUrl.js'

export function stripeConfiguredForCheckout() {
  return Boolean(getStripe())
}

export async function listPlans(req, res, next) {
  try {
    const plans = await listActivePlans()
    return sendSuccess(
      res,
      { plans, stripeEnabled: stripeConfiguredForCheckout(), webhooksReady: isStripeConfigured() },
      'OK',
      200
    )
  } catch (e) {
    next(e)
  }
}

export async function getMySubscription(req, res, next) {
  try {
    if (req.user.role !== 'therapist') {
      return sendError(res, 'Therapists only', 403)
    }
    const sub = await getTherapistSubscription(req.user.id)
    const usage = await getUsageSummary(req.user.id)
    return sendSuccess(res, { subscription: sub, usage }, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function validateCouponCode(req, res, next) {
  try {
    const { code, planSlug } = req.body || {}
    if (!planSlug) return sendError(res, 'planSlug is required', 400)
    const result = await validateCoupon(code, planSlug)
    return sendSuccess(res, result, 'OK', 200)
  } catch (e) {
    next(e)
  }
}

export async function activateFreePlan(req, res, next) {
  try {
    if (req.user.role !== 'therapist') {
      return sendError(res, 'Therapists only', 403)
    }
    const planSlug = String(req.body?.planSlug || 'try-free')
    const plan = await getPlanBySlug(planSlug)
    if (!plan) return sendError(res, 'Plan not found', 404)
    if (plan.priceMonthlyCents > 0 || plan.priceYearlyCents > 0) {
      return sendError(res, 'This plan requires checkout', 400)
    }

    const sub = await applySubscriptionToTherapist(req.user.id, plan, {
      billingInterval: 'free',
      status: 'active',
    })

    return sendSuccess(
      res,
      { subscription: sub, plan: planToPublic(plan), usage: await getUsageSummary(req.user.id) },
      'Free plan activated',
      200
    )
  } catch (e) {
    next(e)
  }
}

export async function createCheckout(req, res, next) {
  try {
    if (req.user.role !== 'therapist') {
      return sendError(res, 'Therapists only', 403)
    }

    const planSlug = String(req.body?.planSlug || '')
    const billingInterval = req.body?.billingInterval === 'yearly' ? 'yearly' : 'monthly'
    const couponCode = String(req.body?.couponCode || '').trim()

    const plan = await getPlanBySlug(planSlug)
    if (!plan) return sendError(res, 'Plan not found', 404)

    const baseCents =
      billingInterval === 'yearly' ? plan.priceYearlyCents : plan.priceMonthlyCents

    if (baseCents <= 0) {
      return sendError(res, 'Use activate-free for this plan', 400)
    }

    let couponDoc = null
    if (couponCode) {
      const v = await validateCoupon(couponCode, planSlug)
      if (!v.valid) return sendError(res, v.message, 400)
      couponDoc = await Coupon.findOne({ code: couponCode.toUpperCase() }).lean()
    }

    const user = await User.findById(req.user.id).select('email').lean()
    const frontend = resolveFrontendBaseUrl(req)

    const session = await createCheckoutSession({
      therapistUserId: req.user.id,
      email: user?.email,
      plan,
      billingInterval,
      successUrl: `${frontend}/therapist-checkout/success?plan=${planSlug}&interval=${billingInterval}&session_id={CHECKOUT_SESSION_ID}`,
      cancelUrl: `${frontend}/therapist-checkout?plan=${planSlug}&interval=${billingInterval}`,
      coupon: couponDoc,
    })

    return sendSuccess(
      res,
      { checkoutUrl: session.url, sessionId: session.sessionId, mode: session.mode },
      'Checkout created',
      200
    )
  } catch (e) {
    next(e)
  }
}

async function applyCheckoutSessionFromStripe(session, query = {}) {
  const paid = session.payment_status === 'paid' || session.status === 'complete'
  if (!paid) {
    return { activated: false, paymentStatus: session.payment_status }
  }

  const therapistUserId = session.metadata?.therapistUserId || session.client_reference_id
  const planSlug = session.metadata?.planSlug || query.plan || 'benzi-pro'
  const billingInterval = session.metadata?.billingInterval || query.interval || 'monthly'
  const plan = await getPlanBySlug(planSlug)
  if (!therapistUserId || !plan) {
    const err = new Error('Could not resolve therapist or plan from checkout session')
    err.statusCode = 400
    throw err
  }

  await applySubscriptionToTherapist(therapistUserId, plan, {
    billingInterval: billingInterval === 'yearly' ? 'yearly' : 'monthly',
    status: 'active',
    stripeCustomerId: String(session.customer || ''),
    stripeSubscriptionId: String(session.subscription || ''),
    amountPaidCents: session.amount_total || 0,
    couponCode: session.metadata?.couponCode || '',
  })
  if (session.metadata?.couponCode) {
    await incrementCouponRedemption(session.metadata.couponCode)
  }

  return {
    activated: true,
    planSlug: plan.slug,
    planName: plan.name,
    billingInterval,
    therapistUserId: String(therapistUserId),
    paymentStatus: session.payment_status,
  }
}

/** After Stripe redirect — no login required (session id is the secret). */
export async function publicConfirmCheckoutSession(req, res, next) {
  try {
    const sessionId = String(req.params.sessionId || '')
    if (!sessionId) return sendError(res, 'sessionId required', 400)

    if (sessionId.startsWith('dev_')) {
      return sendSuccess(
        res,
        { activated: false, mode: 'dev', message: 'Use logged-in confirm for dev sessions' },
        'OK',
        200
      )
    }

    const session = await retrieveCheckoutSession(sessionId)
    if (!session) {
      return sendError(res, 'Stripe not configured on server', 503)
    }

    const result = await applyCheckoutSessionFromStripe(session, req.query)
    return sendSuccess(res, result, result.activated ? 'Subscription activated' : 'Payment pending', 200)
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function verifyCheckoutSession(req, res, next) {
  try {
    if (req.user.role !== 'therapist') {
      return sendError(res, 'Therapists only', 403)
    }
    const sessionId = String(req.params.sessionId || '')
    if (!sessionId) return sendError(res, 'sessionId required', 400)

    if (sessionId.startsWith('dev_')) {
      const planSlug = req.query?.plan || 'benzi-pro'
      const billingInterval = req.query?.interval === 'yearly' ? 'yearly' : 'monthly'
      const plan = await getPlanBySlug(planSlug)
      if (plan) {
        await applySubscriptionToTherapist(req.user.id, plan, {
          billingInterval,
          status: 'active',
          amountPaidCents:
            billingInterval === 'yearly' ? plan.priceYearlyCents : plan.priceMonthlyCents,
        })
      }
      const sub = await getTherapistSubscription(req.user.id)
      return sendSuccess(res, { subscription: sub, mode: 'dev' }, 'OK', 200)
    }

    const session = await retrieveCheckoutSession(sessionId)
    if (!session) {
      return sendError(res, 'Stripe not configured', 503)
    }

    if (String(session.client_reference_id) !== String(req.user.id)) {
      return sendError(res, 'Session does not belong to this account', 403)
    }

    await applyCheckoutSessionFromStripe(session, req.query)

    const sub = await getTherapistSubscription(req.user.id)
    return sendSuccess(
      res,
      {
        subscription: sub,
        usage: await getUsageSummary(req.user.id),
        paymentStatus: session.payment_status,
      },
      'OK',
      200
    )
  } catch (e) {
    if (e.statusCode) return sendError(res, e.message, e.statusCode)
    next(e)
  }
}

export async function confirmDevCheckout(req, res, next) {
  try {
    if (req.user.role !== 'therapist') {
      return sendError(res, 'Therapists only', 403)
    }
    if (stripeConfiguredForCheckout()) {
      return sendError(res, 'Stripe is configured — complete payment via checkout', 400)
    }
    const planSlug = String(req.query?.plan || req.body?.planSlug || 'benzi-pro')
    const billingInterval = req.query?.interval === 'yearly' ? 'yearly' : 'monthly'
    const plan = await getPlanBySlug(planSlug)
    if (!plan) return sendError(res, 'Plan not found', 404)

    await applySubscriptionToTherapist(req.user.id, plan, {
      billingInterval,
      status: 'active',
      amountPaidCents:
        billingInterval === 'yearly' ? plan.priceYearlyCents : plan.priceMonthlyCents,
    })

    const sub = await getTherapistSubscription(req.user.id)
    return sendSuccess(res, { subscription: sub }, 'Subscription active (dev mode)', 200)
  } catch (e) {
    next(e)
  }
}

async function handleCheckoutCompleted(session) {
  try {
    await applyCheckoutSessionFromStripe(session, {
      plan: session.metadata?.planSlug,
      interval: session.metadata?.billingInterval,
    })
  } catch (err) {
    console.error('[Stripe] checkout.session.completed apply failed:', err.message)
  }
}

async function handleSubscriptionChange(sub) {
  const therapistUserId = sub.metadata?.therapistUserId
  const planSlug = sub.metadata?.planSlug
  const plan = planSlug ? await getPlanBySlug(planSlug) : null
  if (!therapistUserId || !plan) return

  const active = ['active', 'trialing'].includes(sub.status)
  await applySubscriptionToTherapist(therapistUserId, plan, {
    billingInterval: sub.metadata?.billingInterval || 'monthly',
    status: active ? sub.status : 'canceled',
    stripeCustomerId: String(sub.customer || ''),
    stripeSubscriptionId: sub.id,
    currentPeriodStart: sub.current_period_start
      ? new Date(sub.current_period_start * 1000)
      : new Date(),
    currentPeriodEnd: sub.current_period_end
      ? new Date(sub.current_period_end * 1000)
      : null,
    cancelAtPeriodEnd: Boolean(sub.cancel_at_period_end),
  })

  if (sub.status === 'canceled' || sub.status === 'unpaid') {
    const freePlan = await getPlanBySlug('try-free')
    if (freePlan) {
      await applySubscriptionToTherapist(therapistUserId, freePlan, {
        billingInterval: 'free',
        status: 'active',
      })
    }
  }
}

export async function stripeWebhook(req, res) {
  if (!env.STRIPE_WEBHOOK_SECRET) {
    return res.status(503).send('Webhook secret not configured')
  }

  const sig = req.headers['stripe-signature']
  let event
  try {
    event = constructWebhookEvent(req.body, sig)
  } catch (err) {
    console.error('[Stripe webhook] verify failed:', err.message)
    return res.status(400).send(`Webhook Error: ${err.message}`)
  }

  const existing = await StripeWebhookEvent.findOne({ eventId: event.id }).lean()
  if (existing) {
    return res.json({ received: true, duplicate: true })
  }

  try {
    switch (event.type) {
      case 'checkout.session.completed':
        await handleCheckoutCompleted(event.data.object)
        break
      case 'customer.subscription.updated':
      case 'customer.subscription.deleted':
        await handleSubscriptionChange(event.data.object)
        break
      case 'invoice.paid': {
        const invoice = event.data.object
        const subId = invoice.subscription
        if (subId && getStripe()) {
          const sub = await getStripe().subscriptions.retrieve(String(subId))
          await handleSubscriptionChange(sub)
        }
        break
      }
      case 'invoice.payment_failed': {
        const invoice = event.data.object
        const subId = invoice.subscription
        if (subId && getStripe()) {
          const sub = await getStripe().subscriptions.retrieve(String(subId))
          await handleSubscriptionChange({ ...sub, status: 'past_due' })
        }
        break
      }
      default:
        break
    }

    await StripeWebhookEvent.create({ eventId: event.id, type: event.type })
    res.json({ received: true })
  } catch (err) {
    console.error('[Stripe webhook] handler error:', err)
    res.status(500).send('Webhook handler failed')
  }
}
