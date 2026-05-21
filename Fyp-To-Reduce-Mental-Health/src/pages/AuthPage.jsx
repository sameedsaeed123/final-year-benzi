import { createElement } from 'react'
import { Link } from 'react-router-dom'
import { Stethoscope, UserRound } from 'lucide-react'

function RoleCard({ icon, title, description, registerTo = '/register?role=therapist', loginTo = '/login?portal=patient' }) {
  return (
    <div className="bg-brand rounded-2xl shadow-md overflow-hidden w-105 flex flex-col max-[480px]:w-full">
      <div className="flex flex-col items-center text-center text-white px-8 pt-8 pb-6 flex-1">
        <span className="w-20 h-20 rounded-full bg-white flex items-center justify-center border-4 border-white/90">
          {createElement(icon, { size: 36, strokeWidth: 2.2, className: 'text-brand' })}
        </span>
        <h3 className="text-[22px] font-extrabold mt-4">{title}</h3>
        <p className="text-[13.5px] text-white/85 leading-[1.7] mt-2 max-w-[320px]">
          {description}
        </p>
      </div>

      <div className="bg-white px-8 py-6 flex justify-center gap-4">
        <Link
          to={registerTo}
          className="bg-brand text-white text-[13.5px] font-semibold px-7 py-2.5 rounded-md no-underline transition-all hover:bg-brand-dark hover:-translate-y-px min-w-32.5 text-center"
        >
          Register Now
        </Link>
        <Link
          to={loginTo}
          className="bg-brand text-white text-[13.5px] font-semibold px-7 py-2.5 rounded-md no-underline transition-all hover:bg-brand-dark hover:-translate-y-px min-w-32.5 text-center"
        >
          Login
        </Link>
      </div>
    </div>
  )
}

export default function AuthPage() {
  return (
    <>
      {/* Spacer for absolute navbar */}
      <div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />

      <section className="bg-cream px-6 py-12 max-[480px]:px-4 max-[480px]:py-8">
        <div className="w-[90%] mx-auto flex flex-col items-center">
          <img
            src="/images/Header-Logo.png"
            alt="Benzi"
            className="h-20 w-auto object-contain"
          />
          <p className="text-[14px] text-[#666] leading-[1.9] max-w-xl text-center mt-5">
            Empowering mental wellness through personalized care
            and evidence-based therapies. Take the first step
            towards a brighter future with us.
          </p>

          <div className="grid grid-cols-2 gap-10 mt-12 items-start max-[900px]:grid-cols-1 max-[900px]:gap-8">
            <RoleCard
              icon={Stethoscope}
              title="Register As Therapist"
              description="It's free to join, just add your portfolio, your website and all your social media links. Now let's find you some work."
              loginTo="/login?portal=therapist"
            />
            <div className="mt-12.5 max-[900px]:mt-0">
              <RoleCard
                icon={UserRound}
                title="Register As User"
                description="Find a therapist near you or leave a review for a therapist you found on Benzi."
                registerTo="/register?role=patient"
                loginTo="/login?portal=patient"
              />
            </div>
          </div>
        </div>
      </section>
    </>
  )
}
