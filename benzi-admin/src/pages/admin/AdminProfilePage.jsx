import AdminSidebar from '../../components/AdminSidebar'

export default function AdminProfilePage() {
	return (
		<>
			<div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
			<section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
				<div className="grid gap-6 xl:grid-cols-[1fr_260px] max-[1280px]:grid-cols-1">
					<div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
						<h1 className="text-[18px] font-semibold text-[#0f3a2b]">Profile</h1>
						<p className="mt-2 text-[12px] text-[#7d8b7d]">Admin profile settings coming soon.</p>
					</div>

					<AdminSidebar activeItem="Profile" />
				</div>
			</section>
		</>
	)
}
