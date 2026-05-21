import { useState } from 'react'
import { Link } from 'react-router-dom'
import { CheckCircle2, ArrowRight } from 'lucide-react'

export default function Pricing() {
  const [billing, setBilling] = useState('Annual')

  const plans = [
    {
      name: 'Basic',
      price: '$100',
      features: [
        'Unlimited chatbot conversations',
        'Daily mood & emotion tracking',
        'Access to self-help resource library',
        'Community peer support groups',
      ],
      featured: false,
    },
    {
      name: 'Standard',
      price: '$200',
      features: [
        'Everything included in Basic plan',
        'Personalized coping strategies',
        'Weekly mental health progress reports',
        'Priority 24/7 crisis response support',
      ],
      featured: true,
    },
    {
      name: 'Premium',
      price: '$300',
      features: [
        'Everything included in Standard plan',
        'Monthly licensed therapist sessions',
        'Custom mental wellness treatment plan',
        'Family & caregiver dashboard access',
      ],
      featured: false,
    },
  ]

  return (
    <section className="bg-cream py-20 px-6 max-[768px]:py-14 max-[480px]:py-10 max-[480px]:px-4">
      <div className="max-w-7xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-10 max-[480px]:mb-8">
          <h2 className="text-[44px] font-extrabold leading-[1.15] text-brand max-[1024px]:text-[36px] max-[480px]:text-[26px]">
            Select a Affordable Plans for You.
          </h2>
          <span className="block text-[14px] font-semibold text-brand mt-2">
            Subscription
          </span>
        </div>

        {/* Billing toggle */}
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
                    active
                      ? 'bg-white text-brand shadow-md'
                      : 'text-brand hover:bg-white/40',
                  ].join(' ')}
                >
                  {opt}
                </button>
              )
            })}
          </div>
        </div>

        {/* Pricing cards */}
        <div className="grid grid-cols-3 gap-10 items-end max-[900px]:grid-cols-1 max-[900px]:gap-8 max-[900px]:max-w-md max-[900px]:mx-auto max-[900px]:items-stretch">
          {plans.map((plan) => {
            const isFeatured = plan.featured
            return (
              <div
                key={plan.name}
                className={[
                  'relative bg-brand rounded-2xl flex flex-col overflow-hidden',
                  isFeatured
                    ? 'shadow-[0_20px_45px_-10px_rgba(31,95,74,0.45)] z-10 h-140 max-[900px]:h-auto'
                    : 'shadow-[0_18px_35px_-12px_rgba(31,95,74,0.35)] h-122.5 max-[900px]:h-auto',
                ].join(' ')}
              >
                {/* Decorative ellipse splatter on featured card */}
                {isFeatured && (
                  <img
                    src="/images/Ellipse 4.png"
                    alt=""
                    aria-hidden="true"
                    className="absolute -top-20 -right-20 w-48 pointer-events-none select-none z-20"
                  />
                )}

                {/* Header: Name */}
                <div className="relative text-center pt-8 pb-6 px-6">
                  <h3 className="text-white text-[34px] font-extrabold leading-none max-[480px]:text-[28px]">
                    {plan.name}
                  </h3>
                  <div className="absolute left-6 right-6 bottom-0 h-px bg-white/35" />
                </div>

                {/* Price */}
                <div className="text-center pt-6 pb-2 px-6">
                  <p className="text-white text-[40px] font-extrabold leading-none max-[480px]:text-[32px]">
                    {plan.price}
                  </p>
                </div>

                {/* Features */}
                <ul className="flex-1 px-7 py-6 space-y-4">
                  {plan.features.map((f) => (
                    <li key={f} className="flex items-start gap-3 text-white text-[14px] leading-[1.5]">
                      <CheckCircle2 size={18} strokeWidth={2} className="shrink-0 mt-0.5 text-white" />
                      <span>{f}</span>
                    </li>
                  ))}
                </ul>

                {/* CTA */}
                <div className="px-5 pb-5 pt-2">
                  <Link
                    to="/register"
                    className={[
                      'w-full inline-flex items-center justify-center gap-2 rounded-lg py-3 text-[15px] font-semibold cursor-pointer transition-all hover:-translate-y-px',
                      isFeatured
                        ? 'text-white bg-gradient-to-r from-brand-dark via-[#3FB58A] to-brand-dark hover:brightness-110'
                        : 'bg-white text-brand hover:bg-white/90',
                    ].join(' ')}
                  >
                    Get Started
                    <ArrowRight size={16} strokeWidth={2.25} />
                  </Link>
                </div>
              </div>
            )
          })}
        </div>

      </div>
    </section>
  )
}
