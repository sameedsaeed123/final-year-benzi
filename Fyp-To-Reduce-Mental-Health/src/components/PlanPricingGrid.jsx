import { CheckCircle2, ArrowRight } from 'lucide-react'
import PortalCtaLink from './PortalCtaLink.jsx'

/** Original BENZI pricing card layout — data from API, visuals unchanged. */
export default function PlanPricingGrid({
  billing = 'Annual',
  plans = [],
  ctaHref,
  onSelectPlan,
  selectedSlug,
}) {
  const isAnnual = billing === 'Annual' || billing === 'yearly'
  const sorted = [...plans].sort((a, b) => (a.sortOrder || 0) - (b.sortOrder || 0))

  if (!sorted.length) {
    return null
  }

  return (
    <div className="grid grid-cols-3 gap-10 items-end max-[900px]:grid-cols-1 max-[900px]:gap-8 max-[900px]:max-w-md max-[900px]:mx-auto max-[900px]:items-stretch">
      {sorted.map((plan) => {
        const isFeatured = plan.featured
        const priceNum = isAnnual ? plan.priceYearly : plan.priceMonthly
        const price =
          priceNum === 0 || priceNum == null ? '$0' : `$${priceNum}`
        const isSelected = selectedSlug === plan.slug

        const card = (
          <div
            className={[
              'relative bg-brand rounded-2xl flex flex-col overflow-hidden w-full h-full',
              isFeatured
                ? 'shadow-[0_20px_45px_-10px_rgba(31,95,74,0.45)] z-10 h-140 max-[900px]:h-auto'
                : 'shadow-[0_18px_35px_-12px_rgba(31,95,74,0.35)] h-122.5 max-[900px]:h-auto',
              isSelected ? 'ring-2 ring-white ring-offset-2 ring-offset-cream' : '',
            ].join(' ')}
          >
            {isFeatured && (
              <img
                src="/images/Ellipse 4.png"
                alt=""
                aria-hidden="true"
                className="absolute -top-20 -right-20 w-48 pointer-events-none select-none z-20"
              />
            )}

            <div className="relative text-center pt-8 pb-6 px-6">
              <h3 className="text-white text-[34px] font-extrabold leading-none max-[480px]:text-[28px]">
                {plan.name}
              </h3>
              <div className="absolute left-6 right-6 bottom-0 h-px bg-white/35" />
            </div>

            <div className="text-center pt-6 pb-2 px-6">
              <p className="text-white text-[40px] font-extrabold leading-none max-[480px]:text-[32px]">
                {price}
              </p>
            </div>

            <ul className="flex-1 px-7 py-6 space-y-4">
              {(plan.features || []).map((f) => (
                <li key={f} className="flex items-start gap-3 text-white text-[14px] leading-[1.5]">
                  <CheckCircle2 size={18} strokeWidth={2} className="shrink-0 mt-0.5 text-white" />
                  <span>{f}</span>
                </li>
              ))}
            </ul>

            <div className="px-5 pb-5 pt-2">
              {onSelectPlan ? (
                <span
                  className={[
                    'w-full inline-flex items-center justify-center gap-2 rounded-lg py-3 text-[15px] font-semibold cursor-pointer transition-all hover:-translate-y-px',
                    isFeatured
                      ? 'text-white bg-gradient-to-r from-brand-dark via-[#3FB58A] to-brand-dark hover:brightness-110'
                      : 'bg-white text-brand hover:bg-white/90',
                  ].join(' ')}
                >
                  Get Started
                  <ArrowRight size={16} strokeWidth={2.25} />
                </span>
              ) : (
                <PortalCtaLink
                  href={ctaHref(plan, isAnnual ? 'yearly' : 'monthly')}
                  className={[
                    'w-full inline-flex items-center justify-center gap-2 rounded-lg py-3 text-[15px] font-semibold cursor-pointer transition-all hover:-translate-y-px',
                    isFeatured
                      ? 'text-white bg-gradient-to-r from-brand-dark via-[#3FB58A] to-brand-dark hover:brightness-110'
                      : 'bg-white text-brand hover:bg-white/90',
                  ].join(' ')}
                >
                  {plan.slug === 'try-free' ? 'Try for Free' : 'Get Started'}
                  <ArrowRight size={16} strokeWidth={2.25} />
                </PortalCtaLink>
              )}
            </div>
          </div>
        )

        if (onSelectPlan) {
          return (
            <button
              key={plan.slug}
              type="button"
              onClick={() => onSelectPlan(plan)}
              className="text-left w-full"
            >
              {card}
            </button>
          )
        }

        return (
          <div key={plan.slug} className="h-full">
            {card}
          </div>
        )
      })}
    </div>
  )
}
