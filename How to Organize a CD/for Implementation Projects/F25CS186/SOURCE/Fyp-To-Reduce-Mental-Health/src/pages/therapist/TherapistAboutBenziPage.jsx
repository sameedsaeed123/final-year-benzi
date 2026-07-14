import { Link } from 'react-router-dom'
import { Bell, ChevronRight, Bot, ShieldCheck, HeartPulse, Stethoscope, Sparkles, SendHorizonal, CheckCircle2, Watch, Globe, Mic, ChevronDown } from 'lucide-react'
import TherapistSidebar from '../../components/TherapistSidebar'
import { useAuth } from '../../context/AuthContext.jsx'
import { displayFirstName } from '../../lib/userDisplay.js'

const features = [
	{
		title: 'For Therapists',
		icon: Stethoscope,
		text: 'Add patients, store detailed medical histories, track progress over time. Get instant email alerts for new patients, define working hours, off days, and session pricing.',
	},
	{
		title: 'For Patients',
		icon: HeartPulse,
		text: 'View personal details and medical records. Real-time calendar with available slots, automatic blocking of unavailable days. Anonymous chats/video calls for privacy.',
	},
	{
		title: 'AI Virtual Assistant',
		icon: Sparkles,
		text: 'Analyzes patient data for tailored advice (e.g., "Avoid peanuts due to allergy"). Therapists assign daily/weekly goals, patients earn points for completing tasks.',
	},
	{
		title: 'Security & Privacy',
		icon: ShieldCheck,
		text: 'End-to-end encryption for messages/video calls. Anonymous mode hides patient identities during sensitive conversations.',
	},
]

const problems = [
	{
		title: 'Inefficient Manual Processes',
		text: 'Automated scheduling eliminates booking conflicts and administrative overload.',
	},
	{
		title: 'Low Patient Engagement',
		text: 'Task tracking, progress dashboards, and point rewards keep patients motivated.',
	},
	{
		title: 'Privacy Concerns & Stigma',
		text: 'Anonymous communication channels let patients seek help without fear.',
	},
	{
		title: 'Generic Care',
		text: 'AI-driven personalized advice based on individual medical profiles.',
	},
	{
		title: 'No-Show Rates',
		text: 'Smart reminders via email/SMS significantly reduce missed appointments.',
	},
	{
		title: 'Data Fragmentation',
		text: 'One centralized hub for records, notes, prescriptions, and progress.',
	},
]

const results = [
	{
		title: 'Efficient Workflow',
		text: 'Therapists spend less time on admin tasks and more on patient care.',
	},
	{
		title: 'Better Engagement',
		text: '24/7 AI support and goal tracking improve patient adherence.',
	},
	{
		title: 'Enhanced Privacy',
		text: 'Anonymous sessions encourage more patients to seek help.',
	},
	{
		title: 'Streamlined Scheduling',
		text: 'Automated blocking reduces errors and double-booking.',
	},
]

const faqs = [
	{
		question: 'How do I book an appointment?',
		answer: 'Navigate to the Appointment section from the sidebar. You will see a real-time calendar showing available slots. Select a preferred time slot, confirm the booking, and you will receive a confirmation email.',
	},
	{ question: 'How does the AI chatbot help?', answer: '' },
	{ question: 'Is my data secure and private?', answer: '' },
	{ question: 'Can I edit my medical records?', answer: '' },
	{ question: 'What is the task tracking feature?', answer: '' },
]

const enhancements = [
	{
		title: 'Wearable Integration',
		text: 'Integration with devices like Fitbit to track health metrics automatically.',
		icon: Watch,
	},
	{
		title: 'Multi-Language Support',
		text: 'Cater to diverse populations with support for multiple languages.',
		icon: Globe,
	},
	{
		title: 'Voice AI',
		text: 'Voice-based AI interactions for hands-free support during sessions.',
		icon: Mic,
	},
]

