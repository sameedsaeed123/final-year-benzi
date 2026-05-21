import { useState } from 'react'
import { Eye, EyeOff, Wand2 } from 'lucide-react'
import AdminSidebar from '../../components/AdminSidebar'

const recentlySent = [
	{ initials: 'DR', name: 'Dr. Rahima', email: 'rahima@benzi.com', time: '2026-05-03 10:42', status: 'Sent' },
	{ initials: 'DS', name: 'Dr. Shayan', email: 'shayan@benzi.com', time: '2026-05-02 17:10', status: 'Sent' },
	{ initials: 'DA', name: 'Dr. Alina', email: 'alina@benzi.com', time: '2026-05-01 09:25', status: 'Failed' },
]

const statusStyles = {
	Sent: 'bg-[#e7f4ee] text-[#1f5f4a]',
	Failed: 'bg-[#fde8e5] text-[#b42318]',
}

export default function AdminSendCredentialsPage() {
	const [showPassword, setShowPassword] = useState(false)
	const [temporaryPassword, setTemporaryPassword] = useState('Tmp@2026!')

	const generatePassword = () => {
		setTemporaryPassword(`Tmp@${Math.floor(Math.random() * 9000 + 1000)}!`)
	}

	return (
		<>
			<div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
			<section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
				<div className="grid gap-6 xl:grid-cols-[1fr_260px] max-[1280px]:grid-cols-1">
					<div className="space-y-6">
						<div>
							<h1 className="text-[18px] font-semibold text-[#0f3a2b]">Send Credentials</h1>
							<p className="text-[12px] text-[#7d8b7d]">Send login credentials to newly registered doctors via email</p>
						</div>

						<div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
							<form className="grid gap-5" onSubmit={(event) => event.preventDefault()}>
								<div className="grid gap-4 md:grid-cols-2">
									<div>
										<label className="block text-[12px] font-semibold text-[#1f3a2b] mb-2">First Name*</label>
										<input type="text" placeholder="Jane" className="w-full rounded-xl border border-black/10 bg-[#f8faf8] px-4 py-3 text-sm" />
									</div>
									<div>
										<label className="block text-[12px] font-semibold text-[#1f3a2b] mb-2">Last Name*</label>
										<input type="text" placeholder="Doe" className="w-full rounded-xl border border-black/10 bg-[#f8faf8] px-4 py-3 text-sm" />
									</div>
									<div>
										<label className="block text-[12px] font-semibold text-[#1f3a2b] mb-2">Email*</label>
										<input type="email" placeholder="jane@benzi.com" className="w-full rounded-xl border border-black/10 bg-[#f8faf8] px-4 py-3 text-sm" />
									</div>
									<div>
										<label className="block text-[12px] font-semibold text-[#1f3a2b] mb-2">Phone No*</label>
										<input type="tel" placeholder="+1 555..." className="w-full rounded-xl border border-black/10 bg-[#f8faf8] px-4 py-3 text-sm" />
									</div>
									<div>
										<label className="block text-[12px] font-semibold text-[#1f3a2b] mb-2">Specialization*</label>
										<input type="text" placeholder="Psychologist" className="w-full rounded-xl border border-black/10 bg-[#f8faf8] px-4 py-3 text-sm" />
									</div>
									<div>
										<label className="block text-[12px] font-semibold text-[#1f3a2b] mb-2">Subscription Plan*</label>
										<input type="text" placeholder="Standard" className="w-full rounded-xl border border-black/10 bg-[#f8faf8] px-4 py-3 text-sm" />
									</div>
								</div>

								<div>
									<label className="block text-[12px] font-semibold text-[#1f3a2b] mb-2">Temporary Password*</label>
									<div className="relative">
										<input
											type={showPassword ? 'text' : 'password'}
											value={temporaryPassword}
											onChange={(event) => setTemporaryPassword(event.target.value)}
											className="w-full rounded-xl border border-black/10 bg-[#f8faf8] px-4 py-3 pr-28 text-sm"
										/>
										<button
											type="button"
											className="absolute right-24 top-1/2 -translate-y-1/2 text-[#6b7b6a]"
											onClick={() => setShowPassword((value) => !value)}
										>
											{showPassword ? <EyeOff size={16} /> : <Eye size={16} />}
										</button>
										<button
											type="button"
											className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center gap-1 rounded-full border border-black/10 px-3 py-1 text-[11px]"
											onClick={generatePassword}
										>
											<Wand2 size={12} />
											Auto-generate
										</button>
									</div>
								</div>

								<div>
									<label className="block text-[12px] font-semibold text-[#1f3a2b] mb-2">Message</label>
									<textarea rows={4} placeholder="Write a welcome message or additional instructions..." className="w-full rounded-xl border border-black/10 bg-[#f8faf8] px-4 py-3 text-sm" />
								</div>

								<button className="w-full rounded-full bg-brand py-3 text-sm font-semibold text-white">Send Credentials</button>
							</form>
						</div>

						<div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm max-w-sm">
							<p className="text-[13px] font-semibold text-[#111]">Recently Sent</p>
							<div className="mt-4 space-y-3">
								{recentlySent.map((item) => (
									<div key={item.email} className="flex items-center justify-between gap-3 rounded-2xl border border-black/10 bg-[#f9fbf8] p-3">
										<div className="flex items-center gap-3">
											<div className="h-9 w-9 rounded-full bg-brand text-white flex items-center justify-center text-[11px] font-semibold">
												{item.initials}
											</div>
											<div>
												<p className="text-[12px] font-semibold text-[#111]">{item.name}</p>
												<p className="text-[10px] text-[#6b7b6a]">{item.email}</p>
												<p className="text-[10px] text-[#6b7b6a]">{item.time}</p>
											</div>
										</div>
										<span className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${statusStyles[item.status]}`}>
											{item.status}
										</span>
									</div>
								))}
							</div>
						</div>
					</div>

					<AdminSidebar activeItem="Send Credentials" />
				</div>
			</section>
		</>
	)
}
