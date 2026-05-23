import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronRight, CreditCard } from 'lucide-react'
import TherapistSidebar from '../../components/TherapistSidebar'
import PlanPricingGrid from '../../components/PlanPricingGrid.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { displayFirstName } from '../../lib/userDisplay.js'
import { api } from '../../lib/api.js'

export default function TherapistSubscriptionPage() {
  const { user } = useAuth()
  const welcomeName = displayFirstName(user)
  const [billing, setBilling] = useState('Annual')
  const [plans, setPlans] = useState([])
  const [subscription, setSubscription] = useState(null)
  const [usage, setUsage] = useState(null)

  useEffect(() => {
    Promise.all([
      api('/subscriptions/plans', { method: 'GET', silent: true }),
      api('/subscriptions/me', { method: 'GET', silent: true }),
    ]).then(([plansJson, subJson]) => {
      setPlans(plansJson.data?.plans || [])
      setSubscription(subJson.data?.subscription || null)
      setUsage(subJson.data?.usage || null)
    }).catch(() => {})
  }, [])

  return (
    <>
      <div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
      <section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-brand/70">Subscription</p>
            <h1 className="text-[36px] font-extrabold text-[#0f3a2b] max-[640px]:text-[28px]">
              {`Welcome ${welcomeName}!`}
            </h1>
          </div>
          <Link
            to="/therapist-profile"
            className="flex items-center gap-2 bg-white border border-black/10 rounded-full px-4 py-3 shadow-sm text-[14px] font-semibold"
          >
            <Bell size={18} />
            <span>{welcomeName}</span>
            <ChevronRight size={18} />
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_280px] max-[1280px]:grid-cols-1">
          <div className="space-y-6">
            {subscription && (
              <div className="rounded-[24px] border border-brand/20 bg-white p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex-1">
                  <p className="text-[11px] uppercase tracking-wider text-[#7d8b7d]">Current plan</p>
                  <p className="text-xl font-bold text-[#0f3a2b]">
                    {subscription.planName || subscription.planSlug}
                  </p>
                  <p className="text-sm text-[#556b5b] capitalize">
                    {subscription.status} · {subscription.billingInterval}
                    {subscription.currentPeriodEnd && (
                      <> · renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}</>
                    )}
                  </p>
                  {usage && (
                    <div className="mt-3 flex flex-wrap gap-3 text-[11px] text-[#556b5b]">
                      <span>
                        Patients {usage.usage?.patients}/{usage.limits?.maxPatients}
                      </span>
                      <span>
                        AI msgs {usage.usage?.aiMessagesUsed}/{usage.limits?.aiMessageLimitMonthly}
                      </span>
                      <span>
                        AI tips {usage.usage?.aiRecommendationsUsed}/
                        {usage.limits?.aiRecommendationLimitMonthly}
                      </span>
                    </div>
                  )}
                </div>
                <Link
                  to="/therapist-checkout"
                  className="inline-flex items-center gap-2 rounded-full bg-brand text-white px-5 py-2.5 text-sm font-semibold"
                >
                  <CreditCard size={16} />
                  Change plan
                </Link>
              </div>
            )}

            <div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
              <div className="flex justify-center mb-16 max-[480px]:mb-12 px-1">
                <div className="inline-flex w-full max-w-xs sm:max-w-none sm:w-auto bg-[#DCEBE4] rounded-xl p-1.5 sm:p-2">
                  {['Monthly', 'Annual'].map((opt) => (
                    <button
                      key={opt}
                      type="button"
                      onClick={() => setBilling(opt)}
                      className={[
                        'flex-1 sm:flex-none px-6 sm:px-12 py-2.5 rounded-lg text-[18px] sm:text-[22px] font-bold transition-all cursor-pointer',
                        billing === opt ? 'bg-white text-brand shadow-md' : 'text-brand hover:bg-white/40',
                      ].join(' ')}
                    >
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
              <PlanPricingGrid
                billing={billing}
                plans={plans}
                ctaHref={(plan, interval) =>
                  `/therapist-checkout?plan=${plan.slug}&interval=${interval}`
                }
              />
            </div>
          </div>
          <TherapistSidebar activeItem="Subscription" />
        </div>
      </section>
    </>
  )
}
