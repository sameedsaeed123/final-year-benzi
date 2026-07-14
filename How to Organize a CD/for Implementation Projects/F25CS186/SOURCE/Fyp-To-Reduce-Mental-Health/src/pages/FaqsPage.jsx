import { useState } from 'react'
import { Plus, Minus } from 'lucide-react'

const faqs = [
  {
    q: 'How long will each therapy session last?',
    a: 'Therapy sessions typically last between 45 to 60 minutes, although the duration may vary depending on your specific needs and the treatment modality being used.',
  },
  { q: 'Are walk-in appointments available?', a: 'Walk-in appointments are accepted subject to therapist availability. We recommend booking in advance to guarantee a time slot that suits your schedule.' },
  { q: 'Do you accept insurance?', a: 'Yes, we accept most major insurance providers. Please contact our billing team with your plan details for verification before your first session.' },
  { q: 'Do you offer telemedicine or appointment?', a: 'Absolutely — secure video sessions are available for most of our services, allowing you to connect with a specialist from anywhere.' },
  { q: 'Is parking available on-site for patients/visitors?', a: 'Yes, we provide free on-site parking for all patients and visitors, with accessible spots near the main entrance.' },
  { q: 'How can i make a appointment in advance?', a: 'You can book an appointment through our website, by phone, or via the mobile app. Same-day bookings are also possible based on availability.' },
]

export default function FaqsPage() {
  const [openIndex, setOpenIndex] = useState(0)
  const [question, setQuestion] = useState('')

  return (
    <>
      {/* Spacer for absolute navbar */}
      <div className="pt-28 max-[768px]:pt-24 max-[480px]:pt-20" />

      <section className="bg-cream px-6 pb-20 max-[768px]:pb-14 max-[480px]:pb-10 max-[480px]:px-4">
        <div className="max-w-7xl mx-auto">

          {/* Heading */}
          <div className="text-center mb-14 max-[480px]:mb-10">
            <h1 className="text-[44px] font-extrabold leading-[1.15] text-[#111] max-[1024px]:text-[36px] max-[480px]:text-[26px]">
              Frequently Asked Questions
            </h1>
            <p className="text-[14px] text-[#333] mt-2">
              <a href="#" className="text-brand font-semibold hover:underline">Click here</a>
              {' '}for more information
            </p>
          </div>

          <div className="grid grid-cols-2 gap-12 items-start max-[900px]:grid-cols-1 max-[900px]:gap-10">

            {/* Accordion */}
            <div className="flex flex-col gap-4">
              {faqs.map(({ q, a }, i) => {
                const open = openIndex === i
                return (
                  <div
                    key={q}
                    className="bg-brand rounded-md overflow-hidden transition-all duration-300"
                  >
                    <button
                      onClick={() => setOpenIndex(open ? -1 : i)}
                      className="w-full flex items-center justify-between text-left px-5 py-4 text-white text-[15px] font-semibold cursor-pointer transition-colors hover:bg-brand-dark"
                    >
                      <span>{q}</span>
                      {open ? (
                        <Minus size={18} strokeWidth={2.25} />
                      ) : (
                        <Plus size={18} strokeWidth={2.25} />
                      )}
                    </button>

                    {open && (
                      <div className="px-5 pb-5">
                        <p className="text-white/90 text-[13.5px] leading-[1.8] text-justify">
                          {a}
                        </p>
                      </div>
                    )}
                  </div>
                )
              })}
            </div>

            {/* Right column: robot + question form */}
            <div className="flex flex-col items-center text-center max-[900px]:items-center">
              <img
                src="/images/52b99d76887a3fda7bc2eecd198daa29 1.png"
                alt="Benzi robot assistant"
                className="h-64 w-auto object-contain mb-6 animate-[float_4s_ease-in-out_infinite] max-[480px]:h-48"
              />

              <h2 className="text-[40px] font-extrabold leading-[1.15] text-[#111] mb-2 max-[1024px]:text-[32px] max-[480px]:text-[26px]">
                Any Question?
              </h2>
              <p className="text-[14px] text-[#333] mb-8">
                you can ask anything you want to know.
              </p>

              <form
                onSubmit={(e) => e.preventDefault()}
                className="w-full max-w-md text-left"
              >
                <label className="block text-[14px] text-[#333] mb-2">
                  Let me know
                </label>
                <textarea
                  rows={2}
                  value={question}
                  onChange={(e) => setQuestion(e.target.value)}
                  className="w-full border-2 border-brand rounded-lg px-4 py-3 text-[14px] bg-white text-[#222] outline-none resize-none mb-5 focus:ring-2 focus:ring-brand/30"
                />
                <button
                  type="submit"
                  className="bg-brand text-white px-7 py-2.5 rounded-md text-[14px] font-semibold cursor-pointer transition-all duration-300 hover:bg-brand-dark hover:-translate-y-1 hover:shadow-lg active:scale-95"
                >
                  Sent
                </button>
              </form>
            </div>

          </div>
        </div>
      </section>
    </>
  )
}
