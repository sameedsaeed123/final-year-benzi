import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronRight, ClipboardList, Clock, Star, Briefcase, ChevronLeft } from 'lucide-react'
import TherapistSidebar from '../../components/TherapistSidebar'
import { useAuth } from '../../context/AuthContext.jsx'
import { displayFirstName } from '../../lib/userDisplay.js'
import { useCachedGet, cachedFetch } from '../../lib/apiCache.js'

const STAT_ICONS = [Briefcase, ClipboardList, Star, Clock]

const defaultPackageData = [
	{ label: 'Stress Management', value: 0, color: '#1F5F4A' },
	{ label: 'Career Counselling', value: 0, color: '#1F5F4A' },
]

const defaultStatCards = [
	{ label: 'Active Services', value: '0', delta: '+0.0% vs last Month', accent: 'text-[#1f5f4a]' },
	{ label: 'New Services', value: '0', delta: '+0.0% vs last Month', accent: 'text-[#b45309]' },
	{ label: 'Avg Reviews', value: '0', delta: '+0.0% vs last Month', accent: 'text-[#1f5f4a]' },
	{ label: 'Avg Reply Time', value: '0 min', delta: '+0.0% vs last Month', accent: 'text-[#1f5f4a]' },
].map((c, i) => ({ ...c, icon: STAT_ICONS[i] }))

function padRevenueWeekly(rows) {
	const labels = ['Week 1', 'Week 2', 'Week 3', 'Week 4', 'Week 5', 'Week 6', 'Week 7', 'Week 8', 'Week 9']
	return labels.map((label, i) => rows[i] || { label, value: '0', width: '0%' })
}
function padRevenueMonthly(rows) {
	const labels = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep']
	return labels.map((label, i) => rows[i] || { label, value: '0', width: '0%' })
}
function padRevenueYearly(rows) {
	const labels = ['2024', '2025', '2026', '2027', '2028', '2029', '2030', '2031', '2032']
	return labels.map((label, i) => rows[i] || { label, value: '0', width: '0%' })
}

const emptyRevenue = {
	Weekly: padRevenueWeekly([]),
	Monthly: padRevenueMonthly([]),
	Yearly: padRevenueYearly([]),
}

const revenuePeriods = ['Weekly', 'Monthly', 'Yearly']

// ─── Dynamic Calendar Hook ───────────────────────────────────────────────────
function useDynamicCalendar() {
	const now = new Date()
	const [year, setYear] = useState(now.getFullYear())
	const [month, setMonth] = useState(now.getMonth() + 1) // 1-based
	const [bookedDays, setBookedDays] = useState([])
	const [pendingDays, setPendingDays] = useState([])
	const [confirmedDays, setConfirmedDays] = useState([])

	useEffect(() => {
		let cancelled = false
		const load = async () => {
			try {
				const data = await cachedFetch(`/appointments/therapist/calendar?year=${year}&month=${month}`)
				if (!cancelled && data) {
					setBookedDays(data.bookedDays || [])
					setPendingDays(data.pendingDays || [])
					setConfirmedDays(data.confirmedDays || [])
				}
			} catch {
				if (!cancelled) {
					setBookedDays([])
					setPendingDays([])
					setConfirmedDays([])
				}
			}
		}
		void load()
		return () => { cancelled = true }
	}, [year, month])

	const prevMonth = () => {
		if (month === 1) { setYear((y) => y - 1); setMonth(12) }
		else setMonth((m) => m - 1)
	}
	const nextMonth = () => {
		if (month === 12) { setYear((y) => y + 1); setMonth(1) }
		else setMonth((m) => m + 1)
	}

	// Build calendar grid
	const calendarGrid = useMemo(() => {
		const firstDay = new Date(year, month - 1, 1).getDay() // 0=Sun
		// Shift so Mon=0
		const startOffset = (firstDay + 6) % 7
		const daysInMonth = new Date(year, month, 0).getDate()
		const cells = []
		for (let i = 0; i < startOffset; i++) cells.push(null)
		for (let d = 1; d <= daysInMonth; d++) cells.push(d)
		// Pad to complete last row
		while (cells.length % 7 !== 0) cells.push(null)
		const rows = []
		for (let i = 0; i < cells.length; i += 7) rows.push(cells.slice(i, i + 7))
		return rows
	}, [year, month])

	const monthName = new Date(year, month - 1, 1).toLocaleString('en-US', { month: 'long' })
	const today = new Date()
	const isCurrentMonth = today.getFullYear() === year && today.getMonth() + 1 === month
	const todayDate = isCurrentMonth ? today.getDate() : null

	return { year, month, monthName, calendarGrid, bookedDays, pendingDays, confirmedDays, todayDate, prevMonth, nextMonth }
}

