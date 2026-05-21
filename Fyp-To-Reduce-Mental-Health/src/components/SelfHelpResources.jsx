import { Link } from 'react-router-dom'

const items = [
  {
    type: 'image',
    date: '12 Janurary  25',
    title: 'Managing Anxiety and Stress',
    text: 'Learn evidence-based techniques to recognize triggers, calm your nervous system, and navigate stressful moments with clarity and confidence.',
    image: 'https://images.unsplash.com/photo-1499209974431-9dddcece7f88?auto=format&fit=crop&w=900&q=80',
  },
  {
    type: 'image',
    date: '23 Janurary 25',
    title: 'Building Resilience and Coping Skills',
    text: "Discover practical tools and exercises to enhance resilience and cope with stress, anxiety, and life's challenges. Explore relaxation techniques, mindfulness practices, and stress management strategies.",
    image: 'https://images.unsplash.com/photo-1506126613408-eca07ce68773?auto=format&fit=crop&w=900&q=80',
  },
  {
    type: 'image',
    date: '12 Janurary 25',
    title: 'Improving Communication and Relationships',
    text: 'Strengthen your connections with active listening, healthy boundary setting, and conflict resolution skills that build lasting trust.',
    image: 'https://images.unsplash.com/photo-1521791136064-7986c2920216?auto=format&fit=crop&w=900&q=80',
  },
  {
    type: 'image',
    date: '09 January 25',
    title: 'Setting and Achieving Goals',
    text: 'Turn aspirations into measurable progress with frameworks for goal setting, habit building, and staying motivated through setbacks.',
    image: 'https://images.unsplash.com/photo-1506784365847-bbad939e9335?auto=format&fit=crop&w=900&q=80',
  },
  {
    type: 'image',
    date: '12 February  25',
    title: 'Managing Anxiety and Stress',
    text: 'Daily practices and quick grounding exercises to ease tension, regulate emotions, and create a calmer headspace wherever you are.',
    image: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&w=900&q=80',
  },
  {
    type: 'image',
    date: '15 February  25',
    title: 'Practicing Self-Care and Wellness',
    text: 'Build sustainable self-care routines that nurture body, mind, and spirit — from movement and sleep to reflection and rest.',
    image: 'https://images.unsplash.com/photo-1545389336-cf090694435e?auto=format&fit=crop&w=900&q=80',
  },
]

function ImageCard({ date, title, text, image }) {
  return (
    <div className="relative rounded-2xl overflow-hidden shadow-[0_10px_25px_-12px_rgba(0,0,0,0.45)] w-full h-full group cursor-pointer">
      <img
        src={image}
        alt={title}
        className="absolute inset-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-110"
      />
      <div className="absolute inset-0 bg-black/15 transition-colors duration-300" />

      {/* Date badge */}
      <span className="absolute top-4 left-4 z-20 bg-[#F0E8DA] text-[#222] text-[13px] font-medium px-3 py-1.5 rounded-md shadow">
        {date}
      </span>

      {/* Title pill (hidden on hover) */}
      <div className="absolute bottom-4 left-4 right-8 z-20 bg-[#F0E8DA] text-[#111] text-[15px] font-semibold px-4 py-3 rounded-md shadow transition-opacity duration-300 group-hover:opacity-0">
        <p className="truncate">{title}</p>
      </div>

      {/* Green overlay with info (visible on hover) */}
      <div className="absolute inset-0 z-10 bg-brand p-7 flex flex-col opacity-0 group-hover:opacity-100 transition-opacity duration-500">
        <span className="text-white/90 text-[14px] font-medium mb-8">
          {date}
        </span>
        <h3 className="text-white text-[22px] font-extrabold leading-[1.3] mb-5">
          {title}
        </h3>
        <p className="text-white/85 text-[13.5px] leading-[1.7]">
          {text}
        </p>
      </div>
    </div>
  )
}

function FeatureCard({ date, title, text }) {
  return (
    <div className="relative rounded-2xl overflow-hidden bg-brand w-full h-full p-7 flex flex-col shadow-[0_10px_25px_-12px_rgba(31,95,74,0.55)]">
      <span className="text-white/90 text-[14px] font-medium mb-8">
        {date}
      </span>
      <h3 className="text-white text-[22px] font-extrabold leading-[1.3] mb-5">
        {title}
      </h3>
      <p className="text-white/85 text-[13.5px] leading-[1.7]">
        {text}
      </p>
    </div>
  )
}

export default function SelfHelpResources() {
  return (
    <section className="bg-cream px-6 py-20 max-[768px]:py-14 max-[480px]:py-10 max-[480px]:px-4">
      <div className="max-w-7xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-12 max-[480px]:mb-10">
          <h2 className="text-[38px] font-bold leading-[1.2] text-[#444] max-[1024px]:text-[30px] max-[480px]:text-[22px]">
            Empower Yourself with Practical Strategies &amp; Support
          </h2>
          <span className="block text-[14px] font-semibold text-brand mt-2">
            Self-Help Resources
          </span>
        </div>

        {/* Grid — uniform card size via auto-rows */}
        <div className="grid grid-cols-3 gap-6 max-[900px]:grid-cols-2 max-[600px]:grid-cols-1 max-[900px]:gap-5 *:h-90">
          {items.map((item, i) => {
            const centerColumn = i === 1 || i === 4
            const offsetClass = centerColumn ? 'translate-y-[30px] max-[900px]:translate-y-0' : ''
            const El = item.type === 'feature' ? FeatureCard : ImageCard
            return (
              <div key={i} className={`${offsetClass} h-full`}>
                <El {...item} />
              </div>
            )
          })}
        </div>

        {/* See more button */}
        <div className="flex justify-center mt-20 max-[900px]:mt-14">
          <Link
            to="/resources"
            className="bg-brand text-white px-8 py-3 rounded-lg text-[14px] font-semibold cursor-pointer transition-all duration-300 hover:bg-brand-dark hover:-translate-y-1 hover:shadow-xl hover:scale-105 active:scale-95"
          >
            See more
          </Link>
        </div>

      </div>
    </section>
  )
}
