import { Link } from 'react-router-dom'
import { BarChart3, Briefcase, CalendarDays, CreditCard, HelpCircle, Info, LayoutDashboard, LogOut, Mail, User, Users, ShieldAlert } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const navItems = [
	{ label: 'Dashboard', icon: LayoutDashboard, to: '/admin-dashboard' },
	{ label: 'Doctors', icon: Briefcase, to: '/admin-doctors' },
	{ label: 'Verification Requests', icon: ShieldAlert, to: '/admin-verifications' },
	{ label: 'Subscriptions', icon: CreditCard, to: '/admin-subscriptions' },
	{ label: 'Patients', icon: Users, to: '/admin-patients' },
	{ label: 'Appointments', icon: CalendarDays, to: '/admin-appointments' },
	{ label: 'Revenue', icon: BarChart3, to: '/admin-revenue' },
	{ label: 'Customer Support', icon: HelpCircle, to: '/admin-customer-support' },
]

export default function AdminSidebar({ activeItem = 'Dashboard' }) {
	const { logout } = useAuth()
	return (
		<aside className="bg-brand text-white w-full xl:w-[260px] xl:min-w-[260px] rounded-[26px] overflow-hidden max-[640px]:order-first">
			<div className="px-5 pt-5 pb-4">
				<div className="flex items-center gap-3 rounded-2xl bg-white/10 px-4 py-3">
					<div className="h-10 w-10 rounded-full bg-white flex items-center justify-center">
						<img src="/images/Header-Logo.png" alt="Benzi Logo" className="h-7 w-7 object-contain" />
					</div>
					<div>
						<p className="text-[13px] font-semibold">Benzi Admin</p>
						<p className="text-[11px] text-white/70">admin@benzi.com</p>
					</div>
				</div>
			</div>

			<div className="space-y-0 px-4">
				{navItems.map((item) => {
					const Icon = item.icon
					const isActive = item.label === activeItem
					return (
						<Link
							key={item.label}
							to={item.to}
							className={`w-full flex items-center gap-3 px-4 py-3 text-left transition-all rounded-full ${isActive ? 'bg-white text-brand font-semibold' : 'hover:bg-white/10'}`}
						>
							<Icon size={16} />
							{item.label}
						</Link>
					)
				})}
			</div>

			<div className="px-4 py-6">
				<div className="rounded-2xl bg-white/10 p-4">
					<p className="text-[12px] font-semibold">Set Realistic Goals</p>
					<p className="mt-2 text-[10.5px] text-white/70 leading-4">
						Track admin tasks consistently for steady growth.
					</p>
				</div>
			</div>

			<Link
				to="/login"
				onClick={() => logout()}
				className="w-full flex items-center justify-center gap-3 bg-white text-brand py-3 text-[14px] font-semibold transition-all hover:bg-white/90"
			>
				<LogOut size={16} />
				Logout
			</Link>
		</aside>
	)
}
