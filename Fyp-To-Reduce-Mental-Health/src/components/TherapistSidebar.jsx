import { Link } from 'react-router-dom'
import { CalendarDays, CreditCard, FileText, Info, LogOut, LayoutDashboard, Briefcase, Users, User, ChevronRight, MessageCircle, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useSocket } from '../context/SocketContext.jsx'

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

const limitedNavItems = [
	{ label: 'Book Appointment', icon: CalendarDays, to: '/therapist-appointments' },
	{ label: 'Appointments', icon: CalendarDays, to: '/therapist-appointments' },
]

export default function TherapistSidebar({ activeItem = 'Dashboard' }) {
	const { logout } = useAuth()
	const { unreadCount } = useSocket() || {}
	const items = navItems
	return (
		<aside className="bg-brand text-white w-full xl:w-[280px] xl:min-w-[280px] rounded-[30px] overflow-hidden max-[640px]:order-first">
			<div className="px-6 pt-6 pb-2">
				<div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
					<div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
						<img src="/images/Header-Logo.png" alt="Benzi Logo" className="h-7 w-7 object-contain" />
					</div>
					<div>
						<p className="text-[13px] font-semibold">Benzi</p>
						<p className="text-[11px] text-white/70">Therapist Portal</p>
					</div>
				</div>
			</div>

			<div className="flex items-center justify-between gap-3 px-6 pt-4 pb-4">
				<span className="text-[14px] uppercase tracking-[0.2em] font-semibold text-white/80">Menu</span>
				<button className="p-2 bg-white/10 hover:bg-white/20 rounded-full">
					<ChevronRight size={18} />
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
				onClick={() => logout()}
				className="w-full flex items-center justify-center gap-3 bg-white text-brand py-3 text-[15px] font-semibold transition-all hover:bg-white/90"
			>
				<LogOut size={18} />
				Logout
			</Link>
		</aside>
	)
}
