import { useState } from 'react'
import { MoreVertical } from 'lucide-react'
import AdminSidebar from '../../components/AdminSidebar'

const paymentRows = [
	{ id: 'PMT-001', doctor: 'Dr. Rahima', patient: 'John D.', date: '2026-05-01', service: 'Therapy Session', amount: '$120', status: 'Completed' },
	{ id: 'PMT-002', doctor: 'Dr. Shayan', patient: 'Mary L.', date: '2026-05-02', service: 'Counseling', amount: '$95', status: 'Pending' },
	{ id: 'PMT-003', doctor: 'Dr. Sabaa', patient: 'Ali K.', date: '2026-05-02', service: 'Consultation', amount: '$200', status: 'Completed' },
	{ id: 'PMT-004', doctor: 'Dr. Alina', patient: 'Sara P.', date: '2026-05-03', service: 'Therapy Session', amount: '$150', status: 'Pending' },
]

const statusStyles = {
	Completed: 'bg-[#e7f4ee] text-[#1f5f4a]',
	Pending: 'bg-[#fff4df] text-[#b45309]',
}

const monthlyBars = [60, 45, 80]

export default function AdminRevenuePage() {
	const [openMenuId, setOpenMenuId] = useState(null)

	const toggleMenu = (paymentId) => {
		setOpenMenuId((currentId) => (currentId === paymentId ? null : paymentId))
	}

	return (
		<>
			<div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
			<section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
				<div className="grid gap-6 xl:grid-cols-[1fr_260px] max-[1280px]:grid-cols-1">
					<div className="space-y-6">
						<h1 className="text-[18px] font-semibold text-[#0f3a2b]">Revenue</h1>

						<div className="grid gap-4 md:grid-cols-3">
							{[
								{ label: 'Total Revenue', value: '$124,800', delta: '+8.3%' },
								{ label: 'This Month', value: '$24,800', delta: '+4.2%' },
								{ label: 'Pending Payouts', value: '$3,200', delta: '-1.1%' },
							].map((card) => (
								<div key={card.label} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
									<p className="text-[12px] text-[#7d8b7d]">{card.label}</p>
									<p className="mt-2 text-[20px] font-semibold text-[#111]">{card.value}</p>
									<p className="text-[11px] text-[#4f7a66]">{card.delta}</p>
								</div>
							))}
						</div>

						<div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
							<p className="text-[13px] font-semibold text-[#111]">Payments</p>
							<div className="mt-4 overflow-x-auto">
								<table className="min-w-full border border-black/10">
									<thead>
										<tr className="text-left text-[11px] uppercase tracking-[0.2em] text-[#7d8b7d] bg-[#f7f4ef]">
											<th className="px-3 py-3 border border-black/10">Payment ID</th>
											<th className="px-3 py-3 border border-black/10">Doctor</th>
											<th className="px-3 py-3 border border-black/10">Patient</th>
											<th className="px-3 py-3 border border-black/10">Date</th>
											<th className="px-3 py-3 border border-black/10">Service</th>
											<th className="px-3 py-3 border border-black/10">Amount</th>
											<th className="px-3 py-3 border border-black/10">Status</th>
											<th className="px-3 py-3 border border-black/10">Action</th>
										</tr>
									</thead>
									<tbody>
										{paymentRows.map((payment) => (
											<tr key={payment.id} className="text-sm text-[#3f4f41]">
												<td className="px-3 py-3 border border-black/10 font-semibold text-[#111]">{payment.id}</td>
												<td className="px-3 py-3 border border-black/10">{payment.doctor}</td>
												<td className="px-3 py-3 border border-black/10">{payment.patient}</td>
												<td className="px-3 py-3 border border-black/10">{payment.date}</td>
												<td className="px-3 py-3 border border-black/10">{payment.service}</td>
												<td className="px-3 py-3 border border-black/10">{payment.amount}</td>
												<td className="px-3 py-3 border border-black/10">
													<span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyles[payment.status]}`}>
														{payment.status}
													</span>
												</td>
												<td className="px-3 py-3 border border-black/10 relative">
													<button
														className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-[#6b7b6a]"
														onClick={() => toggleMenu(payment.id)}
													>
														<MoreVertical size={14} />
													</button>
													{openMenuId === payment.id && (
														<div className="absolute right-6 top-12 z-10 w-32 rounded-xl border border-black/10 bg-white shadow-lg">
															<button className="w-full px-4 py-2 text-left text-[12px] text-[#3f4f41] hover:bg-[#f5f7f2]">Edit</button>
															<button className="w-full px-4 py-2 text-left text-[12px] text-red-600 hover:bg-[#f5f7f2]">Delete</button>
														</div>
													)}
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>

						<div className="grid gap-6 lg:grid-cols-2">
							<div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
								<p className="text-[13px] font-semibold text-[#111]">Monthly Revenue</p>
								<div className="mt-4 flex flex-col gap-3">
									{['Aug', 'Sep', 'Oct'].map((month, index) => (
										<div key={month} className="flex items-center gap-3 text-[11px] text-[#6b7b6a]">
											<span className="w-8">{month}</span>
											<div className="flex-1 h-3 rounded-full bg-[#e9efe8]">
												<div className="h-3 rounded-full bg-brand" style={{ width: `${monthlyBars[index]}%` }} />
											</div>
											<span>${(monthlyBars[index] * 10).toFixed(0)}</span>
										</div>
									))}
								</div>
							</div>

							<div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
								<p className="text-[13px] font-semibold text-[#111]">Revenue by Plan</p>
								<div className="mt-6 flex items-center justify-center">
									<div
										className="h-28 w-28 rounded-full"
										style={{ background: 'conic-gradient(#1f5f4a 45%, #5a9378 45% 70%, #a9cbb7 70% 100%)' }}
									/>
								</div>
								<div className="mt-6 flex items-center justify-center gap-4 text-[11px] text-[#6b7b6a]">
									<span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#a9cbb7]" />Standard</span>
									<span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-brand" />Pro</span>
									<span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#5a9378]" />Enterprise</span>
								</div>
							</div>
						</div>
					</div>

					<AdminSidebar activeItem="Revenue" />
				</div>
			</section>
		</>
	)
}
