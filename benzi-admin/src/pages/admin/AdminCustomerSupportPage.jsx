import { useState, useEffect } from 'react'
import { Send, CheckCircle2, Clock } from 'lucide-react'
import AdminSidebar from '../../components/AdminSidebar'
import { api } from '../../lib/api.js'

export default function AdminCustomerSupportPage() {
	const [ticketsList, setTicketsList] = useState([])
	const [counts, setCounts] = useState({
		openTickets: 0,
		pendingReply: 0,
		resolvedToday: 0,
		avgResponse: '14m'
	})
	const [activeTicketId, setActiveTicketId] = useState(null)
	const [loading, setLoading] = useState(true)
	const [filterTab, setFilterTab] = useState('All')
	const [replyMessage, setReplyMessage] = useState('')
	const [sendingReply, setSendingReply] = useState(false)

	const fetchTickets = async () => {
		try {
			const json = await api('/admin/tickets', { method: 'GET' })
			if (json.success) {
				setTicketsList(json.data.tickets)
				setCounts(json.data.counts)
				if (json.data.tickets.length > 0 && !activeTicketId) {
					setActiveTicketId(json.data.tickets[0]._id)
				}
			}
		} catch (e) {
			console.error('Failed to fetch support tickets:', e)
		} finally {
			setLoading(false)
		}
	}

	useEffect(() => {
		fetchTickets()
	}, [])

	const activeTicket = ticketsList.find((t) => t._id === activeTicketId)

	const handleSendReply = async (e) => {
		e.preventDefault()
		if (!replyMessage.trim() || !activeTicketId) return

		try {
			setSendingReply(true)
			const json = await api(`/admin/tickets/${activeTicketId}/reply`, {
				method: 'POST',
				body: JSON.stringify({ message: replyMessage })
			})
			if (json.success) {
				setReplyMessage('')
				await fetchTickets()
			}
		} catch (e) {
			console.error('Failed to send reply:', e)
		} finally {
			setSendingReply(false)
		}
	}

	const handleResolveTicket = async () => {
		if (!activeTicketId) return
		try {
			const json = await api(`/admin/tickets/${activeTicketId}/status`, {
				method: 'PATCH',
				body: JSON.stringify({ status: 'Completed' })
			})
			if (json.success) {
				await fetchTickets()
			}
		} catch (e) {
			console.error('Failed to resolve ticket:', e)
		}
	}

	// Filter logic
	const filteredTickets = ticketsList.filter((t) => {
		if (filterTab === 'All') return true
		if (filterTab === 'Open') return t.status === 'Pending'
		if (filterTab === 'Pending') {
			if (t.status !== 'Pending') return false
			if (t.replies.length === 0) return true
			return t.replies[t.replies.length - 1].sender === 'user'
		}
		if (filterTab === 'Resolved') return t.status === 'Completed'
		return true
	})

	const getRelativeTime = (dateStr) => {
		const diff = Date.now() - new Date(dateStr).getTime()
		const mins = Math.floor(diff / 60000)
		if (mins < 1) return 'Just now'
		if (mins < 60) return `${mins}m ago`
		const hrs = Math.floor(mins / 60)
		if (hrs < 24) return `${hrs}h ago`
		return new Date(dateStr).toLocaleDateString()
	}

	return (
		<>
			<div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
			<section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
				<div className="grid gap-6 xl:grid-cols-[1fr_260px] max-[1280px]:grid-cols-1">
					<div className="space-y-6">
						<div>
							<h1 className="text-[18px] font-semibold text-[#0f3a2b]">Customer Support</h1>
							<p className="text-[12px] text-[#7d8b7d]">Answer questions and resolve customer tickets</p>
						</div>

						<div className="grid gap-4 md:grid-cols-4">
							{[
								{ label: 'Open Tickets', value: counts.openTickets },
								{ label: 'Pending Reply', value: counts.pendingReply },
								{ label: 'Resolved Today', value: counts.resolvedToday },
								{ label: 'Avg. Response', value: counts.avgResponse },
							].map((card) => (
								<div key={card.label} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
									<p className="text-[11px] text-[#7d8b7d]">{card.label}</p>
									<p className="text-[20px] font-semibold text-[#111] mt-1">{card.value}</p>
								</div>
							))}
						</div>

						{loading ? (
							<div className="flex items-center justify-center py-12 text-sm text-[#7d8b7d] animate-pulse">
								Loading tickets and support conversations...
							</div>
						) : (
							<div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr]">
								{/* Left - Tickets List */}
								<div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
									<div className="flex items-center gap-2 text-[12px] text-[#6b7b6a] flex-wrap">
										{['All', 'Open', 'Pending', 'Resolved'].map((tab) => (
											<button
												key={tab}
												onClick={() => setFilterTab(tab)}
												className={`rounded-full px-3 py-1 transition-all ${filterTab === tab ? 'bg-brand text-white font-semibold' : 'bg-[#edf4ea] text-brand hover:bg-[#e0edd9]'}`}
											>
												{tab}
											</button>
										))}
									</div>

									<div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto pr-1">
										{filteredTickets.length > 0 ? (
											filteredTickets.map((ticket) => (
												<button
													key={ticket._id}
													onClick={() => setActiveTicketId(ticket._id)}
													className={`w-full text-left rounded-2xl border p-4 transition-all hover:-translate-y-0.5 ${activeTicketId === ticket._id ? 'bg-[#f5f7f2] border-brand' : 'bg-white border-black/10'}`}
												>
													<div className="flex items-center justify-between mb-1.5">
														<span className="text-[10px] font-bold text-brand uppercase">{ticket.ticketId}</span>
														<span className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold ${ticket.status === 'Completed' ? 'bg-green-100 text-green-700' : 'bg-amber-100 text-amber-700'}`}>
															{ticket.status}
														</span>
													</div>
													<p className="text-[12px] font-bold text-[#111] truncate">{ticket.subject}</p>
													<p className="mt-1 text-[11px] text-[#6b7b6a]">{ticket.name}</p>
													<div className="mt-2 flex items-center justify-between text-[10px] text-[#6b7b6a]">
														<span>{getRelativeTime(ticket.createdAt)}</span>
														<span className="rounded-full bg-[#e9efe8] px-2.5 py-0.5 font-semibold">{ticket.priority}</span>
													</div>
												</button>
											))
										) : (
											<p className="text-center text-[#7d8b7d] py-12 text-[13px]">No support tickets found.</p>
										)}
									</div>
								</div>

								{/* Right - Active Ticket Conversation Thread */}
								<div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm flex flex-col justify-between min-h-[450px]">
									{activeTicket ? (
										<>
											<div>
												<div className="flex items-center justify-between border-b border-black/5 pb-3">
													<div>
														<h2 className="text-[14px] font-bold text-[#111] leading-tight">{activeTicket.subject}</h2>
														<p className="text-[11px] text-[#6b7b6a] mt-1">{activeTicket.ticketId} · {activeTicket.name} ({activeTicket.email})</p>
													</div>
													{activeTicket.status === 'Pending' && (
														<button
															onClick={handleResolveTicket}
															className="inline-flex items-center gap-1.5 rounded-full bg-green-600 hover:bg-green-700 px-3 py-1.5 text-[11px] font-bold text-white transition-all hover:scale-105 active:scale-95"
														>
															<CheckCircle2 size={13} />
															Resolve
														</button>
													)}
												</div>

												{/* Scrollable Conversation replies */}
												<div className="mt-4 space-y-4 max-h-[300px] overflow-y-auto pr-1">
													{activeTicket.replies && activeTicket.replies.map((reply, i) => (
														<div 
															key={i} 
															className={`flex flex-col max-w-[85%] rounded-2xl p-3.5 text-[12.5px] leading-relaxed ${reply.sender === 'admin' ? 'bg-brand text-white ml-auto rounded-tr-none' : 'bg-[#f5f7f2] text-[#3f4f41] mr-auto rounded-tl-none'}`}
														>
															<p>{reply.message}</p>
															<span className={`text-[9px] mt-1.5 block self-end font-semibold ${reply.sender === 'admin' ? 'text-white/70' : 'text-black/40'}`}>
																{getRelativeTime(reply.createdAt)}
															</span>
														</div>
													))}
												</div>
											</div>

											{activeTicket.status === 'Pending' ? (
												<form onSubmit={handleSendReply} className="mt-6 flex items-center gap-3 border-t border-black/5 pt-4">
													<input
														type="text"
														placeholder="Type your reply..."
														value={replyMessage}
														onChange={(e) => setReplyMessage(e.target.value)}
														required
														className="flex-1 rounded-full border border-black/10 px-4 py-3 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all bg-cream/30 text-[#222]"
													/>
													<button
														type="submit"
														disabled={sendingReply || !replyMessage.trim()}
														className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white hover:bg-brand-dark transition-all disabled:opacity-50 disabled:cursor-not-allowed"
													>
														<Send size={15} />
													</button>
												</form>
											) : (
												<div className="mt-6 border-t border-black/5 pt-4 flex items-center justify-center gap-2 text-[#7d8b7d] text-[12px] bg-green-50 rounded-xl py-3 border border-green-200">
													<CheckCircle2 size={15} className="text-green-600" />
													<span>This ticket has been resolved and completed.</span>
												</div>
											)}
										</>
									) : (
										<div className="flex flex-col items-center justify-center py-20 text-center text-[#7d8b7d]">
											<Clock size={36} className="text-[#a5b2a5] mb-2" />
											<p className="text-[13px] font-semibold">Select a ticket from the left panel to begin replying.</p>
										</div>
									)}
								</div>
							</div>
						)}
					</div>

					<AdminSidebar activeItem="Customer Support" />
				</div>
			</section>
		</>
	)
}
