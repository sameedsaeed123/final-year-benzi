import { Atom, Users, Hospital, UserPlus } from 'lucide-react'

export default function Achievements() {
  const stats = [
    { Icon: Atom,      label: 'Year of Experience',  value: '1+'  },
    { Icon: Users,     label: 'Medical Specialist',  value: '5+'  },
    { Icon: Hospital,  label: 'Medical Specialities', value: '10+' },
    { Icon: UserPlus,  label: 'Happy Patients',      value: '9+'  },
  ]

  return (
    <section className="bg-cream py-20 px-6 max-[768px]:py-14 max-[480px]:py-10 max-[480px]:px-4">
      <div className="max-w-7xl mx-auto">

        {/* Heading */}
        <div className="text-center mb-14 max-[480px]:mb-10">
          <h2 className="text-[44px] font-extrabold leading-[1.15] text-brand max-[1024px]:text-[36px] max-[480px]:text-[28px]">
            Our Achievements
          </h2>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-4 gap-8 max-[900px]:grid-cols-2 max-[480px]:grid-cols-1 max-[900px]:gap-10">
          {stats.map(({ Icon, label, value }) => (
            <div key={label} className="flex flex-col items-center text-center">
              <Icon size={72} strokeWidth={1.6} className="text-brand mb-6" />
              <p className="text-[16px] text-[#5a5a5a] mb-3">
                {label}
              </p>
              <p className="text-[44px] font-extrabold text-[#111] leading-none max-[480px]:text-[36px]">
                {value}
              </p>
            </div>
          ))}
        </div>

      </div>
    </section>
  )
}
