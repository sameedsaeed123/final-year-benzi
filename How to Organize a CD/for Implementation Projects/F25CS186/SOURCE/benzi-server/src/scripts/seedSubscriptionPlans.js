import 'dotenv/config'
import mongoose from 'mongoose'
import { SubscriptionPlan } from '../models/SubscriptionPlan.js'
import { normalizeMongoUri, ensureAuthSource } from '../config/database.js'
import { syncPlanToStripe } from '../services/stripeService.js'
import { getStripe } from '../services/stripeService.js'

const PLANS = [
  {
    slug: 'try-free',
    name: 'Try for Free',
    tagline: 'Perfect for testing BENZI with a small caseload',
    priceMonthlyCents: 0,
    priceYearlyCents: 0,
    maxPatients: 5,
    aiMessageLimitMonthly: 50,
    aiRecommendationLimitMonthly: 20,
    aiContextMultiplier: 1,
    features: [
      'Up to 5 patients for practice & pilot testing',
      'Limited BENZI AI messages & goal recommendations',
      'Anonymous mood tracking for patients',
      'Wellness stats generation with BENZI',
      'Goal assignment & emergency crisis triggers',
    ],
    anonymousMood: true,
    statsGeneration: true,
    goalAssignment: true,
    crisisTriggers: true,
    contextAwareAi: false,
    digitalContextAi: false,
    sortOrder: 1,
    featured: false,
    active: true,
  },
  {
    slug: 'benzi-pro',
    name: 'BENZI Pro',
    tagline: 'Context-aware AI for growing practices',
    priceMonthlyCents: 2000,
    priceYearlyCents: 20000,
    maxPatients: 50,
    aiMessageLimitMonthly: 500,
    aiRecommendationLimitMonthly: 200,
    aiContextMultiplier: 10,
    features: [
      'Up to 50 active patients',
      'Context-aware BENZI AI (~10× richer context)',
      'Full stats & progress dashboards',
      'Goal assignment & patient review workflow',
      'Crisis alerts & therapist notifications',
    ],
    anonymousMood: true,
    statsGeneration: true,
    goalAssignment: true,
    crisisTriggers: true,
    contextAwareAi: true,
    digitalContextAi: false,
    sortOrder: 2,
    featured: true,
    active: true,
  },
  {
    slug: 'plus',
    name: 'Plus',
    tagline: 'Enterprise-scale care with deep digital context',
    priceMonthlyCents: 6000,
    priceYearlyCents: 55000,
    maxPatients: 1000,
    aiMessageLimitMonthly: 50000,
    aiRecommendationLimitMonthly: 10000,
    aiContextMultiplier: 50,
    features: [
      '1,000+ patients — built for large clinics',
      'Enterprise AI limits & priority processing',
      'Deep digital context from reports, chat & goals',
      'Advanced recommendations & insights',
      'Everything in Pro, plus dedicated-scale tooling',
    ],
    anonymousMood: true,
    statsGeneration: true,
    goalAssignment: true,
    crisisTriggers: true,
    contextAwareAi: true,
    digitalContextAi: true,
    sortOrder: 3,
    featured: false,
    active: true,
  },
]

async function run() {
  const uri = ensureAuthSource(normalizeMongoUri(process.env.MONGODB_URI))
  await mongoose.connect(uri)
  for (const p of PLANS) {
    const doc = await SubscriptionPlan.findOneAndUpdate(
      { slug: p.slug },
      { $set: p },
      { upsert: true, new: true }
    )
    console.log('Plan:', p.slug)
    if (getStripe() && (p.priceMonthlyCents > 0 || p.priceYearlyCents > 0)) {
      try {
        await syncPlanToStripe(doc.toObject())
        console.log('  → Stripe synced')
      } catch (e) {
        console.warn('  → Stripe sync skipped:', e.message)
      }
    }
  }
  await mongoose.disconnect()
  console.log('Done.')
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
