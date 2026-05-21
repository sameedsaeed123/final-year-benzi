import AdminSidebar from '../../components/AdminSidebar'

export default function AdminAboutBenziPage() {
	return (
		<>
			<div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
			<section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
				<div className="grid gap-6 xl:grid-cols-[1fr_260px] max-[1280px]:grid-cols-1">
					<div className="rounded-2xl border border-black/5 bg-white p-6 shadow-sm">
						<h1 className="text-[18px] font-semibold text-[#0f3a2b]">About Benzi</h1>
						<p className="mt-2 text-[12px] text-[#7d8b7d]">Benzi is a mental wellness platform connecting patients and therapists.</p>
					</div>

					<AdminSidebar activeItem="About Benzi" />
				</div>
			</section>
		</>
	)
}
