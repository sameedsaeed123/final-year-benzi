export default function FeedbackLearning() {
  return (
    <section className="bg-cream px-6 py-16 max-[480px]:py-10 max-[480px]:px-4">
      <div className="max-w-7xl mx-auto">
        <div className="relative bg-brand rounded-3xl overflow-hidden grid grid-cols-2 items-center max-[900px]:grid-cols-1 max-[480px]:rounded-2xl group transition-all duration-500 hover:shadow-2xl hover:-translate-y-1">

          {/* Text */}
          <div className="relative p-14 max-[768px]:p-10 max-[480px]:p-7">
            <span className="block text-white/80 text-[14px] font-bold mb-4">
              Feedback and Learning
            </span>
            <h2 className="text-white text-[36px] font-extrabold leading-[1.2] mb-5 max-[1024px]:text-[28px] max-[480px]:text-[22px]">
              Our AI bot at Benzi goes beyond assistance
            </h2>
            <p className="text-white/85 text-[14px] leading-[1.8] text-justify">
              It learns and grows with you. Engage in conversations, provide feedback,
              and see personalized recommendations evolve based on your preferences and
              progress. Experience a supportive journey where your input shapes an AI
              companion dedicated to enhancing your mental well-being. Join us and
              witness the power of feedback-driven learning at Benzi.
            </p>
          </div>

          {/* Image */}
          <div className="relative h-full max-[900px]:pb-10 overflow-hidden">
            <img
              src="/images/Group 1000001902.png"
              alt="AI brain held by robotic hand"
              className="absolute -right-27.5 top-0 w-full h-full object-cover transition-transform duration-700 group-hover:scale-105 group-hover:-rotate-1 animate-[float_4s_ease-in-out_infinite]"
            />
          </div>

        </div>
      </div>
    </section>
  )
}
