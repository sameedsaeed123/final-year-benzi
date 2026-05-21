import { Link } from 'react-router-dom'
import { ArrowRight, CheckCircle2 } from 'lucide-react'
import AdminSidebar from '../../components/AdminSidebar'

const plans = [
	{
		name: 'Basic',
		price: '$100',
		features: [
			'Unlimited chatbot conversations',
			'Daily mood & emotion tracking',
			'Access to self-help resource library',
			'Community peer support groups',
		],
		featured: false,
	},
	{
		name: 'Standard',
		price: '$200',
		features: [
			'Everything included in Basic plan',
			'Personalized coping strategies',
			'Weekly mental health progress reports',
			'Priority 24/7 crisis response support',
		],
		featured: true,
	},
	{
		name: 'Premium',
		price: '$300',
		features: [
			'Everything included in Standard plan',
			'Monthly licensed therapist sessions',
			'Custom mental wellness treatment plan',
			'Family & caregiver dashboard access',
		],
		featured: false,
	},
]

const assignments = [
	{ id: '#101', doctor: 'Dr. Rahima', plan: 'Pro', startDate: '2026-01-12', expiryDate: '2027-01-12', status: 'Active' },
	{ id: '#102', doctor: 'Dr. Shayan', plan: 'Standard', startDate: '2026-02-08', expiryDate: '2026-08-08', status: 'Pending' },
	{ id: '#103', doctor: 'Dr. Sabaa', plan: 'Enterprise', startDate: '2025-11-01', expiryDate: '2026-11-01', status: 'Active' },
	{ id: '#104', doctor: 'Dr. Alina', plan: 'Standard', startDate: '2025-09-22', expiryDate: '2026-03-22', status: 'Inactive' },
]

const statusStyles = {
	Active: 'bg-[#e7f4ee] text-[#1f5f4a]',
	Pending: 'bg-[#fff4df] text-[#b45309]',
	Inactive: 'bg-[#fde8e5] text-[#b42318]',
}

export default function AdminSubscriptionsPage() {
	return (
		<>
			<div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
			<section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
				<div className="grid gap-6 xl:grid-cols-[1fr_260px] max-[1280px]:grid-cols-1">
					<div className="space-y-6">
						<div className="grid grid-cols-3 gap-10 items-end max-[900px]:grid-cols-1 max-[900px]:gap-8 max-[900px]:max-w-md max-[900px]:mx-auto max-[900px]:items-stretch">
							{plans.map((plan) => {
								const isFeatured = plan.featured
								return (
									<div
										key={plan.name}
										className={[
											'relative bg-brand rounded-2xl flex flex-col',
											isFeatured
												? 'shadow-[0_20px_45px_-10px_rgba(31,95,74,0.45)] z-10 h-140 max-[900px]:h-auto'
												: 'shadow-[0_18px_35px_-12px_rgba(31,95,74,0.35)] h-122.5 max-[900px]:h-auto',
										].join(' ')}
									>
										{isFeatured && (
											<img
												src="/images/Ellipse 4.png"
												alt=""
												aria-hidden="true"
												className="absolute -top-20 -right-20 w-48 pointer-events-none select-none z-20"
											/>
										)}

										<div className="relative text-center pt-8 pb-6 px-6">
											<h3 className="text-white text-[34px] font-extrabold leading-none max-[480px]:text-[28px]">
												{plan.name}
											</h3>
											<div className="absolute left-6 right-6 bottom-0 h-px bg-white/35" />
										</div>

										<div className="text-center pt-6 pb-2 px-6">
											<p className="text-white text-[40px] font-extrabold leading-none max-[480px]:text-[32px]">
												{plan.price}
											</p>
										</div>

										<ul className="flex-1 px-7 py-6 space-y-4">
											{plan.features.map((feature) => (
												<li key={feature} className="flex items-start gap-3 text-white text-[14px] leading-normal">
													<CheckCircle2 size={18} strokeWidth={2} className="shrink-0 mt-0.5 text-white" />
													<span>{feature}</span>
												</li>
											))}
										</ul>

										<div className="px-5 pb-5 pt-2">
											<Link
												to="/register"
												className={[
													'w-full inline-flex items-center justify-center gap-2 rounded-lg py-3 text-[15px] font-semibold cursor-pointer transition-all hover:-translate-y-px',
													isFeatured
														? 'text-white bg-linear-to-r from-brand-dark via-[#3FB58A] to-brand-dark hover:brightness-110'
														: 'bg-white text-brand hover:bg-white/90',
												].join(' ')}
											>
												Get Started
												<ArrowRight size={16} strokeWidth={2.25} />
											</Link>
										</div>
									</div>
								)
							})}
						</div>

						<div className="flex items-center justify-between">
							<h2 className="text-[16px] font-semibold text-[#0f3a2b]">Subscriptions</h2>
							<button className="rounded-full bg-brand px-4 py-2 text-[12px] font-semibold text-white">+ New Plan</button>
						</div>

						<div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
							<p className="text-[13px] font-semibold text-[#111]">Subscription Assignments</p>
							<div className="mt-4 overflow-x-auto">
								<table className="min-w-full border border-black/10">
									<thead>
										<tr className="text-left text-[11px] uppercase tracking-[0.2em] text-[#7d8b7d] bg-[#f7f4ef]">
											<th className="px-3 py-3 border border-black/10">Doctor ID</th>
											<th className="px-3 py-3 border border-black/10">Doctor Name</th>
											<th className="px-3 py-3 border border-black/10">Plan</th>
											<th className="px-3 py-3 border border-black/10">Start Date</th>
											<th className="px-3 py-3 border border-black/10">Expiry Date</th>
											<th className="px-3 py-3 border border-black/10">Status</th>
											<th className="px-3 py-3 border border-black/10">Action</th>
										</tr>
									</thead>
									<tbody>
										{assignments.map((row) => (
											<tr key={row.id} className="text-sm text-[#3f4f41]">
												<td className="px-3 py-3 border border-black/10 font-semibold text-[#111]">{row.id}</td>
												<td className="px-3 py-3 border border-black/10">{row.doctor}</td>
												<td className="px-3 py-3 border border-black/10">{row.plan}</td>
												<td className="px-3 py-3 border border-black/10">{row.startDate}</td>
												<td className="px-3 py-3 border border-black/10">{row.expiryDate}</td>
												<td className="px-3 py-3 border border-black/10">
													<span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyles[row.status]}`}>
														{row.status}
													</span>
												</td>
												<td className="px-3 py-3 border border-black/10 text-brand">Manage</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							<div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#556b5b]">
								<button className="rounded-full border border-black/10 bg-white px-3 py-2">&lt;</button>
								<button className="rounded-full bg-brand px-3 py-2 text-white">1</button>
								<button className="rounded-full border border-black/10 bg-white px-3 py-2">2</button>
								<button className="rounded-full border border-black/10 bg-white px-3 py-2">3</button>
								<button className="rounded-full border border-black/10 bg-white px-3 py-2">&gt;</button>
							</div>
						</div>
					</div>

					<AdminSidebar activeItem="Subscriptions" />
				</div>
			</section>
		</>
	)
}