export default function TherapistDashboard() {
	const { user } = useAuth()
	const welcomeName = displayFirstName(user)
	const [selectedRevenuePeriod, setSelectedRevenuePeriod] = useState('Weekly')
	const calendar = useDynamicCalendar()
	// Cached: instant on repeat visits; silent background refresh.
	const { data: dash } = useCachedGet('/therapists/dashboard/me')

	const statCards = useMemo(() => {
		const fromApi = dash?.statCards
		if (!fromApi || !Array.isArray(fromApi)) return defaultStatCards
		return fromApi.map((c, i) => ({
			...c,
			icon: STAT_ICONS[i] || Briefcase,
		}))
	}, [dash])

	const packageData = dash?.packageData?.length ? dash.packageData : defaultPackageData
	const revenueData = useMemo(
		() => ({
			Weekly: dash?.revenue?.Weekly ?? emptyRevenue.Weekly,
			Monthly: dash?.revenue?.Monthly ?? emptyRevenue.Monthly,
			Yearly: dash?.revenue?.Yearly ?? emptyRevenue.Yearly,
		}),
		[dash]
	)
	const patientOptions = dash?.patientOptions?.length ? dash.patientOptions : ['—']
	const todayTopic = dash?.today?.topic ?? 'No sessions scheduled for today.'
	const todayPatient = dash?.today?.patientName?.trim() || ''

	return (
		<>
			<div className="pt-4" />
			<section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
				<div className="grid gap-6 xl:grid-cols-[1.45fr_280px] max-[1280px]:grid-cols-1">
					<div className="space-y-6">
						<div className="flex flex-wrap items-center justify-between gap-4">
							<div>
								<p className="text-sm uppercase tracking-[0.25em] text-brand/70">Therapist Dashboard</p>
								<h1 className="text-[36px] font-extrabold text-[#0f3a2b] max-[640px]:text-[28px]">{`Welcome ${welcomeName}!`}</h1>
							</div>
							<Link
								to="/therapist-profile"
								className="flex items-center gap-2 bg-white border border-black/10 rounded-full px-4 py-3 shadow-sm text-[14px] font-semibold text-[#111] transition-all hover:-translate-y-0.5"
							>
								<Bell size={18} />
								<span>{welcomeName}</span>
								<ChevronRight size={18} />
							</Link>
						</div>

						<div className="grid gap-6 lg:grid-cols-[1.2fr_0.9fr]">
							<div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
								<div className="grid gap-4 sm:grid-cols-2">
									{statCards.map((item) => {
										const Icon = item.icon
										return (
											<div key={item.label} className="rounded-[20px] border border-black/10 bg-[#fdfdfb] p-4">
												<div className="flex items-center justify-between">
													<span className="text-[13px] font-semibold text-[#445445]">{item.label}</span>
													<Icon size={18} className={item.accent} />
												</div>
												<div className="mt-3 text-[20px] font-semibold text-[#0f3a2b]">{item.value}</div>
												<div className="mt-1 text-[12px] text-[#5a6a5d]">{item.delta}</div>
											</div>
										)
									})}
								</div>
							</div>

							<div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
								<p className="text-[18px] font-semibold text-[#111]">Most Bought Package</p>
								<p className="mt-1 text-[12px] text-[#6d7c6f]">Summaries of your most bought packages</p>
								<div className="mt-6 space-y-5">
									{packageData.map((item) => (
										<div key={item.label} className="flex items-center justify-between gap-4">
											<div>
												<p className="text-[13px] font-semibold text-[#2f3f33]">{item.label}</p>
												<div className="mt-2 flex items-center gap-3">
													<div
														className="relative h-14 w-14 rounded-full"
														style={{
															background: `conic-gradient(${item.color} 0 ${item.value}%, #e7eee5 ${item.value}% 100%)`,
														}}
													>
														<div className="absolute inset-2 rounded-full bg-white" />
														<div className="absolute inset-0 flex items-center justify-center text-[11px] font-semibold text-[#2f3f33]">
															{item.value}%
														</div>
													</div>
												</div>
											</div>
										</div>
									))}
								</div>
							</div>
						</div>

						<div className="grid gap-6 lg:grid-cols-[0.95fr_1.05fr]">
							<div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
								<div className="flex items-center justify-between">
									<p className="text-[18px] font-semibold text-[#111]">Today's Appointments</p>
								</div>
								<div className="mt-4 rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
									<p className="text-[12px] text-[#4d5c50]">{todayTopic}</p>
									{dash?.today?.dateTime && (
										<p className="mt-2 text-[12px] font-semibold text-[#1f5f4a]">{dash.today.dateTime}</p>
									)}
									<div className="mt-4 flex items-center gap-2 text-[12px] text-[#5a6a5d]">
										<span className="h-5 w-5 rounded-full bg-[#0f4e34] text-white flex items-center justify-center text-[10px]">
											{(todayPatient || '—').charAt(0).toUpperCase()}
										</span>
										{todayPatient || '—'}
									</div>
									{dash?.today?.meetLink && (
										<a
											href={dash.today.meetLink}
											target="_blank"
											rel="noreferrer"
											className="mt-4 inline-flex items-center gap-2 rounded-full bg-[#0f4e34] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#164e35]"
										>
											Join video session
										</a>
									)}
								</div>

								<div className="mt-5">
									{/* Dynamic Calendar */}
									<div className="flex items-center justify-between mb-2">
										<button
											type="button"
											onClick={calendar.prevMonth}
											className="rounded-full p-1 hover:bg-[#f0f4ee] text-[#1f5f4a]"
											aria-label="Previous month"
										>
											<ChevronLeft size={14} />
										</button>
										<span className="text-[12px] font-semibold text-[#111]">
											{calendar.monthName} {calendar.year}
										</span>
										<button
											type="button"
											onClick={calendar.nextMonth}
											className="rounded-full p-1 hover:bg-[#f0f4ee] text-[#1f5f4a]"
											aria-label="Next month"
										>
											<ChevronRight size={14} />
										</button>
									</div>
									<div className="grid grid-cols-7 text-center text-[10px] font-semibold text-[#7d8b7d] mb-1">
										{['Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa', 'Su'].map((d) => (
											<span key={d}>{d}</span>
										))}
									</div>
									{calendar.calendarGrid.map((row, ri) => (
										<div key={ri} className="grid grid-cols-7 text-center text-[11px]">
											{row.map((day, ci) => {
												if (!day) return <span key={ci} className="py-1" />
												const isToday = day === calendar.todayDate
												const isConfirmed = calendar.confirmedDays.includes(day)
												const isPending = !isConfirmed && calendar.pendingDays.includes(day)
												return (
													<span
														key={ci}
														title={isConfirmed ? 'Confirmed' : isPending ? 'Pending' : undefined}
														className={[
															'py-1 mx-auto w-6 rounded-full flex items-center justify-center',
															isConfirmed ? 'bg-[#0f4e34] text-white font-bold' : '',
															isPending ? 'bg-[#d4edda] text-[#1f5f4a] font-semibold' : '',
															isToday && !isConfirmed && !isPending ? 'ring-2 ring-[#0f4e34] text-[#0f4e34] font-bold' : '',
															!isConfirmed && !isPending && !isToday ? 'text-[#6d7c6f]' : '',
														].join(' ')}
													>
														{day}
													</span>
												)
											})}
										</div>
									))}
									<div className="mt-2 flex items-center gap-3 text-[10px] text-[#7d8b7d]">
										<span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#0f4e34] inline-block" /> Confirmed</span>
										<span className="flex items-center gap-1"><span className="h-2 w-2 rounded-full bg-[#d4edda] border border-[#a8d5b5] inline-block" /> Pending</span>
									</div>
								</div>
							</div>

							<div className="rounded-[30px] border border-black/5 bg-cream p-5 shadow-sm">
								<div className="flex flex-wrap items-center justify-between gap-2">
									<p className="text-[18px] font-semibold text-[#111]">Generated Revenue</p>
									<div className="flex items-center gap-1.5 rounded-full border border-black/10 bg-[#f5f7f2] p-1 text-[12px]">
										{revenuePeriods.map((period) => (
											<button
												key={period}
												type="button"
												className={`rounded-full px-2.5 py-1 font-semibold transition ${period === selectedRevenuePeriod ? 'bg-brand text-white' : 'text-[#1f5f4a]'
													}`}
												onClick={() => setSelectedRevenuePeriod(period)}
											>
												{period}
											</button>
										))}
									</div>
								</div>
								<div className="mt-4 space-y-3">
									{(revenueData[selectedRevenuePeriod] || emptyRevenue.Weekly).map((item) => (
										<div key={item.label} className="flex items-center gap-3">
											<span className="text-[12px] text-[#6d7c6f] w-14">{item.label}</span>
											<div className="flex-1">
												<div className="h-2 rounded-full bg-[#e7eee5]">
													<div className="h-2 rounded-full bg-[#0f4e34]" style={{ width: item.width }} />
												</div>
											</div>
											<span className="rounded-md bg-[#0f4e34] px-2.5 py-1 text-[11px] font-semibold text-white">{item.value?.replace('$', '') || item.value}</span>
										</div>
									))}
								</div>
							</div>
						</div>

					</div>

					<TherapistSidebar activeItem="Dashboard" />
				</div>
			</section>
		</>
	)
}
