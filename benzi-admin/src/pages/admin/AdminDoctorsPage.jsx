import { useState, useEffect } from 'react'
import { MoreVertical, Plus, Search } from 'lucide-react'
import { Link } from 'react-router-dom'
import AdminSidebar from '../../components/AdminSidebar'
import { api } from '../../lib/api.js'

const statusStyles = {
	Active: 'bg-[#e7f4ee] text-[#1f5f4a]',
	Pending: 'bg-[#fff4df] text-[#b45309]',
	Inactive: 'bg-[#fde8e5] text-[#b42318]',
	Suspended: 'bg-[#fde8e5] text-[#b42318]'
}

export default function AdminDoctorsPage() {
	const [doctorsList, setDoctorsList] = useState([])
	const [loading, setLoading] = useState(true)
	const [searchQuery, setSearchQuery] = useState('')
	const [openMenuId, setOpenMenuId] = useState(null)

	useEffect(() => {
		async function fetchDoctors() {
			try {
				const json = await api('/admin/doctors', { method: 'GET' })
				if (json.success) {
					setDoctorsList(json.data)
				}
			} catch (e) {
				console.error('Failed to fetch doctors list:', e)
			} finally {
				setLoading(false)
			}
		}
		fetchDoctors()
	}, [])

	const toggleMenu = (doctorId) => {
		setOpenMenuId((currentId) => (currentId === doctorId ? null : doctorId))
	}

	const filteredDoctors = doctorsList.filter(doc => 
		doc.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
		doc.specialization.toLowerCase().includes(searchQuery.toLowerCase())
	)

	return (
		<>
			<div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
			<section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
				<div className="grid gap-6 xl:grid-cols-[1fr_260px] max-[1280px]:grid-cols-1">
					<div className="space-y-6">
						<div className="flex items-center justify-between">
							<div>
								<p className="text-[18px] font-semibold text-[#0f3a2b]">Doctors</p>
								<p className="text-[12px] text-[#7d8b7d]">Manage registered doctors</p>
							</div>
							<Link to="/admin-send-credentials" className="inline-flex items-center gap-2 rounded-full bg-brand px-4 py-2 text-[12px] font-semibold text-white hover:bg-brand-dark transition-all">
								<Plus size={14} />
								Add Doctor
							</Link>
						</div>

						<div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
							<div className="relative max-w-sm">
								<Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d8b7d]" />
								<input
									type="text"
									placeholder="Keyword Search..."
									value={searchQuery}
									onChange={(e) => setSearchQuery(e.target.value)}
									className="w-full rounded-full border border-black/10 bg-[#f8faf8] py-2.5 pl-10 pr-4 text-sm text-[#2e3f34] outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
								/>
							</div>

							<div className="mt-4 overflow-x-auto">
								{loading ? (
									<div className="flex items-center justify-center py-12 text-sm text-[#7d8b7d] animate-pulse">
										Loading Doctors List...
									</div>
								) : (
									<table className="min-w-full border border-black/10">
										<thead>
											<tr className="text-left text-[11px] uppercase tracking-[0.2em] text-[#7d8b7d] bg-[#f7f4ef]">
												<th className="px-3 py-3 border border-black/10">Doctor ID</th>
												<th className="px-3 py-3 border border-black/10">Name</th>
												<th className="px-3 py-3 border border-black/10">Specialization</th>
												<th className="px-3 py-3 border border-black/10 text-center">Patients</th>
												<th className="px-3 py-3 border border-black/10 text-center">Subscription</th>
												<th className="px-3 py-3 border border-black/10 text-center">Status</th>
											</tr>
										</thead>
										<tbody>
											{filteredDoctors.length > 0 ? (
												filteredDoctors.map((doctor) => (
													<tr key={doctor.id} className="text-sm text-[#3f4f41] hover:bg-[#fafbfa] transition-all">
														<td className="px-3 py-3 border border-black/10 font-semibold text-[#111]">{doctor.id}</td>
														<td className="px-3 py-3 border border-black/10 font-bold text-brand">{doctor.name}</td>
														<td className="px-3 py-3 border border-black/10">{doctor.specialization}</td>
														<td className="px-3 py-3 border border-black/10 text-center font-semibold">{doctor.patients}</td>
														<td className="px-3 py-3 border border-black/10 text-center text-[#7d8b7d] italic font-semibold">
															{doctor.subscription || 'None'}
														</td>
														<td className="px-3 py-3 border border-black/10 text-center">
															<span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyles[doctor.status] || 'bg-brand/10 text-brand'}`}>
																{doctor.status}
															</span>
														</td>
													</tr>
												))
											) : (
												<tr>
													<td colSpan="6" className="py-8 text-center text-[#7d8b7d]">
														No registered therapists found.
													</td>
												</tr>
											)}
										</tbody>
									</table>
								)}
							</div>

							<div className="mt-4 flex items-center justify-center gap-2 text-sm text-[#556b5b]">
								<button className="rounded-full border border-black/10 bg-white px-3 py-2 hover:bg-black/5">&lt;</button>
								<button className="rounded-full bg-brand px-3 py-2 text-white">1</button>
								<button className="rounded-full border border-black/10 bg-white px-3 py-2 hover:bg-black/5">&gt;</button>
							</div>
						</div>
					</div>

					<AdminSidebar activeItem="Doctors" />
				</div>
			</section>
		</>
	)
}
