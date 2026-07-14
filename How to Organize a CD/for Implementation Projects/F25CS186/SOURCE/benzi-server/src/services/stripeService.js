import Stripe from 'stripe'
import { env } from '../config/environment.js'
import { SubscriptionPlan } from '../models/SubscriptionPlan.js'

let stripeClient = null

export function isStripeConfigured() {
  return Boolean(env.STRIPE_SECRET_KEY && env.STRIPE_WEBHOOK_SECRET)
}

export function getStripe() {
  if (!env.STRIPE_SECRET_KEY) return null
  if (!stripeClient) {
    stripeClient = new Stripe(env.STRIPE_SECRET_KEY)
  }
  return stripeClient
}

/** Create/update Stripe Product + Prices for a plan */
export async function syncPlanToStripe(plan) {
  const stripe = getStripe()
  if (!stripe || !plan) return plan

  let productId = plan.stripeProductId
  if (!productId) {
    const product = await stripe.products.create({
      name: `BENZI ${plan.name}`,
      description: plan.tagline || '',
      metadata: { planSlug: plan.slug },
    })
    productId = product.id
  } else {
    await stripe.products.update(productId, {
      name: `BENZI ${plan.name}`,
      description: plan.tagline || '',
    })
  }

  const updates = { stripeProductId: productId }

  if (plan.priceMonthlyCents > 0) {
    const monthly = await stripe.prices.create({
      product: productId,
      unit_amount: plan.priceMonthlyCents,
      currency: 'usd',
      recurring: { interval: 'month' },
      metadata: { planSlug: plan.slug, interval: 'monthly' },
    })
    updates.stripePriceIdMonthly = monthly.id
  }

  if (plan.priceYearlyCents > 0) {
    const yearly = await stripe.prices.create({
      product: productId,
      unit_amount: plan.priceYearlyCents,
      currency: 'usd',
      recurring: { interval: 'year' },
      metadata: { planSlug: plan.slug, interval: 'yearly' },
    })
    updates.stripePriceIdYearly = yearly.id
  }

  await SubscriptionPlan.updateOne({ slug: plan.slug }, { $set: updates })
  return { ...plan, ...updates }
}

export async function syncCouponToStripe(couponDoc) {
  const stripe = getStripe()
  if (!stripe || !couponDoc) return couponDoc

  if (couponDoc.stripeCouponId) return couponDoc

  const params = {
    duration: 'once',
    name: couponDoc.code,
    metadata: { code: couponDoc.code },
  }
  if (couponDoc.percentOff) params.percent_off = couponDoc.percentOff
  else if (couponDoc.amountOffCents) params.amount_off = couponDoc.amountOffCents

  const stripeCoupon = await stripe.coupons.create(params)
  const promo = await stripe.promotionCodes.create({
    coupon: stripeCoupon.id,
    code: couponDoc.code,
  })

  return {
    stripeCouponId: stripeCoupon.id,
    stripePromotionCodeId: promo.id,
  }
}

export async function createCheckoutSession({
  therapistUserId,
  email,
  plan,
  billingInterval,
  successUrl,
  cancelUrl,
  coupon,
}) {
  const stripe = getStripe()
  if (!stripe) {
    return {
      mode: 'dev',
      url: `${successUrl.replace('{CHECKOUT_SESSION_ID}', `dev_${plan.slug}_${therapistUserId}`)}`,
    }
  }

  const priceId =
    billingInterval === 'yearly' ? plan.stripePriceIdYearly : plan.stripePriceIdMonthly

  const lineItems = priceId
    ? [{ price: priceId, quantity: 1 }]
    : [
        {
          price_data: {
            currency: 'usd',
            unit_amount: Math.max(
              50,
              billingInterval === 'yearly' ? plan.priceYearlyCents : plan.priceMonthlyCents
            ),
            product_data: {
              name: `BENZI ${plan.name}`,
              description: `${billingInterval === 'yearly' ? 'Annual' : 'Monthly'} subscription`,
            },
            recurring: {
              interval: billingInterval === 'yearly' ? 'year' : 'month',
            },
          },
          quantity: 1,
        },
      ]

  const sessionParams = {
    mode: 'subscription',
    payment_method_types: ['card'],
    line_items: lineItems,
    success_url: successUrl,
    cancel_url: cancelUrl,
    client_reference_id: String(therapistUserId),
    customer_email: email,
    metadata: {
      therapistUserId: String(therapistUserId),
      planSlug: plan.slug,
      billingInterval,
      couponCode: coupon?.code || '',
    },
    subscription_data: {
      metadata: {
        therapistUserId: String(therapistUserId),
        planSlug: plan.slug,
        billingInterval,
      },
    },
  }

  if (coupon?.stripePromotionCodeId) {
    sessionParams.discounts = [{ promotion_code: coupon.stripePromotionCodeId }]
  } else if (coupon?.stripeCouponId) {
    sessionParams.discounts = [{ coupon: coupon.stripeCouponId }]
  }

  const session = await stripe.checkout.sessions.create(sessionParams)
  return { mode: 'stripe', url: session.url, sessionId: session.id }
}

export async function retrieveCheckoutSession(sessionId) {
  const stripe = getStripe()
  if (!stripe) return null
  return stripe.checkout.sessions.retrieve(sessionId, {
    expand: ['subscription', 'customer'],
  })
}

export function constructWebhookEvent(rawBody, signature) {
  const stripe = getStripe()
  if (!stripe) throw new Error('Stripe not configured')
  if (!env.STRIPE_WEBHOOK_SECRET) throw new Error('STRIPE_WEBHOOK_SECRET missing')
  return stripe.webhooks.constructEvent(rawBody, signature, env.STRIPE_WEBHOOK_SECRET)
}
