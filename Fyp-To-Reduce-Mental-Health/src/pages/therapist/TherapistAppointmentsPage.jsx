import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronRight, ChevronDown, Eye, Mail, PhoneCall, Plus, Search, Video, X, Calendar } from 'lucide-react'
import TherapistSidebar from '../../components/TherapistSidebar'
import { useAuth } from '../../context/AuthContext.jsx'
import { displayFirstName } from '../../lib/userDisplay.js'
import { api } from '../../lib/api.js'
import ListPagination, { PAGE_SIZE } from '../../components/ListPagination.jsx'

const statusStyles = {
	Confirmed: 'bg-[#e7f1e8] text-[#1f5f4a]',
	Pending: 'bg-[#f2f6f1] text-[#3d6c4d]',
	Completed: 'bg-[#e7f1e8] text-[#1f5f4a]',
	Cancelled: 'bg-[#f6f1ec] text-[#7a5b4b]',
}

const STATUS_OPTIONS = ['PENDING', 'CONFIRMED', 'COMPLETED', 'CANCELLED']
const STATUS_LABELS = { PENDING: 'Pending', CONFIRMED: 'Confirmed', COMPLETED: 'Completed', CANCELLED: 'Cancelled' }

// ─── Appointment Detail Modal ────────────────────────────────────────────────
function AppointmentDetailModal({ appointmentId, onClose }) {
	const [detail, setDetail] = useState(null)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')

	useEffect(() => {
		if (!appointmentId) return
		let cancelled = false
		const load = async () => {
			setLoading(true)
			setError('')
			try {
				const json = await api(`/appointments/${appointmentId}`, { method: 'GET' })
				if (!cancelled && json.success) setDetail(json.data)
			} catch (e) {
				if (!cancelled) setError(e.message || 'Failed to load appointment details.')
			} finally {
				if (!cancelled) setLoading(false)
			}
		}
		void load()
		return () => { cancelled = true }
	}, [appointmentId])

	return (
		<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
			<div className="w-full max-w-lg rounded-3xl bg-white shadow-xl overflow-hidden">
				<div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
					<p className="text-[18px] font-semibold text-[#111]">Appointment Details</p>
					<button onClick={onClose} className="rounded-full border border-black/10 p-2 text-[#2f4c40] hover:bg-[#f4f6f1]">
						<X size={16} />
					</button>
				</div>
				<div className="px-6 py-5">
					{loading && <p className="text-sm text-[#556b5b]">Loading…</p>}
					{error && <p className="text-sm text-red-700">{error}</p>}
					{detail && (
						<div className="space-y-4">
							<div className="grid grid-cols-2 gap-4">
								<div>
									<p className="text-[11px] uppercase tracking-widest text-[#7d8b7d]">Appointment ID</p>
									<p className="mt-1 text-[14px] font-semibold text-[#111]">{detail.id}</p>
								</div>
								<div>
									<p className="text-[11px] uppercase tracking-widest text-[#7d8b7d]">Status</p>
									<span className={`mt-1 inline-flex rounded-full px-3 py-1 text-[12px] font-semibold ${statusStyles[detail.status] || statusStyles.Pending}`}>
										{detail.status}
									</span>
								</div>
								<div>
									<p className="text-[11px] uppercase tracking-widest text-[#7d8b7d]">Patient</p>
									<p className="mt-1 text-[14px] font-semibold text-[#111]">{detail.patient}</p>
									{detail.patientEmail && <p className="text-[12px] text-[#556b5b]">{detail.patientEmail}</p>}
									{detail.patientPhone && <p className="text-[12px] text-[#556b5b]">{detail.patientPhone}</p>}
								</div>
								<div>
									<p className="text-[11px] uppercase tracking-widest text-[#7d8b7d]">Date & Time</p>
									<p className="mt-1 text-[14px] font-semibold text-[#111]">{detail.dateTime}</p>
								</div>
								<div>
									<p className="text-[11px] uppercase tracking-widest text-[#7d8b7d]">Duration</p>
									<p className="mt-1 text-[14px] text-[#3f4f41]">{detail.duration}</p>
								</div>
								<div>
									<p className="text-[11px] uppercase tracking-widest text-[#7d8b7d]">Location</p>
									<p className="mt-1 text-[14px] text-[#3f4f41]">{detail.location}</p>
								</div>
								<div>
									<p className="text-[11px] uppercase tracking-widest text-[#7d8b7d]">Payment Method</p>
									<p className="mt-1 text-[14px] text-[#3f4f41]">{detail.paymentMethod === 'online' ? 'Online' : 'Onsite'}</p>
								</div>
								<div>
									<p className="text-[11px] uppercase tracking-widest text-[#7d8b7d]">Payment Status</p>
									<p className="mt-1 text-[14px] text-[#3f4f41]">{detail.paymentStatus}</p>
								</div>
							</div>
							{detail.meetLink && (
								<div>
									<p className="text-[11px] uppercase tracking-widest text-[#7d8b7d] mb-2">Video Session</p>
									{detail.bookedAsAnonymous && (
										<p className="mb-2 text-[12px] text-[#556b5b]">
											Anonymous session — patient name is hidden. They join with <strong>mic only</strong> (camera blocked).
											Join with <strong>your host link</strong> below and enter the room <strong>before</strong> the patient so you can moderate.
										</p>
									)}
									<a
										href={detail.meetLink}
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center gap-2 rounded-full bg-[#0f4e34] px-4 py-2 text-sm font-semibold text-white hover:bg-[#164e35]"
									>
										<Video size={14} /> {detail.bookedAsAnonymous ? 'Join as host (camera on)' : 'Join Google Meet'}
									</a>
								</div>
							)}
							{detail.paymentScreenshotUrl && (
								<div>
									<p className="text-[11px] uppercase tracking-widest text-[#7d8b7d] mb-2">Payment Screenshot</p>
									<a
										href={detail.paymentScreenshotUrl}
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f8faf8] px-4 py-2 text-sm text-[#1f5f4a] hover:bg-[#f0f4ee]"
									>
										<Eye size={14} /> View Screenshot
									</a>
								</div>
							)}
							{/* Reminder placeholder — easy to wire up later */}
							<div className="rounded-2xl border border-dashed border-black/10 bg-[#f8faf8] px-4 py-3 text-[12px] text-[#7d8b7d]">
								📅 Reminder system integration point — connect to notification service here.
							</div>
						</div>
					)}
				</div>
				<div className="flex justify-end border-t border-black/10 px-6 py-4">
					<button onClick={onClose} className="rounded-full bg-[#0f4e34] px-6 py-2 text-sm font-semibold text-white">
						Close
					</button>
				</div>
			</div>
		</div>
	)
}

// ─── Main Page ───────────────────────────────────────────────────────────────
export default function TherapistAppointmentsPage() {
	const { user } = useAuth()
	const welcomeName = displayFirstName(user)
	const [appointments, setAppointments] = useState([])
	const [total, setTotal] = useState(0)
	const [page, setPage] = useState(1)
	const [totalPages, setTotalPages] = useState(1)
	const [listLoading, setListLoading] = useState(true)
	const [search, setSearch] = useState('')
	const [savingId, setSavingId] = useState(null)
	const [error, setError] = useState('')
	const [viewId, setViewId] = useState(null) // full ObjectId for detail modal
	const [googleConnected, setGoogleConnected] = useState(false)
	const [googleLoading, setGoogleLoading] = useState(true)
	const [googleConnecting, setGoogleConnecting] = useState(false)

	const loadGoogleStatus = useCallback(async () => {
		try {
			const json = await api('/google/status', { method: 'GET' })
			if (json.success) setGoogleConnected(Boolean(json.data?.connected))
		} catch {
			setGoogleConnected(false)
		} finally {
			setGoogleLoading(false)
		}
	}, [])

	const connectGoogleCalendar = async () => {
		setGoogleConnecting(true)
		setError('')
		try {
			const json = await api('/google/auth-url', { method: 'GET' })
			if (!json.success || !json.data?.url) throw new Error('Could not start Google sign-in')
			window.open(json.data.url, 'benzi-google-oauth', 'width=520,height=640')
		} catch (e) {
			setError(e.message || 'Google connect failed')
		} finally {
			setGoogleConnecting(false)
		}
	}

	const load = useCallback(async () => {
		setListLoading(true)
		try {
			const json = await api(`/appointments/therapist/me?page=${page}&limit=${PAGE_SIZE}`, {
				method: 'GET',
				silent: true,
			})
			if (json.success && json.data) {
				setAppointments(json.data.appointments || [])
				setTotal(json.data.total ?? 0)
				setTotalPages(json.data.totalPages ?? 1)
			}
		} catch {
			setAppointments([])
			setTotal(0)
			setTotalPages(1)
		} finally {
			setListLoading(false)
		}
	}, [page])

	useEffect(() => {
		void loadGoogleStatus()
		void load()
	}, [load, loadGoogleStatus])

	useEffect(() => {
		const onMessage = (event) => {
			if (event.data?.type === 'BENZI_GOOGLE_CONNECTED') {
				void loadGoogleStatus()
				void api('/google/backfill', { method: 'POST' }).then(() => load())
			}
		}
		window.addEventListener('message', onMessage)
		return () => window.removeEventListener('message', onMessage)
	}, [load, loadGoogleStatus])

	const updateStatus = async (displayId, newStatus) => {
		setSavingId(displayId)
		setError('')
		try {
			const json = await api(`/appointments/${displayId}`, {
				method: 'PATCH',
				body: JSON.stringify({ status: newStatus }),
			})
			if (!json.success) throw new Error(json.message || 'Update failed')
			await load()
		} catch (e) {
			setError(e.message || 'Could not update status.')
		} finally {
			setSavingId(null)
		}
	}

	const filtered = search.trim()
		? appointments.filter(
				(a) =>
					a.patient?.toLowerCase().includes(search.toLowerCase()) ||
					a.id?.toLowerCase().includes(search.toLowerCase())
		  )
		: appointments

	return (
		<>
			<div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
			<section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
				<div className="flex flex-wrap items-center justify-between gap-4 mb-8">
					<div>
						<p className="text-sm uppercase tracking-[0.25em] text-brand/70">Appointment</p>
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

				<div className="grid gap-6 xl:grid-cols-[1.4fr_280px] max-[1280px]:grid-cols-1">
					<div className="space-y-6">
						<div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
							<div className="flex flex-wrap items-center justify-between gap-4">
								<div>
									<p className="text-[22px] font-semibold text-[#111]">Appointments</p>
									<div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#556b5b]">
										<span>All Appointments</span>
										<span className="rounded-full bg-[#e8f3ea] px-3 py-1 text-[#1f5f4a] font-semibold">{total}</span>
									</div>
								</div>
								<Link
									to="/therapist-availability"
									className="inline-flex items-center gap-2 rounded-full bg-[#0f4e34] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#164e35]"
								>
									<Plus size={16} />
									Manage Availability
								</Link>
							</div>

							{error && <p className="mt-3 text-sm text-red-700">{error}</p>}

							{!googleLoading && !googleConnected && (
								<div className="mt-4 rounded-2xl border border-amber-200 bg-amber-50 px-4 py-4 text-sm text-amber-950">
									<p className="font-semibold">Connect Google Calendar to enable video links</p>
									<p className="mt-1 text-[13px]">
										Online appointments need your Google account connected once. After that, Meet links appear in emails and the Video column.
									</p>
									<button
										type="button"
										onClick={() => void connectGoogleCalendar()}
										disabled={googleConnecting}
										className="mt-3 inline-flex items-center gap-2 rounded-full bg-[#0f4e34] px-4 py-2 text-[13px] font-semibold text-white hover:bg-[#164e35] disabled:opacity-60"
									>
										<Calendar size={16} />
										{googleConnecting ? 'Opening Google…' : 'Connect Google Calendar'}
									</button>
								</div>
							)}
							{!googleLoading && googleConnected && (
								<p className="mt-3 text-[13px] font-medium text-[#1f5f4a]">
									✓ Google Calendar connected — Meet links are created for online sessions.
								</p>
							)}

							<div className="mt-6">
								<div className="relative max-w-sm">
									<Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7b8b7d]" />
									<input
										type="text"
										placeholder="Search by patient or ID…"
										value={search}
										onChange={(e) => setSearch(e.target.value)}
										className="w-full rounded-full border border-black/10 bg-[#f8faf8] py-3 pl-12 pr-4 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
									/>
								</div>
							</div>

							<div className="mt-6 overflow-x-auto">
								<table className="min-w-full border border-black/10">
									<thead>
										<tr className="text-left text-[12px] uppercase tracking-[0.2em] text-[#7d8b7d] bg-[#f7f4ef]">
											<th className="px-3 py-3 border border-black/10">Appointment ID</th>
											<th className="px-3 py-3 border border-black/10">Patient</th>
											<th className="px-3 py-3 border border-black/10">Date & Time</th>
											<th className="px-3 py-3 border border-black/10">Duration</th>
											<th className="px-3 py-3 border border-black/10">Location</th>
											<th className="px-3 py-3 border border-black/10">Status</th>
											<th className="px-3 py-3 border border-black/10">Video</th>
											<th className="px-3 py-3 border border-black/10">Action</th>
										</tr>
									</thead>
									<tbody>
										{listLoading && (
											<tr>
												<td colSpan={8} className="px-3 py-6 text-center text-sm text-[#7d8b7d]">
													Loading appointments…
												</td>
											</tr>
										)}
										{!listLoading && filtered.length === 0 && (
											<tr>
												<td colSpan={8} className="px-3 py-6 text-center text-sm text-[#7d8b7d]">
													{search ? 'No appointments on this page match your search.' : 'No appointments yet.'}
												</td>
											</tr>
										)}
										{!listLoading && filtered.map((item) => (
											<tr key={item.id} className="text-sm text-[#3f4f41]">
												<td className="px-3 py-4 border border-black/10 font-semibold text-[#111]">{item.id}</td>
												<td className="px-3 py-4 border border-black/10">{item.patient}</td>
												<td className="px-3 py-4 border border-black/10">{item.dateTime}</td>
												<td className="px-3 py-4 border border-black/10">{item.duration}</td>
												<td className="px-3 py-4 border border-black/10">{item.location}</td>
												<td className="px-3 py-4 border border-black/10">
													{/* Inline status dropdown */}
													<div className="relative inline-block">
														<select
															value={STATUS_OPTIONS.find(
																(s) => STATUS_LABELS[s] === item.status
															) || 'PENDING'}
															disabled={savingId === item.id}
															onChange={(e) => void updateStatus(item.id, e.target.value)}
															className={`appearance-none cursor-pointer pr-8 rounded-full pl-3 py-1.5 text-[12px] font-semibold outline-none border ${statusStyles[item.status] || statusStyles.Pending} ${savingId === item.id ? 'opacity-50 cursor-not-allowed' : ''}`}
														>
															{STATUS_OPTIONS.map((s) => (
																<option key={s} value={s}>{STATUS_LABELS[s]}</option>
															))}
														</select>
														<ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 opacity-60" />
													</div>
												</td>
												<td className="px-3 py-4 border border-black/10">
													{item.meetLink ? (
														<a
															href={item.meetLink}
															target="_blank"
															rel="noreferrer"
															className="inline-flex items-center gap-1 rounded-full bg-[#0f4e34] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#164e35]"
														>
															<Video size={12} /> Join
														</a>
													) : (
														<span className="text-[11px] text-[#7d8b7d]">—</span>
													)}
												</td>
												<td className="px-3 py-4 border border-black/10">
													<div className="flex items-center gap-2">
														<button
															type="button"
															onClick={() => setViewId(item.id)}
															aria-label="View appointment details"
															className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white border border-black/10 text-[#1f5f4a] shadow-sm transition hover:bg-[#f0f4ee]"
														>
															<Eye size={14} />
														</button>
														<a
															href={item.action === 'mail' ? 'mailto:contact@benzi.com' : 'tel:+92123456789'}
															aria-label={item.action === 'mail' ? 'Email patient' : 'Call patient'}
															className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white border border-black/10 text-[#1f5f4a] shadow-sm transition hover:bg-[#f0f4ee]"
														>
															{item.action === 'mail' ? <Mail size={14} /> : <PhoneCall size={14} />}
														</a>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							<ListPagination
								currentPage={page}
								totalPages={totalPages}
								totalItems={total}
								onPageChange={setPage}
							/>
						</div>
					</div>

					<TherapistSidebar activeItem="Appointment" />
				</div>
			</section>

			{viewId && (
				<AppointmentDetailModal
					appointmentId={viewId}
					onClose={() => setViewId(null)}
				/>
			)}
		</>
	)
}