export default function TherapistAboutBenziPage() {
	const { user } = useAuth()
	const welcomeName = displayFirstName(user)
	return (
		<>
			<div className="pt-4" />
			<section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
				<div className="flex flex-wrap items-center justify-between gap-4 mb-8">
					<div>
						<p className="text-sm uppercase tracking-[0.25em] text-brand/70">About Benzi</p>
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
						<div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm max-h-[680px] overflow-y-auto pr-2">
							<div className="rounded-[20px] border border-black/5 bg-white p-5">
								<p className="text-[14px] font-semibold text-[#1b4d3a] flex items-center gap-2">
									<Sparkles size={16} />
									What is Benzi?
								</p>
								<p className="mt-3 text-[12.5px] text-[#66746b] leading-5">
									Benzi is a centralized hub for managing therapy sessions, medical records, appointments, and patient progress. It bridges critical gaps in teletherapy by creating a collaborative ecosystem where therapists can data-drive insights, patients receive 24/7 AI-powered support, and privacy-by-design architecture builds trust.
								</p>
								<p className="mt-3 text-[12.5px] text-[#66746b] leading-5">
									Unlike existing solutions (BetterHelp, Talkspace), Benzi uniquely combines real-time therapist availability tracking, patient-specific AI coaching using medical history, progress analytics dashboards, and end-to-end encrypted anonymous sessions.
								</p>
							</div>

							<div className="mt-6">
								<p className="text-[14px] font-semibold text-[#1b4d3a] flex items-center gap-2">
									<HeartPulse size={16} />
									Key Features
								</p>
								<div className="mt-4 grid gap-4 md:grid-cols-2">
									{features.map((feature) => {
										const Icon = feature.icon
										return (
											<div key={feature.title} className="rounded-[16px] border border-black/5 bg-white p-4">
												<div className="flex items-center gap-2 text-[13px] font-semibold text-[#1b4d3a]">
													<span className="h-8 w-8 rounded-full bg-[#eef6f1] flex items-center justify-center">
														<Icon size={16} />
													</span>
													{feature.title}
												</div>
												<p className="mt-3 text-[12px] text-[#65746b] leading-5">{feature.text}</p>
											</div>
										)
									})}
								</div>
							</div>

							<div className="mt-6">
								<p className="text-[14px] font-semibold text-[#1b4d3a] flex items-center gap-2">
									<Bot size={16} />
									Try Our AI Chatbot
								</p>
								<p className="mt-2 text-[12px] text-[#66746b]">Experience Benzi’s AI Virtual Assistant. Try typing keywords like hello, appointment, task, stress, or progress to see how it responds.</p>
								<div className="mt-4 rounded-[16px] border border-black/10 overflow-hidden">
									<div className="bg-brand text-white px-4 py-2 flex items-center justify-between text-[12px]">
										<div className="flex items-center gap-2">
											<Bot size={14} />
											<span>Benzi AI Assistant</span>
										</div>
										<span className="text-[10px] text-white/80">Online</span>
									</div>
									<div className="bg-white p-4 space-y-4">
										<div className="rounded-[12px] border border-black/10 bg-[#f7f8f5] p-3 text-[12px] text-[#57655c]">
											Hello! I’m Benzi AI, your virtual wellness assistant. How can I help you today?
										</div>
										<input
											type="text"
											placeholder="Try hello, appointment, task, stress, progress..."
											className="w-full rounded-full border border-black/10 bg-white px-4 py-2 text-[12px] text-[#2e3f34]"
										/>
										<div className="flex justify-end">
											<button className="h-8 w-8 rounded-full bg-[#0f4e34] text-white flex items-center justify-center">
												<SendHorizonal size={14} />
											</button>
										</div>
									</div>
								</div>
							</div>

							<div className="mt-6 grid gap-4 md:grid-cols-2">
								<div className="rounded-[16px] overflow-hidden relative">
									<img src="/images/About-Us-Second-Section-Image.png" alt="Therapy session" className="h-40 w-full object-cover" />
									<div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
									<div className="absolute bottom-3 left-3 right-3 text-white">
										<p className="text-[12px] font-semibold">Seamless Therapy Sessions</p>
										<p className="mt-1 text-[10px] text-white/80">Smart scheduling with real-time calendar and automated reminders.</p>
									</div>
								</div>
								<div className="rounded-[16px] overflow-hidden relative">
									<img src="/images/Frame 33921.png" alt="Privacy" className="h-40 w-full object-cover" />
									<div className="absolute inset-0 bg-gradient-to-t from-black/70 to-transparent" />
									<div className="absolute bottom-3 left-3 right-3 text-white">
										<p className="text-[12px] font-semibold">Military-Grade Privacy</p>
										<p className="mt-1 text-[10px] text-white/80">End-to-end encryption and anonymous modes for sensitive discussions.</p>
									</div>
								</div>
							</div>

							<div className="mt-6">
								<p className="text-[14px] font-semibold text-[#1b4d3a] flex items-center gap-2">
									<CheckCircle2 size={16} />
									Problems We Solve
								</p>
								<div className="mt-4 grid gap-3 md:grid-cols-3">
									{problems.map((item) => (
										<div key={item.title} className="rounded-[14px] border border-black/5 bg-white p-3">
											<p className="text-[12px] font-semibold text-[#1b4d3a] flex items-center gap-2">
												<span className="h-4 w-4 rounded-full bg-[#eef6f1] flex items-center justify-center">
													<CheckCircle2 size={10} />
												</span>
												{item.title}
											</p>
											<p className="mt-2 text-[10px] text-[#66746b] leading-4">{item.text}</p>
										</div>
									))}
								</div>
							</div>

							<div className="mt-6 rounded-[18px] bg-[#0f5a50] text-white p-4">
								<p className="text-[14px] font-semibold flex items-center gap-2">
									<CheckCircle2 size={16} />
									Expected Results
								</p>
								<div className="mt-4 grid gap-3 md:grid-cols-2">
									{results.map((item) => (
										<div key={item.title} className="rounded-[14px] bg-[#0b4b43] p-3">
											<p className="text-[12px] font-semibold">{item.title}</p>
											<p className="mt-2 text-[10px] text-white/80 leading-4">{item.text}</p>
										</div>
									))}
								</div>
							</div>

							<div className="mt-6">
								<p className="text-[14px] font-semibold text-[#1b4d3a] flex items-center gap-2">
									<CheckCircle2 size={16} />
									Frequently Asked Questions
								</p>
								<div className="mt-3 space-y-2">
									{faqs.map((item, index) => (
										<div key={item.question} className="rounded-[14px] border border-black/5 bg-white">
											<div className="flex items-center justify-between px-4 py-3 text-[12px] font-semibold text-[#1b4d3a]">
												<span>{item.question}</span>
												<ChevronDown size={16} />
											</div>
											{index === 0 && (
												<p className="px-4 pb-3 text-[11px] text-[#66746b] leading-5">{item.answer}</p>
											)}
										</div>
									))}
								</div>
							</div>

							<div className="mt-6">
								<p className="text-[14px] font-semibold text-[#1b4d3a] flex items-center gap-2">
									<CheckCircle2 size={16} />
									Future Enhancements
								</p>
								<div className="mt-4 grid gap-3 md:grid-cols-3">
									{enhancements.map((item) => {
										const Icon = item.icon
										return (
											<div key={item.title} className="rounded-[14px] border border-black/5 bg-white p-3 text-center">
												<span className="mx-auto mb-2 flex h-8 w-8 items-center justify-center rounded-full bg-[#eef6f1] text-[#1b4d3a]">
													<Icon size={16} />
												</span>
												<p className="text-[12px] font-semibold text-[#1b4d3a]">{item.title}</p>
												<p className="mt-2 text-[10px] text-[#66746b] leading-4">{item.text}</p>
											</div>
										)
									})}
								</div>
							</div>
						</div>
					</div>

					<TherapistSidebar activeItem="About Benzi" />
				</div>
			</section>
		</>
	)
}
