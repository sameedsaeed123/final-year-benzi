import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { BarChart3, Bell, ChevronRight, EyeOff, Mail, MessageCircle, PhoneCall, Search, User } from 'lucide-react'
import TherapistSidebar from '../../components/TherapistSidebar'
import TherapistPatientPanel from '../../components/TherapistPatientPanel.jsx'
import { useAuth } from '../../context/AuthContext.jsx'
import { displayFirstName } from '../../lib/userDisplay.js'
import { api } from '../../lib/api.js'

const statusStyles = {
	Active: 'bg-[#e7f1e8] text-[#1f5f4a]',
	Completed: 'bg-[#e8f0fb] text-[#2d5fa6]',
	Cancelled: 'bg-[#f6f1ec] text-[#7a5b4b]',
	Unknown: 'bg-[#f2f6f1] text-[#3d6c4d]',
}

export default function TherapistClientsPage() {
	const { user } = useAuth()
	const navigate = useNavigate()
	const [searchParams, setSearchParams] = useSearchParams()
	const welcomeName = displayFirstName(user)
	const [clients, setClients] = useState([])
	const [total, setTotal] = useState(0)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [search, setSearch] = useState('')
	const [showInviteModal, setShowInviteModal] = useState(false)
	const [inviteFirst, setInviteFirst] = useState('')
	const [inviteLast, setInviteLast] = useState('')
	const [inviteEmail, setInviteEmail] = useState('')
	const [invitePhone, setInvitePhone] = useState('')
	const [inviteLoading, setInviteLoading] = useState(false)
	const [inviteError, setInviteError] = useState('')
	const [inviteSuccess, setInviteSuccess] = useState('')
	const [aiByPatient, setAiByPatient] = useState({})
	const [panelClient, setPanelClient] = useState(null)

	const load = useCallback(async () => {
		setLoading(true)
		setError('')
		try {
			const json = await api('/therapists/clients/me', { method: 'GET' })
			if (json.success && json.data) {
				setClients(json.data.clients || [])
				setTotal(typeof json.data.total === 'number' ? json.data.total : (json.data.clients || []).length)
			}
		} catch (e) {
			setError(e.message || 'Could not load clients.')
		} finally {
			setLoading(false)
		}
	}, [])

	useEffect(() => {
		void load()
	}, [load])

	useEffect(() => {
		if (!clients.length) return
		let cancelled = false
		Promise.all(
			clients.slice(0, 20).map(async (c) => {
				try {
					const json = await api(`/ai/overview/patient/${c.id}`, { method: 'GET' })
					return [c.id, json.data]
				} catch {
					return [c.id, null]
				}
			})
		).then((pairs) => {
			if (!cancelled) setAiByPatient(Object.fromEntries(pairs))
		})
		return () => { cancelled = true }
	}, [clients])

	const openPanel = (client) => {
		setPanelClient(client)
		setSearchParams({ patient: client.id }, { replace: true })
	}

	const closePanel = () => {
		setPanelClient(null)
		setSearchParams({}, { replace: true })
	}

	const refreshPatientAi = useCallback((patientId) => {
		api(`/ai/overview/patient/${patientId}`, { method: 'GET', silent: true })
			.then((json) => {
				if (json.data) {
					setAiByPatient((prev) => ({ ...prev, [patientId]: json.data }))
				}
			})
			.catch(() => {})
	}, [])

	useEffect(() => {
		const pid = searchParams.get('patient')
		if (!pid || !clients.length) return
		const match = clients.find((c) => String(c.id) === pid)
		if (match) setPanelClient(match)
	}, [searchParams, clients])

	const handleInviteSubmit = async (e) => {
		e.preventDefault()
		if (!inviteFirst.trim() || !inviteLast.trim() || !inviteEmail.trim() || !invitePhone.trim()) {
			setInviteError('All fields are required.')
			return
		}
		setInviteLoading(true)
		setInviteError('')
		setInviteSuccess('')
		try {
			const res = await api('/therapists/clients/invite', {
				method: 'POST',
				body: JSON.stringify({
					firstName: inviteFirst.trim(),
					lastName: inviteLast.trim(),
					email: inviteEmail.trim(),
					phone: invitePhone.trim(),
				})
			})
			if (res.success) {
				setInviteSuccess('Patient invited successfully! Invitation email has been sent.')
				setInviteFirst('')
				setInviteLast('')
				setInviteEmail('')
				setInvitePhone('')
				void load()
				setTimeout(() => {
					setShowInviteModal(false)
					setInviteSuccess('')
				}, 2000)
			} else {
				setInviteError(res.message || 'Invitation failed.')
			}
		} catch (err) {
			setInviteError(err.message || 'Failed to send invitation.')
		} finally {
			setInviteLoading(false)
		}
	}

	const filtered = search.trim()
		? clients.filter(
				(c) =>
					c.name?.toLowerCase().includes(search.toLowerCase()) ||
					c.email?.toLowerCase().includes(search.toLowerCase())
		  )
		: clients

	return (
		<>
			<div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
			<section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
				<div className="flex flex-wrap items-center justify-between gap-4 mb-8">
					<div>
						<p className="text-sm uppercase tracking-[0.25em] text-brand/70">Clients</p>
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
									<p className="text-[22px] font-semibold text-[#111]">Clients</p>
									<div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#556b5b]">
										<span>All Clients</span>
										<span className="rounded-full bg-[#e8f3ea] px-3 py-1 text-[#1f5f4a] font-semibold">{total}</span>
									</div>
								</div>
								<button
									onClick={() => setShowInviteModal(true)}
									className="bg-brand text-white px-5 py-2.5 rounded-full text-sm font-semibold hover:bg-brand-dark transition-all shadow-sm flex items-center gap-2"
								>
									<span>+ Invite Patient</span>
								</button>
							</div>

							{error && <p className="mt-3 text-sm text-red-700">{error}</p>}

							<div className="mt-6">
								<div className="relative max-w-sm">
									<Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7b8b7d]" />
									<input
										type="text"
										placeholder="Search by name or email…"
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
											<th className="px-3 py-3 border border-black/10">Patient</th>
											<th className="px-3 py-3 border border-black/10">Email</th>
											<th className="px-3 py-3 border border-black/10">Last Session</th>
											<th className="px-3 py-3 border border-black/10">Total Sessions</th>
											<th className="px-3 py-3 border border-black/10">Wellness</th>
											<th className="px-3 py-3 border border-black/10">AI mood</th>
											<th className="px-3 py-3 border border-black/10">Status</th>
											<th className="px-3 py-3 border border-black/10">Action</th>
										</tr>
									</thead>
									<tbody>
										{loading && (
											<tr>
												<td colSpan={8} className="px-3 py-6 text-center text-sm text-[#7d8b7d]">
													Loading clients…
												</td>
											</tr>
										)}
										{!loading && filtered.length === 0 && (
											<tr>
												<td colSpan={8} className="px-3 py-6 text-center text-sm text-[#7d8b7d]">
													{search ? 'No clients match your search.' : 'No clients yet. Clients appear here once a patient books an appointment with you.'}
												</td>
											</tr>
										)}
										{!loading && filtered.map((item) => (
											<tr key={item.id} className="text-sm text-[#3f4f41]">
												<td className="px-3 py-4 border border-black/10">
													<div className="flex items-center gap-3">
														{item.isAnonymous ? (
															<span className="h-8 w-8 rounded-full bg-[#f0f7f3] border border-[#0f4e34]/20 flex items-center justify-center flex-shrink-0">
																<EyeOff size={13} className="text-[#0f4e34]" />
															</span>
														) : item.image ? (
															<img src={item.image} alt={item.name}
																className="h-8 w-8 rounded-full object-cover border border-black/5 flex-shrink-0" />
														) : (
															<span className="h-8 w-8 rounded-full bg-[#e8f3ea] flex items-center justify-center flex-shrink-0">
																<User size={14} className="text-[#1f5f4a]" />
															</span>
														)}
														<div>
															<button
																type="button"
																onClick={() => openPanel(item)}
																className="font-semibold text-[#111] text-left hover:text-brand transition"
															>
																{item.name}
															</button>
															{item.isAnonymous && (
																<span className="ml-2 inline-flex items-center gap-1 rounded-full bg-[#f0f7f3] border border-[#0f4e34]/15 px-2 py-0.5 text-[10px] font-semibold text-[#0f4e34]">
																	<EyeOff size={9} /> Anonymous
																</span>
															)}
														</div>
													</div>
												</td>
												<td className="px-3 py-4 border border-black/10 text-[#556b5b]">
													{item.isAnonymous ? <span className="text-[#7d8b7d] italic text-[12px]">Hidden</span> : (item.email || '—')}
												</td>
												<td className="px-3 py-4 border border-black/10">{item.lastSessionDate}</td>
												<td className="px-3 py-4 border border-black/10 text-center font-semibold text-[#0f3a2b]">
													{item.totalSessions}
												</td>
												<td className="px-3 py-4 border border-black/10 text-center font-semibold text-[#0f3a2b]">
													{aiByPatient[item.id]?.taskScore != null ? `${aiByPatient[item.id].taskScore}%` : '—'}
												</td>
												<td className="px-3 py-4 border border-black/10 capitalize text-[#556b5b]">
													{aiByPatient[item.id]?.dominantMood || '—'}
												</td>
												<td className="px-3 py-4 border border-black/10">
													<span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${statusStyles[item.status] || statusStyles.Unknown}`}>
														<span className="h-1.5 w-1.5 rounded-full bg-current" />
														{item.status}
													</span>
												</td>
												<td className="px-3 py-4 border border-black/10">
													<div className="flex items-center gap-2">
														{!item.isAnonymous && item.email && (
															<a href={`mailto:${item.email}`} aria-label="Email patient"
																className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white border border-black/10 text-[#1f5f4a] shadow-sm transition hover:bg-[#f0f4ee]">
																<Mail size={14} />
															</a>
														)}
														{!item.isAnonymous && item.phone && (
															<a href={`tel:${item.phone}`} aria-label="Call patient"
																className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white border border-black/10 text-[#1f5f4a] shadow-sm transition hover:bg-[#f0f4ee]">
																<PhoneCall size={14} />
															</a>
														)}
														<button
															type="button"
															onClick={() => navigate(`/therapist-chat?patientId=${item.id}`)}
															aria-label="Chat with patient"
															className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-[#0f4e34] text-white shadow-sm transition hover:bg-[#0d4530]">
															<MessageCircle size={14} />
														</button>
														<button
															type="button"
															onClick={() => openPanel(item)}
															aria-label="Stats and goals"
															className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-brand text-white shadow-sm transition hover:bg-[#1b513a]"
															title="Stats & goals"
														>
															<BarChart3 size={14} />
														</button>
													</div>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>

							<div className="mt-4 flex flex-wrap items-center justify-between gap-2 text-sm text-[#7d8b7d]">
								<span>
									{!loading && `Showing ${filtered.length} of ${total} client${total !== 1 ? 's' : ''}`}
								</span>
								<span className="text-[12px]">Use the chart icon to open stats, goals & review.</span>
							</div>
						</div>
					</div>

					<TherapistSidebar activeItem="Clients" />
				</div>
			</section>

			{panelClient && (
				<TherapistPatientPanel
					client={panelClient}
					onClose={closePanel}
					onUpdated={() => refreshPatientAi(panelClient.id)}
				/>
			)}

			{showInviteModal && (
				<div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
					<div className="bg-white rounded-[30px] w-full max-w-md p-8 border border-black/5 shadow-2xl relative">
						<button
							onClick={() => {
								setShowInviteModal(false)
								setInviteError('')
								setInviteSuccess('')
							}}
							className="absolute top-6 right-6 text-gray-400 hover:text-gray-700 text-[20px] font-semibold"
						>
							✕
						</button>
						<h3 className="text-[24px] font-bold text-[#0f3a2b] mb-2">Invite New Patient</h3>
						<p className="text-sm text-gray-500 mb-6">Enter patient details to create their account and send initial login credentials email.</p>
						
						{inviteError && (
							<div className="bg-red-50 text-red-700 p-3 rounded-2xl text-xs font-semibold mb-4 text-center">
								{inviteError}
							</div>
						)}
						{inviteSuccess && (
							<div className="bg-green-50 text-green-700 p-3 rounded-2xl text-xs font-semibold mb-4 text-center">
								{inviteSuccess}
							</div>
						)}

						<form onSubmit={handleInviteSubmit} className="space-y-4">
							<div>
								<label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">First Name</label>
								<input
									type="text"
									placeholder="First Name"
									value={inviteFirst}
									onChange={(e) => setInviteFirst(e.target.value)}
									className="w-full rounded-2xl border border-black/10 bg-[#f8faf8] px-4 py-3.5 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
									required
								/>
							</div>
							<div>
								<label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Last Name</label>
								<input
									type="text"
									placeholder="Last Name"
									value={inviteLast}
									onChange={(e) => setInviteLast(e.target.value)}
									className="w-full rounded-2xl border border-black/10 bg-[#f8faf8] px-4 py-3.5 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
									required
								/>
							</div>
							<div>
								<label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Email Address</label>
								<input
									type="email"
									placeholder="patient@mail.com"
									value={inviteEmail}
									onChange={(e) => setInviteEmail(e.target.value)}
									className="w-full rounded-2xl border border-black/10 bg-[#f8faf8] px-4 py-3.5 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
									required
								/>
							</div>
							<div>
								<label className="block text-xs font-bold text-gray-700 mb-1.5 uppercase tracking-wide">Phone Number</label>
								<input
									type="tel"
									placeholder="+1234567890"
									value={invitePhone}
									onChange={(e) => setInvitePhone(e.target.value)}
									className="w-full rounded-2xl border border-black/10 bg-[#f8faf8] px-4 py-3.5 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
									required
								/>
							</div>

							<button
								type="submit"
								disabled={inviteLoading}
								className="w-full bg-brand text-white py-4 rounded-2xl text-[15px] font-semibold transition-all hover:bg-brand-dark disabled:opacity-75 flex items-center justify-center gap-2 mt-6 shadow-md"
							>
								{inviteLoading ? 'Sending Invitation...' : 'Send Invitation & Credentials'}
							</button>
						</form>
					</div>
				</div>
			)}
		</>
	)
}
