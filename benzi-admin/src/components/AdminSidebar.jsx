import { Link } from 'react-router-dom'
import {
  BarChart3,
  Briefcase,
  CalendarDays,
  CreditCard,
  HelpCircle,
  Info,
  LayoutDashboard,
  ShieldAlert,
  Tag,
  User,
  Users,
} from 'lucide-react'

const navItems = [
  { label: 'Dashboard', icon: LayoutDashboard, to: '/admin-dashboard' },
  { label: 'Doctors', icon: Briefcase, to: '/admin-doctors' },
  { label: 'Verification Requests', icon: ShieldAlert, to: '/admin-verifications' },
  { label: 'Subscriptions', icon: CreditCard, to: '/admin-subscriptions' },
  { label: 'Plans', icon: CreditCard, to: '/admin-plans' },
  { label: 'Coupons', icon: Tag, to: '/admin-coupons' },
  { label: 'Patients', icon: Users, to: '/admin-patients' },
  { label: 'Appointments', icon: CalendarDays, to: '/admin-appointments' },
  { label: 'Revenue', icon: BarChart3, to: '/admin-revenue' },
  { label: 'Customer Support', icon: HelpCircle, to: '/admin-customer-support' },
  { label: 'Profile', icon: User, to: '/admin-profile' },
  { label: 'About Benzi', icon: Info, to: '/admin-about-benzi' },
]

export default function AdminSidebar({ activeItem = 'Dashboard' }) {
  return (
    <aside className="bg-brand text-white w-full xl:w-[260px] xl:min-w-[260px] rounded-[26px] overflow-hidden xl:sticky xl:top-[4.5rem] xl:self-start xl:max-h-[calc(100vh-5.5rem)] xl:overflow-y-auto shadow-lg">
      <div className="px-4 pt-4 pb-2">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/60 px-2">Menu</p>
      </div>

      <nav className="space-y-0.5 px-3 pb-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.label === activeItem
          return (
            <Link
              key={item.label}
              to={item.to}
              className={`w-full flex items-center gap-3 px-4 py-2.5 text-left transition-all rounded-full text-[13px] ${
                isActive ? 'bg-white text-brand font-semibold' : 'hover:bg-white/10 text-white/95'
              }`}
            >
              <Icon size={16} className="shrink-0" />
              <span className="truncate">{item.label}</span>
            </Link>
          )
        })}
      </nav>

      <div className="px-4 pb-5">
        <div className="rounded-2xl bg-white/10 p-4">
          <p className="text-[12px] font-semibold">Subscription limits</p>
          <p className="mt-2 text-[10.5px] text-white/70 leading-4">
            Plans edited here apply patient & AI caps for subscribed therapists.
          </p>
        </div>
      </div>
    </aside>
  )
}
