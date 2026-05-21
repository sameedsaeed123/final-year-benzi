import AdminSidebar from '../../components/AdminSidebar'

const patientRows = [
	{ id: 1, doctor: 'Dr. Rahima', specialization: 'Psychologist', total: 32, active: 28, inactive: 4, lastSession: '2026-05-02' },
	{ id: 2, doctor: 'Dr. Shayan', specialization: 'Therapist', total: 18, active: 12, inactive: 6, lastSession: '2026-05-01' },
	{ id: 3, doctor: 'Dr. Sabaa', specialization: 'Counselor', total: 45, active: 40, inactive: 5, lastSession: '2026-05-03' },
	{ id: 4, doctor: 'Dr. Alina', specialization: 'Psychiatrist', total: 9, active: 5, inactive: 4, lastSession: '2026-04-29' },
]

const barData = [8, 12, 6, 14, 18, 10, 5]

export default function AdminPatientsPage() {
	return (
		<>
			<div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
			<section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
				<div className="grid gap-6 xl:grid-cols-[1fr_260px] max-[1280px]:grid-cols-1">
					<div className="space-y-6">
						<div>
							<h1 className="text-[18px] font-semibold text-[#0f3a2b]">Patients</h1>
							<p className="text-[12px] text-[#7d8b7d]">Patient count per doctor</p>
						</div>

						<div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
							<div className="overflow-x-auto">
								<table className="min-w-full border border-black/10">
									<thead>
										<tr className="text-left text-[11px] uppercase tracking-[0.2em] text-[#7d8b7d] bg-[#f7f4ef]">
											<th className="px-3 py-3 border border-black/10">#</th>
											<th className="px-3 py-3 border border-black/10">Doctor Name</th>
											<th className="px-3 py-3 border border-black/10">Specialization</th>
											<th className="px-3 py-3 border border-black/10">Total Patients</th>
											<th className="px-3 py-3 border border-black/10">Active</th>
											<th className="px-3 py-3 border border-black/10">Inactive</th>
											<th className="px-3 py-3 border border-black/10">Last Session</th>
											<th className="px-3 py-3 border border-black/10">Action</th>
										</tr>
									</thead>
									<tbody>
										{patientRows.map((row) => (
											<tr key={row.id} className="text-sm text-[#3f4f41]">
												<td className="px-3 py-3 border border-black/10 font-semibold text-[#111]">{row.id}</td>
												<td className="px-3 py-3 border border-black/10">{row.doctor}</td>
												<td className="px-3 py-3 border border-black/10">{row.specialization}</td>
												<td className="px-3 py-3 border border-black/10">{row.total}</td>
												<td className="px-3 py-3 border border-black/10 text-brand font-semibold">{row.active}</td>
												<td className="px-3 py-3 border border-black/10 text-red-500 font-semibold">{row.inactive}</td>
												<td className="px-3 py-3 border border-black/10">{row.lastSession}</td>
												<td className="px-3 py-3 border border-black/10 text-brand">View</td>
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

						<div className="grid gap-6 lg:grid-cols-2">
							<div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
								<p className="text-[13px] font-semibold text-[#111]">Patient Distribution</p>
								<div className="mt-6 flex items-center justify-center">
									<div
										className="h-28 w-28 rounded-full"
										style={{ background: 'conic-gradient(#1f5f4a 40%, #5a9378 40% 65%, #a9cbb7 65% 100%)' }}
									/>
								</div>
								<div className="mt-6 flex items-center gap-4 text-[11px] text-[#6b7b6a]">
									<span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-brand" />Mental Health (40%)</span>
									<span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#5a9378]" />Self Care (35%)</span>
									<span className="flex items-center gap-2"><span className="h-2 w-2 rounded-full bg-[#a9cbb7]" />Therapy (25%)</span>
								</div>
							</div>

							<div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
								<p className="text-[13px] font-semibold text-[#111]">New Patients This Month</p>
								<div className="mt-6 flex items-end gap-3 h-28">
									{barData.map((value, index) => (
										<div key={index} className="flex-1 flex flex-col items-center gap-2">
											<div className="w-5 rounded-full bg-brand" style={{ height: `${value * 5}px` }} />
											<span className="text-[10px] text-[#6b7b6a]">{['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun'][index]}</span>
										</div>
									))}
								</div>
							</div>
						</div>
					</div>

					<AdminSidebar activeItem="Patients" />
				</div>
			</section>
		</>
	)
}
