import { Link } from 'react-router-dom'

export default function AboutUs() {
  const cards = [
    { title: 'Our Vision', text: 'To create a world where mental health support is accessible, stigma-free, and available to everyone who needs it.' },
    { title: 'Our Mission', text: 'To connect individuals with qualified therapists and counselors, empowering them to take control of their mental well-being.' },
  ]

  return (
    <section>

      {/* ── Part 1 — Dark background ── */}
      <div className="bg-cream py-20 px-6 max-[768px]:py-14 max-[480px]:py-10 max-[480px]:px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-14 max-[1024px]:gap-10 max-[768px]:flex-col max-[768px]:gap-10">

          {/* Left — Text */}
          <div className="flex-1">
            <span className="block text-[14px] font-semibold text-brand mb-3">
              About Us
            </span>
            <h2 className="text-[36px] font-extrabold leading-[1.2] text-brand mb-5 max-[1024px]:text-[28px] max-[480px]:text-[24px]">
              Track Your Progress and Celebrate Every Step of Your Journey
            </h2>
            <p className="text-[14px] leading-[1.8] text-[#555] mb-8">
              Our progress tracking feature allows you to monitor your mental health
              journey with ease. Stay motivated as you see your improvements over
              time and celebrate each milestone.
            </p>
            <Link
              to="/about"
              className="inline-flex items-center justify-center bg-brand text-white px-6 py-3 rounded-lg text-[14px] font-semibold no-underline transition-all hover:bg-brand-dark hover:-translate-y-px max-[480px]:w-full"
            >
              Learn more
            </Link>
          </div>

          {/* Right — Graph image */}
          <div className="flex-1 flex justify-center">
            <img
              src="/images/About-Us-Fist-Section-Graph-Image.png"
              alt="Weekly Progress Chart"
              className="w-full max-w-lg h-auto rounded-2xl max-[768px]:max-w-full"
            />
          </div>

        </div>
      </div>

      {/* ── Part 2 — White background ── */}
      <div className="bg-cream py-20 px-6 max-[768px]:py-14 max-[480px]:py-10 max-[480px]:px-4">
        <div className="max-w-7xl mx-auto flex items-center gap-14 max-[1024px]:gap-10 max-[768px]:flex-col max-[768px]:gap-10">

          {/* Left — Therapy image */}
          <div className="flex-1 flex justify-center">
            <img
              src="/images/About-Us-Second-Section-Image.png"
              alt="Therapy Support"
              className="w-full max-w-md h-auto rounded-2xl object-cover max-[768px]:max-w-full"
            />
          </div>

          {/* Right — Text */}
          <div className="flex-1">
            <h2 className="text-[36px] font-extrabold leading-[1.2] text-brand mb-5 max-[1024px]:text-[28px] max-[480px]:text-[24px]">
              Support, Share, and Grow with Our Therapy
            </h2>
            <p className="text-[14px] leading-[1.8] text-[#555] mb-7">
              Our therapy program allows patients to feel safe and supported while
              choosing the right professional for their needs. You can explore
              therapist profiles, read reviews, and select a trusted doctor without
              worrying about security or privacy concerns. This transparent approach
              ensures you join a group where you feel comfortable, understood, and
              confident in your care.
            </p>

            {/* Vision / Mission cards */}
            <div className="flex gap-4 mb-8 max-[768px]:flex-col">
              {cards.map(({ title, text }) => (
                <div key={title} className="flex-1 border border-brand rounded-2xl p-5 bg-white">
                  <h4 className="text-[15px] font-bold text-brand mb-2">
                    {title}
                  </h4>
                  <p className="text-[13px] leading-[1.65] text-[#555]">
                    {text}
                  </p>
                </div>
              ))}
            </div>

            <Link
              to="/about"
              className="inline-flex items-center justify-center bg-brand text-white px-6 py-3 rounded-lg text-[14px] font-semibold no-underline transition-all hover:bg-brand-dark hover:-translate-y-px max-[480px]:w-full"
            >
              Learn more
            </Link>
          </div>

        </div>
      </div>

    </section>
  )
}
