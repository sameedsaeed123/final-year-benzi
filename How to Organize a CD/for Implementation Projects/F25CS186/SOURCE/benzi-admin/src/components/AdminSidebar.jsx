import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import {
  BarChart3,
  Briefcase,
  CalendarDays,
  CreditCard,
  HelpCircle,
  Info,
  LayoutDashboard,
  Menu,
  ShieldAlert,
  Tag,
  User,
  Users,
  X,
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
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const content = (onNavigate) => (
    <>
      <div className="px-4 pt-4 pb-2 flex items-center justify-between">
        <p className="text-[11px] uppercase tracking-[0.2em] text-white/60 px-2">Menu</p>
        {onNavigate && (
          <button type="button" onClick={onNavigate} className="p-1.5 rounded-full bg-white/10 hover:bg-white/20" aria-label="Close menu">
            <X size={16} />
          </button>
        )}
      </div>

      <nav className="space-y-0.5 px-3 pb-4">
        {navItems.map((item) => {
          const Icon = item.icon
          const isActive = item.label === activeItem
          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={onNavigate}
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
    </>
  )

  return (
    <>
      {/* Mobile trigger (in flow) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="xl:hidden w-full flex items-center gap-3 rounded-2xl bg-brand text-white px-4 py-3 shadow-sm"
      >
        <Menu size={18} />
        <span className="text-[14px] font-semibold">Menu</span>
        <span className="ml-auto text-[12px] text-white/70 truncate max-w-[55%]">{activeItem}</span>
      </button>

      {/* Desktop sidebar (natural height, not scrollable) */}
      <aside className="hidden xl:block bg-brand text-white xl:w-[260px] xl:min-w-[260px] rounded-[26px] overflow-hidden xl:sticky xl:top-[4.5rem] xl:self-start shadow-lg">
        {content(null)}
      </aside>

      {/* Mobile off-canvas drawer */}
      <div className={`xl:hidden fixed inset-0 z-[80] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-[270px] max-w-[85%] bg-brand text-white overflow-y-auto shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {content(() => setOpen(false))}
        </aside>
      </div>
    </>
  )
}
