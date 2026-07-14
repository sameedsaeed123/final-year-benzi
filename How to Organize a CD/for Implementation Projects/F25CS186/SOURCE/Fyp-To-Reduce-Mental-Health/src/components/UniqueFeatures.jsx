import { Link } from 'react-router-dom'
import { TrendingUp, ScanFace, History } from 'lucide-react'

const features = [
  {
    Icon: TrendingUp,
    title: 'Risk Assesment',
    text: 'Employs algorithms to assess the risk levels associated with mental health issues, such as depression, anxiety, self-harm, or suicidal ideation, and offers.',
  },
  {
    Icon: ScanFace,
    title: 'Emotion Recoginition',
    text: 'Utilizes algorithms to recognize and interpret emotions expressed in user inputs, allowing for empathetic and contextually appropriate responses.',
  },
  {
    Icon: History,
    title: '24/7 Availability',
    text: 'Accessible round-the-clock, ensuring users can seek support and assistance anytime, especially during urgent situations or outside typical office hours.',
  },
]

export default function UniqueFeatures() {
  return (
    <section className="bg-cream px-6 py-16 max-[480px]:py-10 max-[480px]:px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-16 max-[480px]:mb-10">
          <h2 className="text-[44px] font-bold leading-[1.15] text-[#0f0f0f] max-[1024px]:text-[32px] max-[480px]:text-[24px]">
            Explore features designed exceptional care.
          </h2>
          <span className="block text-[14px] font-semibold text-brand mt-2">
            Our Unique Features
          </span>
        </div>

        <div className="grid grid-cols-3 gap-8 max-[900px]:grid-cols-1 max-[900px]:max-w-md max-[900px]:mx-auto">
          {features.map(({ Icon, title, text }, idx) => (
            <div
              key={title}
              className="text-center group cursor-pointer transition-all duration-500 hover:-translate-y-2"
            >
              {/* Blob background + icon + number */}
              <div className="relative w-full h-56 mb-6 flex items-center justify-center">
                <div className="relative w-52 h-52 flex items-center justify-center transition-transform duration-500 group-hover:scale-105">
                  <img
                    src="/images/icon-bg-2.png"
                    alt=""
                    aria-hidden="true"
                    className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none transition-transform duration-700 group-hover:rotate-12"
                  />
                  <Icon
                    size={54}
                    strokeWidth={1.8}
                    className="relative text-brand transition-transform duration-500 group-hover:scale-125 group-hover:-rotate-6"
                  />
                </div>
                <span className="absolute top-4 right-6 w-9 h-9 rounded-full border border-brand text-brand text-[14px] font-bold flex items-center justify-center bg-white max-[900px]:right-8 transition-all duration-300 group-hover:bg-brand group-hover:text-white group-hover:scale-110">
                  {idx + 1}
                </span>
              </div>

              <h3 className="text-brand text-[22px] font-extrabold mb-4 max-[480px]:text-[20px]">
                {title}
              </h3>
              <p className="text-[#666] text-[14px] leading-[1.7] max-w-xs mx-auto">
                {text}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-12">
          <Link
            to="/resources"
            className="bg-brand text-white px-7 py-3 rounded-lg text-[14px] font-semibold cursor-pointer transition-all duration-300 hover:bg-brand-dark hover:-translate-y-1 hover:shadow-xl hover:scale-105 active:scale-95"
          >
            See more
          </Link>
        </div>
      </div>
    </section>
  )
}
