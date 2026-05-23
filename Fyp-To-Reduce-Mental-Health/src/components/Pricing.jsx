import { useState, useEffect } from 'react'
import PlanPricingGrid from './PlanPricingGrid.jsx'
import { api } from '../lib/api.js'

const FALLBACK_PLANS = [
  {
    slug: 'try-free',
    name: 'Basic',
    priceMonthly: 0,
    priceYearly: 0,
    sortOrder: 1,
    featured: false,
    features: [
      'Unlimited chatbot conversations',
      'Daily mood & emotion tracking',
      'Access to self-help resource library',
      'Community peer support groups',
    ],
  },
  {
    slug: 'benzi-pro',
    name: 'Standard',
    priceMonthly: 20,
    priceYearly: 200,
    sortOrder: 2,
    featured: true,
    features: [
      'Everything included in Basic plan',
      'Personalized coping strategies',
      'Weekly mental health progress reports',
      'Priority 24/7 crisis response support',
    ],
  },
  {
    slug: 'plus',
    name: 'Premium',
    priceMonthly: 60,
    priceYearly: 550,
    sortOrder: 3,
    featured: false,
    features: [
      'Everything included in Standard plan',
      'Monthly licensed therapist sessions',
      'Custom mental wellness treatment plan',
      'Family & caregiver dashboard access',
    ],
  },
]

export default function Pricing() {
  const [billing, setBilling] = useState('Annual')
  const [plans, setPlans] = useState(FALLBACK_PLANS)

  useEffect(() => {
    api('/subscriptions/plans', { method: 'GET', silent: true })
      .then((json) => {
        const list = json.data?.plans
        if (list?.length) setPlans(list)
      })
      .catch(() => {})
  }, [])

  const planHref = (plan, interval) =>
    `/therapist-checkout?plan=${plan.slug}&interval=${interval}`

  return (
    <section className="bg-cream py-20 px-6 max-[768px]:py-14 max-[480px]:py-10 max-[480px]:px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-10 max-[480px]:mb-8">
          <h2 className="text-[44px] font-extrabold leading-[1.15] text-brand max-[1024px]:text-[36px] max-[480px]:text-[26px]">
            Select a Affordable Plans for You.
          </h2>
          <span className="block text-[14px] font-semibold text-brand mt-2">Subscription</span>
        </div>

        <div className="flex justify-center mb-20 max-[480px]:mb-12 px-1">
          <div className="inline-flex w-full max-w-xs sm:max-w-none sm:w-auto bg-[#DCEBE4] rounded-xl p-1.5 sm:p-2">
            {['Monthly', 'Annual'].map((opt) => {
              const active = billing === opt
              return (
                <button
                  key={opt}
                  type="button"
                  onClick={() => setBilling(opt)}
                  className={[
                    'flex-1 sm:flex-none px-6 sm:px-12 py-2.5 rounded-lg text-[18px] sm:text-[22px] font-bold transition-all cursor-pointer',
                    active ? 'bg-white text-brand shadow-md' : 'text-brand hover:bg-white/40',
                  ].join(' ')}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        </div>

        <PlanPricingGrid billing={billing} plans={plans} ctaHref={planHref} />
      </div>
    </section>
  )
}
