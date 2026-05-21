import { useEffect, useState } from 'react'
import { Bell, CalendarDays, ChevronRight, ClipboardList, DollarSign, Stethoscope, Users } from 'lucide-react'
import AdminSidebar from '../../components/AdminSidebar'
import { useAuth } from '../../context/AuthContext.jsx'
import { displayFirstName } from '../../lib/userDisplay.js'
import { api } from '../../lib/api.js'

export default function AdminDashboard() {
	const { user } = useAuth()
	const welcomeName = displayFirstName(user)

	const [stats, setStats] = useState({
		totalDoctors: 0,
		totalPatients: 0,
		docsDelta: '',
		patientsDelta: '',
		patientsPerDoctor: [],
		distribution: { mentalHealth: 40, selfCare: 35, therapy: 25 },
		weeklyCounts: [0, 0, 0, 0, 0, 0, 0]
	})
	const [loading, setLoading] = useState(true)

	useEffect(() => {
		async function fetchStats() {
			try {
				const json = await api('/admin/dashboard', { method: 'GET' })
				if (json.success) {
					setStats(json.data)
				}
			} catch (e) {
				console.error('Failed to fetch admin stats:', e)
			} finally {
				setLoading(false)
			}
		}
		fetchStats()
	}, [])

	const statCards = [
		{ label: 'Total Doctors', value: stats.totalDoctors, delta: stats.docsDelta || '+3.2% vs last month', icon: Stethoscope },
		{ label: 'Total Patients', value: stats.totalPatients, delta: stats.patientsDelta || '+5.1% vs last month', icon: Users },
		{ label: 'Monthly Revenue', value: `$${((stats.totalDoctors * 120) + (stats.totalPatients * 45)).toLocaleString()}`, delta: '+4.2% vs last month', icon: DollarSign },
		{ label: 'Active Subscriptions', value: stats.totalPatients, delta: '+1.5% vs last month', icon: ClipboardList },
	]

	const packageStats = [
		{ label: 'Standard Plan', value: stats.distribution?.mentalHealth || 40 },
		{ label: 'Pro Plan', value: stats.distribution?.selfCare || 35 },
		{ label: 'Enterprise Plan', value: stats.distribution?.therapy || 25 },
	]

	const calendarDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']

	return (
		<>
			<div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
			<section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
				<div className="grid gap-6 xl:grid-cols-[1fr_260px] max-[1280px]:grid-cols-1">
					<div className="space-y-6">
						<div className="flex flex-wrap items-center justify-between gap-4">
							<p className="text-[18px] font-semibold text-[#0f3a2b]">Dashboard</p>
							<button className="flex items-center gap-2 bg-white border border-black/10 rounded-full px-4 py-3 shadow-sm text-[13px] font-semibold text-[#111] transition-all hover:-translate-y-0.5">
								<Bell size={16} />
								<span>{welcomeName}</span>
								<ChevronRight size={16} />
							</button>
						</div>

						<h1 className="text-center text-[26px] font-extrabold text-brand">{`Welcome ${welcomeName}!`}</h1>

						{loading ? (
							<div className="flex items-center justify-center h-48 bg-white/50 border border-brand/10 rounded-2xl">
								<p className="text-sm font-semibold text-brand animate-pulse">Loading Live Database Stats...</p>
							</div>
						) : (
							<>
								<div className="grid gap-4 md:grid-cols-2 xl:grid-cols-4">
									{statCards.map((card) => {
										const Icon = card.icon
										return (
											<div key={card.label} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
												<div className="flex items-center justify-between">
													<span className="text-[12px] text-[#7d8b7d]">{card.label}</span>
													<span className="h-8 w-8 rounded-full bg-brand/10 flex items-center justify-center text-brand">
														<Icon size={16} />
													</span>
												</div>
												<p className="mt-3 text-[20px] font-semibold text-[#111]">{card.value}</p>
												<p className="text-[11px] text-[#4f7a66]">{card.delta}</p>
											</div>
										)
									})}
								</div>

								<div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
									<div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
										<p className="text-[13px] text-[#7d8b7d]">Top Subscriptions</p>
										<h2 className="text-[18px] font-semibold text-[#111]">Most Sold Packages</h2>
										<div className="mt-4 space-y-4">
											{packageStats.map((item) => (
												<div key={item.label} className="flex items-center gap-4">
													<div
														className="h-11 w-11 rounded-full flex items-center justify-center text-[11px] font-semibold text-brand"
														style={{
															background: `conic-gradient(#1f5f4a ${item.value}%, #e9efe8 ${item.value}% 100%)`,
														}}
													>
														{item.value}%
													</div>
													<div>
														<p className="text-[13px] font-semibold text-[#111]">{item.label}</p>
														<p className="text-[11px] text-[#7d8b7d]">{item.value}% of total sales</p>
													</div>
												</div>
											))}
										</div>
									</div>

									<div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
										<div className="flex items-center justify-between">
											<p className="text-[13px] text-[#7d8b7d]">Patient Distribution</p>
											<div className="flex items-center gap-2 text-[11px] text-[#6b7b6a]">
												<span className="rounded-full bg-brand text-white px-3 py-1">This Week</span>
											</div>
										</div>
										<h2 className="text-[18px] font-semibold text-[#111] mt-1">New Patients Registered</h2>
										<div className="mt-6 flex h-36 items-end justify-between gap-2 border-b border-black/5 pb-2">
											{stats.weeklyCounts.map((count, index) => {
												const maxHeight = 100 // max percent
												const maxCount = Math.max(...stats.weeklyCounts, 1)
												const heightPercent = (count / maxCount) * maxHeight
												return (
													<div key={index} className="flex-1 flex flex-col items-center gap-2">
														<span className="text-[10px] font-bold text-brand">{count}</span>
														<div 
															className="w-full bg-brand/25 hover:bg-brand transition-all rounded-t-md"
															style={{ height: `${Math.max(heightPercent, 10)}px` }}
														/>
														<span className="text-[10px] text-[#7d8b7d] uppercase">{calendarDays[index][0]}</span>
													</div>
												)
											})}
										</div>
									</div>
								</div>

								{/* Patients count per doctor Table */}
								<div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm mt-6">
									<p className="text-[13px] text-[#7d8b7d] mb-1">Patients</p>
									<h2 className="text-[18px] font-semibold text-[#111] mb-4">Patient Count Per Doctor</h2>
									<div className="overflow-x-auto">
										<table className="w-full text-left border-collapse text-[13px]">
											<thead>
												<tr className="border-b border-black/5 text-[#7d8b7d] uppercase tracking-wider font-semibold">
													<th className="py-3 px-4">#</th>
													<th className="py-3 px-4">Doctor Name</th>
													<th className="py-3 px-4">Specialization</th>
													<th className="py-3 px-4 text-center">Total Patients</th>
													<th className="py-3 px-4 text-center">Active (Logins in 7d)</th>
													<th className="py-3 px-4 text-center">Inactive</th>
													<th className="py-3 px-4">Last Session</th>
												</tr>
											</thead>
											<tbody>
												{stats.patientsPerDoctor && stats.patientsPerDoctor.length > 0 ? (
													stats.patientsPerDoctor.map((item, index) => (
														<tr key={index} className="border-b border-black/5 hover:bg-[#fafbfa] transition-all">
															<td className="py-4 px-4 font-semibold text-[#666]">{index + 1}</td>
															<td className="py-4 px-4 font-bold text-brand">{item.doctorName}</td>
															<td className="py-4 px-4 text-[#555]">{item.specialization}</td>
															<td className="py-4 px-4 text-center font-semibold text-[#111]">{item.totalPatients}</td>
															<td className="py-4 px-4 text-center">
																<span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#e6f4ea] text-[#137333]">
																	{item.active} Active
																</span>
															</td>
															<td className="py-4 px-4 text-center">
																<span className="inline-block px-2.5 py-1 rounded-full text-[11px] font-semibold bg-[#fce8e6] text-[#c5221f]">
																	{item.inactive} Inactive
																</span>
															</td>
															<td className="py-4 px-4 text-[#555] font-semibold">{item.lastSession}</td>
														</tr>
													))
												) : (
													<tr>
														<td colSpan="7" className="py-8 text-center text-[#7d8b7d]">
															No doctors or assigned patients found.
														</td>
													</tr>
												)}
											</tbody>
										</table>
									</div>
								</div>
							</>
						)}
					</div>

					<AdminSidebar activeItem="Dashboard" />
				</div>
			</section>
		</>
	)
}
