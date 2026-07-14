import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronRight, Eye, Search, ChevronDown } from 'lucide-react'
import TherapistSidebar from '../../components/TherapistSidebar'
import { useAuth } from '../../context/AuthContext.jsx'
import { displayFirstName } from '../../lib/userDisplay.js'
import { api } from '../../lib/api.js'

const paymentStyles = {
	PENDING: 'bg-[#f2f6f1] text-[#3d6c4d]',
	VERIFIED: 'bg-[#e7f1e8] text-[#1f5f4a]',
	REJECTED: 'bg-[#f6f1ec] text-[#7a5b4b]',
}

const appointmentStyles = {
	Pending: 'bg-[#f2f6f1] text-[#3d6c4d]',
	Confirmed: 'bg-[#e7f1e8] text-[#1f5f4a]',
	Completed: 'bg-[#e7f1e8] text-[#1f5f4a]',
	Cancelled: 'bg-[#f6f1ec] text-[#7a5b4b]',
}

export default function TherapistPaymentPage() {
	const { user } = useAuth()
	const welcomeName = displayFirstName(user)
	const [rows, setRows] = useState([])
	const [total, setTotal] = useState(0)
	const [loading, setLoading] = useState(true)
	const [error, setError] = useState('')
	const [savingId, setSavingId] = useState(null)

	const load = async () => {
		setLoading(true)
		setError('')
		try {
			const json = await api('/appointments/therapist/me', { method: 'GET' })
			if (json.success && json.data) {
				setRows(json.data.appointments || [])
				setTotal(typeof json.data.total === 'number' ? json.data.total : (json.data.appointments || []).length)
			}
		} catch (e) {
			setError(e.message || 'Could not load payments.')
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		void load()
	}, [])

	const updatePaymentStatus = async (id, paymentStatus) => {
		setSavingId(id)
		setError('')
		try {
			const json = await api(`/appointments/${id}`, {
				method: 'PATCH',
				body: JSON.stringify({ paymentStatus }),
			})
			if (!json.success) throw new Error(json.message || 'Update failed')
			await load()
		} catch (e) {
			setError(e.message || 'Could not update payment status.')
		} finally {
			setSavingId(null)
		}
	}
	return (
		<>
			<div className="pt-4" />
			<section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
				<div className="flex flex-wrap items-center justify-between gap-4 mb-8">
					<div>
						<p className="text-sm uppercase tracking-[0.25em] text-brand/70">Payment</p>
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

				<div className="portal-layout">
					<div className="space-y-6">
						<div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
							<div className="flex flex-wrap items-center justify-between gap-4">
								<div>
									<p className="text-[22px] font-semibold text-[#111]">Payments</p>
									<div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#556b5b]">
										<span>All payment records</span>
										<span className="rounded-full bg-[#e8f3ea] px-3 py-1 text-[#1f5f4a] font-semibold">{total}</span>
									</div>
								</div>
							</div>

							<div className="mt-4">
								<div className="relative max-w-sm">
									<Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7b8b7d]" />
									<input
										type="text"
										placeholder="Keyword Search..."
										className="w-full rounded-full border border-black/10 bg-[#f8faf8] py-3 pl-12 pr-4 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
									/>
								</div>
							</div>

							<div className="mt-6 overflow-x-auto">
								<table className="min-w-full border border-black/10 border-collapse">
									<thead>
										<tr className="text-left text-[12px] uppercase tracking-[0.2em] text-[#7d8b7d] bg-[#f7f4ef]">
											<th className="px-3 py-3 border border-black/10">Appointment ID</th>
											<th className="px-3 py-3 border border-black/10">Patient</th>
											<th className="px-3 py-3 border border-black/10">Service</th>
											<th className="px-3 py-3 border border-black/10">Price</th>
											<th className="px-3 py-3 border border-black/10">Date</th>
											<th className="px-3 py-3 border border-black/10">Payment Method</th>
											<th className="px-3 py-3 border border-black/10">Screenshot</th>
											<th className="px-3 py-3 border border-black/10">Payment Status</th>
											<th className="px-3 py-3 border border-black/10">Appointment Status</th>
										</tr>
									</thead>
									<tbody>
										{rows.map((item) => (
											<tr key={item.id} className="text-sm text-[#3f4f41]">
												<td className="px-3 py-4 border border-black/10 font-semibold text-[#111]">{item.id}</td>
												<td className="px-3 py-4 border border-black/10">{item.patient}</td>
												<td className="px-3 py-4 border border-black/10">{item.serviceName || 'N/A'}</td>
												<td className="px-3 py-4 border border-black/10 font-semibold text-[#1f5f4a]">{item.servicePrice || 'N/A'}</td>
												<td className="px-3 py-4 border border-black/10">{item.dateTime}</td>
												<td className="px-3 py-4 border border-black/10">{item.paymentMethod === 'online' ? 'Online' : 'Onsite'}</td>
												<td className="px-3 py-4 border border-black/10">
													{item.paymentMethod === 'online' && item.paymentScreenshotUrl ? (
														<a
															href={item.paymentScreenshotUrl}
															target="_blank"
															rel="noreferrer"
															aria-label="View payment screenshot"
															className="inline-flex h-9 w-9 items-center justify-center rounded-full bg-white border border-black/10 text-[#1f5f4a] shadow-sm transition hover:bg-[#f0f4ee]"
														>
															<Eye size={15} />
														</a>
													) : (
														<span className="text-[#7d8b7d]">—</span>
													)}
												</td>
												<td className="px-3 py-4 border border-black/10">
													<div className="relative inline-block">
														<select
															value={item.paymentStatus || 'PENDING'}
															disabled={savingId === item.id}
															onChange={(e) => void updatePaymentStatus(item.id, e.target.value)}
															className={`appearance-none cursor-pointer pr-8 rounded-full pl-3 py-1.5 text-[12px] font-semibold outline-none border ${paymentStyles[item.paymentStatus] || paymentStyles.PENDING} ${savingId === item.id ? 'opacity-50 cursor-not-allowed' : ''}`}
														>
															<option value="PENDING">Pending</option>
															<option value="VERIFIED">Verified</option>
															<option value="REJECTED">Rejected</option>
														</select>
														<ChevronDown size={14} className="pointer-events-none absolute right-2.5 top-1/2 -translate-y-1/2 opacity-60" />
													</div>
												</td>
												<td className="px-3 py-4 border border-black/10">
													<span className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-[12px] font-semibold ${appointmentStyles[item.status] || appointmentStyles.Pending}`}>
														{item.status}
													</span>
												</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
						</div>
					</div>

					<TherapistSidebar activeItem="Payment" />
				</div>
			</section>
		</>
	)
}
