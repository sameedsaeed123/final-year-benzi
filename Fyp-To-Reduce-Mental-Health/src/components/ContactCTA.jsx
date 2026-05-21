import { Link } from 'react-router-dom'

export default function ContactCTA() {
  return (
    <section className="bg-cream py-16 px-6 max-[768px]:py-12 max-[480px]:py-10 max-[480px]:px-4">
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-brand rounded-3xl overflow-hidden py-24 px-6 max-[768px]:py-16 max-[480px]:py-12 max-[480px]:rounded-2xl">

          {/* Background circles image */}
          <img
            src="/images/Contact-us-Background.png"
            alt=""
            aria-hidden="true"
            className="absolute inset-0 h-full w-full object-cover object-center opacity-40 pointer-events-none select-none"
          />

          {/* Content */}
          <div className="relative text-center max-w-2xl mx-auto">
            <h2 className="text-brand text-[44px] font-extrabold leading-[1.15] mb-5 max-[1024px]:text-[36px] max-[480px]:text-[26px]">
              Take The First Step To The Healthier Mind
            </h2>
            <p className="text-[#555] text-[14px] leading-[1.7] mb-7 max-w-md mx-auto">
              Begin your journey toward emotional well-being with accessible, supportive care.
            </p>
            <Link
              to="/contact-us"
              className="inline-flex items-center justify-center bg-brand text-white px-7 py-3 rounded-lg text-[14px] font-semibold no-underline transition-all hover:bg-brand-dark hover:-translate-y-px max-[480px]:w-full max-[480px]:max-w-xs"
            >
              Contact Us
            </Link>
          </div>

        </div>
      </div>
    </section>
  )
}
