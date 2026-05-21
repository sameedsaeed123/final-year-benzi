import { Brain, Clipboard } from 'lucide-react'

export default function InteractiveTherapy() {
  return (
    <section className="bg-cream px-6 py-16 max-[480px]:py-10 max-[480px]:px-4">
      <div className="max-w-7xl mx-auto grid grid-cols-2 gap-12 items-center max-[900px]:grid-cols-1 max-[900px]:gap-10">
        <div>
          <span className="block text-[14px] font-semibold text-brand mb-3">
            Interactive Therapy Modules
          </span>
          <h2 className="text-[34px] font-extrabold leading-[1.2] text-[#0f0f0f] mb-5 max-[1024px]:text-[28px] max-[480px]:text-[22px]">
            Empower your mental health journey with our interactive therapy modules at Benzi.
          </h2>
          <p className="text-[#555] text-[14.5px] leading-[1.8]">
            Designed by experienced professionals, these modules offer a dynamic and
            engaging approach to mental well-being, allowing you to explore, learn,
            and practice essential skills at your own pace.
          </p>
        </div>

        <div className="relative group">
          <img
            src="/images/man-smiley-woman-discussing 1.png"
            alt="Therapy session"
            className="w-full rounded-2xl object-cover transition-all duration-500 group-hover:scale-[1.02] group-hover:shadow-2xl"
          />
          {/* Floating pill 1 */}
          <div className="absolute left-0 bottom-26 -translate-x-6 bg-white rounded-full shadow-lg flex items-center gap-3 pl-4 pr-6 py-3 max-[600px]:static max-[600px]:translate-x-0 max-[600px]:mt-4 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:-translate-x-8 hover:shadow-2xl hover:scale-105 animate-[float_3s_ease-in-out_infinite]">
            <span className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center shrink-0 transition-all duration-300 hover:bg-brand">
              <Brain size={20} strokeWidth={2} className="text-brand transition-all duration-300 hover:text-white hover:rotate-12" />
            </span>
            <span className="text-[13.5px] font-medium text-[#222]">
              Empower your mental health journey
            </span>
          </div>
          {/* Floating pill 2 */}
          <div className="absolute left-10 bottom-2 bg-white rounded-full shadow-lg flex items-center gap-3 pl-4 pr-6 py-3 max-[600px]:static max-[600px]:mt-3 cursor-pointer transition-all duration-500 hover:-translate-y-2 hover:translate-x-2 hover:shadow-2xl hover:scale-105 animate-[float_3.6s_ease-in-out_infinite]">
            <span className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center shrink-0 transition-all duration-300 hover:bg-brand">
              <Clipboard size={20} strokeWidth={2} className="text-brand transition-all duration-300 hover:text-white hover:-rotate-12" />
            </span>
            <span className="text-[13.5px] font-medium text-[#222]">
              Unlock the potential with Benii.
            </span>
          </div>
        </div>
      </div>
    </section>
  )
}
