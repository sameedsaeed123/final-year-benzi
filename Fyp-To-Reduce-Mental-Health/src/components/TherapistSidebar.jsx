import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CalendarDays, CreditCard, FileText, Info, LogOut, LayoutDashboard, Briefcase, Users, User, ChevronRight, Menu, MessageCircle, ShieldCheck, X } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useSocket } from '../context/SocketContext.jsx'
import TherapistActivityBell from './TherapistActivityBell.jsx'

const navItems = [
	{ label: 'Dashboard', icon: LayoutDashboard, to: '/therapist-dashboard' },
	{ label: 'Availability', icon: CalendarDays, to: '/therapist-availability' },
	{ label: 'Appointment', icon: CalendarDays, to: '/therapist-appointments' },
	{ label: 'Clients', icon: Users, to: '/therapist-clients' },
	{ label: 'Messages', icon: MessageCircle, to: '/therapist-chat' },
	{ label: 'Reports', icon: FileText, to: '/therapist-reports' },
	{ label: 'Services', icon: Briefcase, to: '/therapist-services' },
	{ label: 'Subscription', icon: CreditCard, to: '/therapist-subscription' },
	{ label: 'Payment', icon: CreditCard, to: '/therapist-payment' },
	{ label: 'Help & Support', icon: ShieldCheck, to: '/therapist-help-support' },
	{ label: 'Profile', icon: User, to: '/therapist-profile' },
	{ label: 'About Benzi', icon: Info, to: '/therapist-about' },
]

export default function TherapistSidebar({ activeItem = 'Dashboard' }) {
	const { logout } = useAuth()
	const { unreadCount } = useSocket() || {}
	const { pathname } = useLocation()
	const [open, setOpen] = useState(false)
	const items = navItems

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
						<p className="text-[11px] text-white/70">Therapist Portal</p>
					</div>
				</div>
			</div>

			<div className="flex items-center justify-between gap-3 px-6 pt-4 pb-4">
				<span className="text-[14px] uppercase tracking-[0.2em] font-semibold text-white/80">Menu</span>
				<div className="flex items-center gap-1">
					<TherapistActivityBell />
					<button type="button" onClick={onNavigate} className="p-2 bg-white/10 hover:bg-white/20 rounded-full xl:cursor-default" aria-label="Close menu">
						{onNavigate ? <X size={18} /> : <ChevronRight size={18} />}
					</button>
				</div>
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

			<div className="border-t border-white/20 mx-4 my-6 pt-6" />

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
