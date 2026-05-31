import { useEffect, useState } from 'react'
import { ClipboardList, DollarSign, Stethoscope, Users } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout.jsx'
import AdminPageLoader from '../../components/AdminPageLoader.jsx'
import { AdminAlert } from '../../components/AdminAlert.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { displayFirstName } from '../../lib/userDisplay.js'
import { api } from '../../lib/api.js'
import AdminPagination from '../../components/AdminPagination.jsx'

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
	const [ready, setReady] = useState(false)
	const [loadError, setLoadError] = useState('')
	const [patientsTablePage, setPatientsTablePage] = useState(1)

	useEffect(() => {
		let cancelled = false
		async function fetchStats() {
			try {
				if (!ready) setLoading(true)
				setLoadError('')
				const json = await api(
					`/admin/dashboard?patientsPage=${patientsTablePage}&patientsLimit=5`,
					{ method: 'GET', silent: true }
				)
				if (!cancelled && json.success) {
					setStats(json.data)
					setReady(true)
				}
			} catch (e) {
				if (!cancelled) setLoadError(e.message || 'Failed to load dashboard')
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		fetchStats()
		return () => { cancelled = true }
	}, [patientsTablePage])

	const statCards = [
		{ label: 'Total Doctors', value: stats.totalDoctors, delta: stats.docsDelta || '', icon: Stethoscope },
		{ label: 'Total Patients', value: stats.totalPatients, delta: stats.patientsDelta || '', icon: Users },
		{ label: 'Monthly Revenue', value: `$${Number(stats.monthlyRevenue || 0).toLocaleString()}`, delta: 'From subscriptions', icon: DollarSign },
		{ label: 'Active Subscriptions', value: stats.activeSubscriptions ?? 0, delta: `Total revenue $${Number(stats.totalRevenue || 0).toLocaleString()}`, icon: ClipboardList },
	]

	const packageStats = (stats.planDistribution || []).length
		? stats.planDistribution.map((p) => ({
				label: p.planName || p.planSlug,
				value: p.count,
			}))
		: [
				{ label: 'No plans yet', value: 0 },
			]

	const calendarDays = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
	const maxPlanCount = Math.max(1, ...packageStats.map((p) => p.value))
	const patientRows = stats.patientsPerDoctor || []
	const patientsTable = stats.patientsTable || {}
	const patientTablePages = patientsTable.totalPages ?? 1
	const patientTableTotal = patientsTable.total ?? patientRows.length

	return (
		<AdminLayout activeItem="Dashboard" title={`Welcome ${welcomeName}!`}>
					<div className="space-y-6">
						<AdminAlert type="error" message={loadError} onDismiss={() => setLoadError('')} />

						{!ready && loading ? (
							<AdminPageLoader label="Loading dashboard…" />
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
										<p className="text-[13px] text-[#7d8b7d]">Subscriptions</p>
										<h2 className="text-[18px] font-semibold text-[#111]">Therapists by plan</h2>
										<div className="mt-4 space-y-4">
											{packageStats.map((item) => {
												const pct = Math.round((item.value / maxPlanCount) * 100)
												return (
												<div key={item.label} className="flex items-center gap-4">
													<div
														className="h-11 w-11 rounded-full flex items-center justify-center text-[11px] font-semibold text-brand"
														style={{
															background: `conic-gradient(#1f5f4a ${pct}%, #e9efe8 ${pct}% 100%)`,
														}}
													>
														{item.value}
													</div>
													<div>
														<p className="text-[13px] font-semibold text-[#111]">{item.label}</p>
														<p className="text-[11px] text-[#7d8b7d]">{item.value} therapist(s)</p>
													</div>
												</div>
											)})}
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
												{patientRows.length > 0 ? (
													patientRows.map((item) => (
														<tr key={item.doctorName || item.id} className="border-b border-black/5 hover:bg-[#fafbfa] transition-all">
															<td className="py-4 px-4 font-semibold text-[#666]">{item.id}</td>
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
									<AdminPagination
										currentPage={patientsTablePage}
										totalPages={patientTablePages}
										totalItems={patientTableTotal}
										onPageChange={setPatientsTablePage}
									/>
								</div>
							</>
						)}
					</div>
		</AdminLayout>
	)
}
