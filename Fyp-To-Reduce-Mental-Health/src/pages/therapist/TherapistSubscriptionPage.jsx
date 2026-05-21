import { Link } from 'react-router-dom'
import { ArrowRight, Bell, CheckCircle2, ChevronRight, Plus } from 'lucide-react'
import TherapistSidebar from '../../components/TherapistSidebar'
import { useAuth } from '../../context/AuthContext.jsx'
import { displayFirstName } from '../../lib/userDisplay.js'

const plans = [
	{
		name: 'Basic',
		price: '$100',
		features: [
			'Unlimited chatbot conversations',
			'Daily mood & emotion tracking',
			'Access to self-help resource library',
			'Community peer support groups',
		],
		featured: false,
	},
	{
		name: 'Standard',
		price: '$200',
		features: [
			'Everything included in Basic plan',
			'Personalized coping strategies',
			'Weekly mental health progress reports',
			'Priority 24/7 crisis response support',
		],
		featured: true,
	},
	{
		name: 'Premium',
		price: '$300',
		features: [
			'Everything included in Standard plan',
			'Monthly licensed therapist sessions',
			'Custom mental wellness treatment plan',
			'Family & caregiver dashboard access',
		],
		featured: false,
	},
]

export default function TherapistSubscriptionPage() {
	const { user } = useAuth()
	const welcomeName = displayFirstName(user)
	return (
		<>
			<div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
			<section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
				<div className="flex flex-wrap items-center justify-between gap-4 mb-8">
					<div>
						<p className="text-sm uppercase tracking-[0.25em] text-brand/70">Subscription</p>
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
									<p className="text-[22px] font-semibold text-[#111]">Subscription</p>
									<p className="mt-3 text-sm text-[#6b7b6a]">Current Package:</p>
								</div>
								<button className="inline-flex items-center gap-2 rounded-full bg-[#0f4e34] px-4 py-2 text-sm font-semibold text-white transition hover:bg-[#164e35]">
									<Plus size={16} />
									Upgrade Package
								</button>
							</div>

							<div className="mt-10">
								<div className="grid grid-cols-3 gap-10 items-end max-[900px]:grid-cols-1 max-[900px]:gap-8 max-[900px]:max-w-md max-[900px]:mx-auto max-[900px]:items-stretch">
									{plans.map((plan) => {
										const isFeatured = plan.featured
										return (
											<div
												key={plan.name}
												className={[
													'relative bg-brand rounded-2xl flex flex-col',
													isFeatured
														? 'shadow-[0_20px_45px_-10px_rgba(31,95,74,0.45)] z-10 h-140 max-[900px]:h-auto'
														: 'shadow-[0_18px_35px_-12px_rgba(31,95,74,0.35)] h-122.5 max-[900px]:h-auto',
												].join(' ')}
											>
												{isFeatured && (
													<img
														src="/images/Ellipse 4.png"
														alt=""
														aria-hidden="true"
														className="absolute -top-20 -right-20 w-48 pointer-events-none select-none z-20"
													/>
												)}

												<div className="relative text-center pt-8 pb-6 px-6">
													<h3 className="text-white text-[34px] font-extrabold leading-none max-[480px]:text-[28px]">
														{plan.name}
													</h3>
													<div className="absolute left-6 right-6 bottom-0 h-px bg-white/35" />
												</div>

												<div className="text-center pt-6 pb-2 px-6">
													<p className="text-white text-[40px] font-extrabold leading-none max-[480px]:text-[32px]">
														{plan.price}
													</p>
												</div>

												<ul className="flex-1 px-7 py-6 space-y-4">
													{plan.features.map((feature) => (
														<li key={feature} className="flex items-start gap-3 text-white text-[14px] leading-normal">
															<CheckCircle2 size={18} strokeWidth={2} className="shrink-0 mt-0.5 text-white" />
															<span>{feature}</span>
														</li>
													))}
												</ul>

												<div className="px-5 pb-5 pt-2">
													<Link
														to="/register"
														className={[
															'w-full inline-flex items-center justify-center gap-2 rounded-lg py-3 text-[15px] font-semibold cursor-pointer transition-all hover:-translate-y-px',
															isFeatured
																? 'text-white bg-linear-to-r from-brand-dark via-[#3FB58A] to-brand-dark hover:brightness-110'
																: 'bg-white text-brand hover:bg-white/90',
														].join(' ')}
													>
														Get Started
														<ArrowRight size={16} strokeWidth={2.25} />
													</Link>
												</div>
											</div>
										)
									})}
								</div>
							</div>
						</div>
					</div>

					<TherapistSidebar activeItem="Subscription" />
				</div>
			</section>
		</>
	)
}
