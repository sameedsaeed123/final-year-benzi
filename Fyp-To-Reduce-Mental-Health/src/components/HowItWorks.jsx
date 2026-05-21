import { Link } from 'react-router-dom'
import {
  MessageSquare,
  Brain,
  ScanFace,
  HandHeart,
  ShieldCheck,
  RefreshCw,
} from 'lucide-react'

const steps = [
  {
    Icon: MessageSquare,
    title: 'Data Collection',
    text: 'The AI bot gathers textual descriptions of symptoms, feelings, and experiences shared during your conversations.',
  },
  {
    Icon: Brain,
    title: 'Language Processing',
    text: 'Advanced NLP models interpret your messages, identifying intent, tone, and the emotional context behind every word.',
  },
  {
    Icon: ScanFace,
    title: 'Emotion Recognition',
    text: 'We detect emotional cues in real time so responses feel empathetic, contextually aware, and genuinely supportive.',
  },
  {
    Icon: HandHeart,
    title: 'Personalized Response',
    text: 'Tailored coping strategies and resources are suggested based on your preferences, history, and current emotional state.',
  },
  {
    Icon: ShieldCheck,
    title: 'Risk Assessment',
    text: 'The system evaluates concerning signals related to anxiety, depression, or self-harm and connects you to appropriate care.',
  },
  {
    Icon: RefreshCw,
    title: 'Continuous Learning',
    text: 'Every interaction helps Benzi improve — refining accuracy, empathy, and the quality of guidance you receive over time.',
  },
]

export default function HowItWorks() {
  return (
    <section className="bg-cream px-6 py-16 max-[480px]:py-10 max-[480px]:px-4">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-14 max-[480px]:mb-10">
          <h2 className="text-[44px] font-bold leading-[1.15] text-[#0f0f0f] max-[1024px]:text-[32px] max-[480px]:text-[24px]">
            How it Works
          </h2>
          <span className="block text-[14px] font-semibold text-brand mt-2">
            Our Process
          </span>
        </div>

        <div className="grid grid-cols-3 gap-12 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1 max-[900px]:gap-10">
          {steps.map(({ Icon, title, text }) => (
            <div
              key={title}
              className="text-center group cursor-pointer transition-all duration-500 hover:-translate-y-2"
            >
              <div className="relative w-24 h-24 mx-auto mb-5 flex items-center justify-center">
                <span className="w-20 h-20 rounded-full bg-[#F0E8DA]/60 flex items-center justify-center transition-all duration-500 group-hover:bg-brand/20 group-hover:scale-110 group-hover:shadow-lg">
                  <Icon
                    size={34}
                    strokeWidth={1.8}
                    className="text-brand transition-transform duration-500 group-hover:rotate-12 group-hover:scale-110"
                  />
                </span>
              </div>
              <h3 className="text-[22px] font-bold text-[#111] mb-3 max-[480px]:text-[20px]">
                {title}
              </h3>
              <p className="text-[#777] text-[14px] leading-[1.7] max-w-xs mx-auto">
                {text}
              </p>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-14">
          <Link
            to="/about"
            className="border-2 border-brand text-brand bg-transparent px-7 py-3 rounded-lg text-[14px] font-semibold cursor-pointer transition-all duration-300 hover:bg-brand hover:text-white hover:-translate-y-1 hover:shadow-lg hover:scale-105 active:scale-95"
          >
            See Our Benefits
          </Link>
        </div>
      </div>
    </section>
  )
}
