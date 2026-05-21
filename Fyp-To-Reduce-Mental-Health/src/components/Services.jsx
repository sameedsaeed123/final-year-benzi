import { Link } from 'react-router-dom'
import {
  CircuitBoard,
  ScanFace,
  HandHeart,
  TrendingUp,
  History,
  BrainCircuit,
  ArrowRight,
} from 'lucide-react'

export default function Services() {
  const offerings = [
    {
      Icon: CircuitBoard,
      title: 'Natural Language Processing (NLP)',
      text: 'Capable of understanding and analyzing natural language inputs from users, including text descriptions of emotions, symptoms, and concerns related to mental health.',
    },
    {
      Icon: ScanFace,
      title: 'Emotion Recognition',
      text: 'Utilizes algorithms to recognize and interpret emotions expressed in user inputs, allowing for empathetic and contextually appropriate responses.',
    },
    {
      Icon: HandHeart,
      title: 'Personalized Recommendations',
      text: 'Provides tailored suggestions, coping strategies, and resources based on individual user data, preferences, and historical interactions with the bot.',
    },
    {
      Icon: TrendingUp,
      title: 'Risk Assessment',
      text: 'Employs algorithms to assess the risk levels associated with mental health issues, such as depression, anxiety, self-harm, or suicidal ideation, and offers...',
    },
    {
      Icon: History,
      title: '24/7 Availability',
      text: 'Accessible round-the-clock, ensuring users can seek support and assistance anytime, especially during urgent situations or outside typical office hours.',
    },
    {
      Icon: BrainCircuit,
      title: 'Continuous Learning',
      text: 'Learns from user interactions, feedback, and data insights to improve response accuracy, adaptability, and the overall quality of assistance provided over time.',
    },
  ]

  return (
    <section className="bg-cream py-20 px-6 max-[768px]:py-14 max-[480px]:py-10 max-[480px]:px-4">
      <div className="max-w-7xl mx-auto">

        {/* Heading */}
        <span className="block text-[14px] font-semibold text-brand mb-3">
          Services
        </span>
        <h2 className="text-[44px] font-extrabold leading-[1.15] text-brand mb-14 max-[1024px]:text-[36px] max-[480px]:text-[28px] max-[480px]:mb-10">
          Our Care Offerings
        </h2>

        {/* Grid */}
        <div className="grid grid-cols-3 gap-8 max-[1024px]:grid-cols-2 max-[640px]:grid-cols-1 max-[1024px]:gap-6">
          {offerings.map(({ Icon, title, text }) => (
            <div
              key={title}
              className="relative bg-brand rounded-2xl overflow-hidden"
            >
              {/* subtle noise/texture overlay */}
              <div
                className="absolute inset-0 opacity-[0.08] pointer-events-none"
                style={{
                  backgroundImage:
                    "radial-gradient(rgba(255,255,255,0.6) 1px, transparent 1px)",
                  backgroundSize: '3px 3px',
                }}
              />

              {/* Content */}
              <div className="relative p-7 pb-24">
                {/* Icon circle */}
                <div className="w-14 h-14 rounded-full bg-white/15 flex items-center justify-center mb-10">
                  <Icon size={26} strokeWidth={1.75} className="text-white" />
                </div>

                {/* Title */}
                <h3 className="text-white text-[18px] font-bold mb-3 leading-[1.3]">
                  {title}
                </h3>

                {/* Description */}
                <p className="text-white/85 text-[13.5px] leading-[1.7]">
                  {text}
                </p>
              </div>

              {/* Concave cream pocket + Learn more button (bottom-right) */}
              <div className="absolute bottom-0 right-0 max-w-full bg-cream rounded-tl-3xl pt-3 pl-3 pr-1">
                <Link
                  to="/resources"
                  className="inline-flex items-center gap-2 bg-brand text-white px-4 py-2.5 sm:px-5 sm:py-3 rounded-lg text-[13px] sm:text-[14px] font-semibold no-underline transition-all hover:bg-brand-dark hover:-translate-y-px max-[400px]:text-[12px] max-[400px]:px-3"
                >
                  Learn more
                  <ArrowRight size={16} strokeWidth={2.25} />
                </Link>
              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
