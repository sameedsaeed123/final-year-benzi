import { useState } from 'react'
import AdminPagination from '../../components/AdminPagination.jsx'
import { Send, CheckCircle2, Clock, Loader2 } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout.jsx'
import AdminPageLoader from '../../components/AdminPageLoader.jsx'
import AdminPanel from '../../components/AdminPanel.jsx'
import { AdminAlert } from '../../components/AdminAlert.jsx'
import { useAdminQuery } from '../../hooks/useAdminQuery.js'
import { api } from '../../lib/api.js'

export default function AdminCustomerSupportPage() {
  const [filterTab, setFilterTab] = useState('All')
  const [page, setPage] = useState(1)
  const path = `/admin/tickets?page=${page}&limit=5&filter=${encodeURIComponent(filterTab)}`
  const { data, loading, error, setError, reload } = useAdminQuery(
    () => api(path, { method: 'GET' }),
    [path],
    { keepPrevious: true }
  )
  const ticketsList = data?.tickets || []
  const total = data?.total ?? 0
  const totalPages = data?.totalPages ?? 1
  const counts = data?.counts || {
    openTickets: 0,
    pendingReply: 0,
    resolvedToday: 0,
    avgResponse: '—',
  }

  const [activeTicketId, setActiveTicketId] = useState(null)
  const [replyMessage, setReplyMessage] = useState('')
  const [sendingReply, setSendingReply] = useState(false)
  const [success, setSuccess] = useState('')

  const effectiveActiveId =
    activeTicketId || (ticketsList.length > 0 ? ticketsList[0]._id : null)
  const activeTicket = ticketsList.find((t) => t._id === effectiveActiveId)

  const handleSendReply = async (e) => {
    e.preventDefault()
    if (!replyMessage.trim() || !effectiveActiveId) return
    setSendingReply(true)
    setError('')
    setSuccess('')
    try {
      await api(`/admin/tickets/${effectiveActiveId}/reply`, {
        method: 'POST',
        body: JSON.stringify({ message: replyMessage }),
      })
      setReplyMessage('')
      setSuccess('Reply sent')
      await reload()
    } catch (e) {
      setError(e.message || 'Failed to send reply')
    } finally {
      setSendingReply(false)
    }
  }

  const handleResolveTicket = async () => {
    if (!effectiveActiveId) return
    setError('')
    try {
      await api(`/admin/tickets/${effectiveActiveId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status: 'Completed' }),
      })
      setSuccess('Ticket resolved')
      await reload()
    } catch (e) {
      setError(e.message || 'Failed to resolve ticket')
    }
  }

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
    <AdminLayout activeItem="Customer Support" title="Customer support">
      <p className="text-sm text-[#556b5b] -mt-2">Answer questions and resolve customer tickets.</p>
      <AdminAlert type="error" message={error} onDismiss={() => setError('')} />
      <AdminAlert type="success" message={success} onDismiss={() => setSuccess('')} />

      {loading && !data ? (
        <AdminPageLoader label="Loading support tickets…" />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-4">
            {[
              { label: 'Open tickets', value: counts.openTickets },
              { label: 'Pending reply', value: counts.pendingReply },
              { label: 'Resolved today', value: counts.resolvedToday },
              { label: 'Avg. response', value: counts.avgResponse },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <p className="text-[11px] text-[#7d8b7d]">{card.label}</p>
                <p className="text-[20px] font-semibold text-[#111] mt-1">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-[0.9fr_1.1fr] mt-6">
            <AdminPanel className="!p-0">
              <div className="p-5">
                <div className="flex items-center gap-2 text-[12px] flex-wrap">
                  {['All', 'Open', 'Pending', 'Resolved'].map((tab) => (
                    <button
                      key={tab}
                      type="button"
                      onClick={() => {
                        setFilterTab(tab)
                        setPage(1)
                      }}
                      className={`rounded-full px-3 py-1 transition ${
                        filterTab === tab
                          ? 'bg-brand text-white font-semibold'
                          : 'bg-[#edf4ea] text-brand hover:bg-[#e0edd9]'
                      }`}
                    >
                      {tab}
                    </button>
                  ))}
                </div>
                <div className="mt-4 space-y-3 max-h-[500px] overflow-y-auto pr-1">
                  {ticketsList.length > 0 ? (
                    ticketsList.map((ticket) => (
                      <button
                        key={ticket._id}
                        type="button"
                        onClick={() => setActiveTicketId(ticket._id)}
                        className={`w-full text-left rounded-2xl border p-4 transition ${
                          effectiveActiveId === ticket._id
                            ? 'bg-[#f5f7f2] border-brand'
                            : 'bg-white border-black/10 hover:border-brand/30'
                        }`}
                      >
                        <div className="flex items-center justify-between mb-1.5">
                          <span className="text-[10px] font-bold text-brand uppercase">
                            {ticket.ticketId}
                          </span>
                          <span
                            className={`inline-block px-2 py-0.5 rounded-full text-[9px] font-semibold ${
                              ticket.status === 'Completed'
                                ? 'bg-green-100 text-green-700'
                                : 'bg-amber-100 text-amber-700'
                            }`}
                          >
                            {ticket.status}
                          </span>
                        </div>
                        <p className="text-[12px] font-bold text-[#111] truncate">{ticket.subject}</p>
                        <p className="mt-1 text-[11px] text-[#6b7b6a]">{ticket.name}</p>
                        <div className="mt-2 flex items-center justify-between text-[10px] text-[#6b7b6a]">
                          <span>{getRelativeTime(ticket.createdAt)}</span>
                          <span className="rounded-full bg-[#e9efe8] px-2.5 py-0.5 font-semibold">
                            {ticket.priority}
                          </span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <p className="text-center text-[#7d8b7d] py-12 text-[13px]">No tickets found.</p>
                  )}
                </div>
                {total > 0 && (
                  <AdminPagination
                    currentPage={page}
                    totalPages={totalPages}
                    totalItems={total}
                    onPageChange={setPage}
                  />
                )}
              </div>
            </AdminPanel>

            <AdminPanel className="!p-0 min-h-[450px] flex flex-col">
              <div className="p-5 flex flex-col flex-1 justify-between">
                {activeTicket ? (
                  <>
                    <div>
                      <div className="flex items-center justify-between border-b border-black/5 pb-3 gap-3">
                        <div className="min-w-0">
                          <h2 className="text-[14px] font-bold text-[#111]">{activeTicket.subject}</h2>
                          <p className="text-[11px] text-[#6b7b6a] mt-1 truncate">
                            {activeTicket.ticketId} · {activeTicket.name} ({activeTicket.email})
                          </p>
                        </div>
                        {activeTicket.status === 'Pending' && (
                          <button
                            type="button"
                            onClick={() => void handleResolveTicket()}
                            className="shrink-0 inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-[11px] font-bold text-white"
                          >
                            <CheckCircle2 size={13} />
                            Resolve
                          </button>
                        )}
                      </div>
                      <div className="mt-4 space-y-4 max-h-[300px] overflow-y-auto pr-1">
                        {(activeTicket.replies || []).map((reply, i) => (
                          <div
                            key={i}
                            className={`flex flex-col max-w-[85%] rounded-2xl p-3.5 text-[12.5px] ${
                              reply.sender === 'admin'
                                ? 'bg-brand text-white ml-auto rounded-tr-none'
                                : 'bg-[#f5f7f2] text-[#3f4f41] mr-auto rounded-tl-none'
                            }`}
                          >
                            <p>{reply.message}</p>
                            <span
                              className={`text-[9px] mt-1.5 self-end font-semibold ${
                                reply.sender === 'admin' ? 'text-white/70' : 'text-black/40'
                              }`}
                            >
                              {getRelativeTime(reply.createdAt)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {activeTicket.status === 'Pending' ? (
                      <form
                        onSubmit={handleSendReply}
                        className="mt-6 flex items-center gap-3 border-t border-black/5 pt-4"
                      >
                        <input
                          type="text"
                          placeholder="Type your reply…"
                          value={replyMessage}
                          onChange={(e) => setReplyMessage(e.target.value)}
                          required
                          className="flex-1 rounded-full border border-black/10 px-4 py-3 text-sm outline-none focus:border-brand bg-cream/30"
                        />
                        <button
                          type="submit"
                          disabled={sendingReply || !replyMessage.trim()}
                          className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-brand text-white disabled:opacity-50"
                        >
                          {sendingReply ? (
                            <Loader2 size={15} className="animate-spin" />
                          ) : (
                            <Send size={15} />
                          )}
                        </button>
                      </form>
                    ) : (
                      <div className="mt-6 border-t border-black/5 pt-4 flex items-center justify-center gap-2 text-[12px] text-green-700 bg-green-50 rounded-xl py-3">
                        <CheckCircle2 size={15} />
                        This ticket is resolved.
                      </div>
                    )}
                  </>
                ) : (
                  <div className="flex flex-col items-center justify-center py-20 text-center text-[#7d8b7d]">
                    <Clock size={36} className="text-[#a5b2a5] mb-2" />
                    <p className="text-[13px] font-semibold">Select a ticket to view the conversation.</p>
                  </div>
                )}
              </div>
            </AdminPanel>
          </div>
        </>
      )}
    </AdminLayout>
  )
}
