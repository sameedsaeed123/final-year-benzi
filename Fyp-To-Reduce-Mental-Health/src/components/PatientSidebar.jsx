import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { ChevronRight, HeartPulse, ListTodo, LogOut, Menu, MessageCircle, ShieldCheck, User, BarChart3, CalendarDays, Stethoscope, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useSocket } from '../context/SocketContext.jsx'

const navItems = [
  { label: 'Dashboard', icon: User, to: '/patient-dashboard' },
  { label: 'Messages', icon: MessageCircle, to: '/patient-chat' },
  { label: 'Goals', icon: ListTodo, to: '/patient-goals' },
  { label: 'Progress', icon: HeartPulse, to: '/patient-progress' },
  { label: 'Appointment', icon: CalendarDays, to: '/patient-appointments' },
  { label: 'Find Doctors', icon: Stethoscope, to: '/doctors' },
  { label: 'Help & Support', icon: ShieldCheck, to: '/patient-help-support' },
  { label: 'Reports', icon: BarChart3, to: '/patient-reports' },
  { label: 'Profile', icon: User, to: '/patient-profile' },
]

const limitedNavItems = [
  { label: 'Find Doctors', icon: Stethoscope, to: '/doctors' },
  { label: 'Appointments', icon: CalendarDays, to: '/patient-appointments' },
]

export default function PatientSidebar({ activeItem = 'Dashboard' }) {
  const { logout, patientLinked } = useAuth()
  const { unreadCount } = useSocket() || {}
  const { pathname } = useLocation()
  const [open, setOpen] = useState(false)
  const items = patientLinked === false ? limitedNavItems : navItems

  useEffect(() => { setOpen(false) }, [pathname])

  useEffect(() => {
    document.body.style.overflow = open ? 'hidden' : ''
    return () => { document.body.style.overflow = '' }
  }, [open])

  const content = (onNavigate) => (
    <>
      <div className="px-6 pt-6 pb-2">
        <div className="flex items-center gap-3 px-2 py-2">
          <img src="/images/benzi-nav-logo.png" alt="Benzi" className="h-9 w-auto object-contain" />
          <div>
            <p className="text-[13px] font-semibold">Benzi</p>
            <p className="text-[11px] text-white/70">Patient Portal</p>
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between gap-3 px-6 pt-4 pb-4">
        <span className="text-[14px] uppercase tracking-[0.2em] font-semibold text-white/80">Menu</span>
        <button type="button" onClick={onNavigate} className="p-2 bg-white/10 hover:bg-white/20 rounded-full xl:cursor-default" aria-label="Close menu">
          {onNavigate ? <X size={18} /> : <ChevronRight size={18} />}
        </button>
      </div>

      <div className="space-y-0 px-4">
        {items.map((item) => {
          const Icon = item.icon
          const isActive = item.label === activeItem
          const showBadge = item.label === 'Messages' && unreadCount > 0
          return (
            <Link
              key={item.label}
              to={item.to}
              onClick={onNavigate}
              className={`w-full flex items-center gap-3 px-4 py-4 text-left transition-all rounded-full ${isActive ? 'bg-white text-brand font-semibold' : 'hover:bg-white/10'}`}
            >
              <Icon size={18} />
              <span className="flex-1">{item.label}</span>
              {showBadge && (
                <span className="h-5 min-w-5 rounded-full bg-white text-brand text-[10px] font-bold flex items-center justify-center px-1">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </Link>
          )
        })}
      </div>

      <div className="border-t border-white/20 mx-4 my-6 pt-6">
        <div className="bg-white/10 p-5 mb-6 rounded-3xl">
          <div className="flex items-center justify-center mb-4 h-12 w-12 mx-auto rounded-full bg-white/15">
            <HeartPulse size={20} />
          </div>
          <h3 className="text-[17px] font-semibold text-center">Set Realistic Goals</h3>
          <p className="text-[13px] text-white/80 mt-3 leading-6 text-center">
            Set realistic and achievable goals for yourself, both short-term and long-term. Break larger goals into smaller, manageable steps to avoid feeling overwhelmed.
          </p>
        </div>
      </div>

      <Link
        to="/login"
        onClick={() => { onNavigate?.(); logout() }}
        className="w-full flex items-center justify-center gap-3 bg-white text-brand py-3 text-[15px] font-semibold transition-all hover:bg-white/90"
      >
        <LogOut size={18} />
        Logout
      </Link>
    </>
  )

  return (
    <>
      {/* Mobile trigger (in flow) */}
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="xl:hidden order-first w-full flex items-center gap-3 rounded-2xl bg-brand text-white px-4 py-3.5 shadow-sm"
      >
        <Menu size={20} />
        <span className="text-[15px] font-semibold">Menu</span>
        <span className="ml-auto text-[13px] text-white/70">{activeItem}</span>
        {activeItem !== 'Messages' && unreadCount > 0 && (
          <span className="h-5 min-w-5 rounded-full bg-white text-brand text-[10px] font-bold flex items-center justify-center px-1">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Desktop sidebar (natural height, not scrollable) */}
      <aside className="hidden xl:block bg-brand text-white xl:w-[280px] xl:min-w-[280px] rounded-[30px] overflow-hidden">
        {content(null)}
      </aside>

      {/* Mobile off-canvas drawer */}
      <div className={`xl:hidden fixed inset-0 z-[70] ${open ? '' : 'pointer-events-none'}`} aria-hidden={!open}>
        <div
          className={`absolute inset-0 bg-black/50 transition-opacity duration-300 ${open ? 'opacity-100' : 'opacity-0'}`}
          onClick={() => setOpen(false)}
        />
        <aside
          className={`absolute left-0 top-0 h-full w-[290px] max-w-[85%] bg-brand text-white overflow-y-auto shadow-2xl transition-transform duration-300 ${open ? 'translate-x-0' : '-translate-x-full'}`}
        >
          {content(() => setOpen(false))}
        </aside>
      </div>
    </>
  )
}
