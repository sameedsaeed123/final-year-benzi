import 'dotenv/config'
import mongoose from 'mongoose'
import { SubscriptionPlan } from '../models/SubscriptionPlan.js'
import { normalizeMongoUri, ensureAuthSource } from '../config/database.js'
import { syncPlanToStripe, getStripe } from '../services/stripeService.js'

async function run() {
  if (!getStripe()) {
    console.error('Set STRIPE_SECRET_KEY in .env first')
    process.exit(1)
  }
  const uri = ensureAuthSource(normalizeMongoUri(process.env.MONGODB_URI))
  await mongoose.connect(uri)
  const plans = await SubscriptionPlan.find({ active: true }).lean()
  for (const plan of plans) {
    await syncPlanToStripe(plan)
    console.log('Synced:', plan.slug)
  }
  await mongoose.disconnect()
}

run().catch((e) => {
  console.error(e)
  process.exit(1)
})
