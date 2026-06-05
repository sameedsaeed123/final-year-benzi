import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Bell, ChevronRight, MessageCircle, Search, User, EyeOff } from 'lucide-react'
import TherapistSidebar from '../../components/TherapistSidebar'
import ChatWindow from '../../components/ChatWindow'
import { useAuth } from '../../context/AuthContext.jsx'
import { useSocket } from '../../context/SocketContext.jsx'
import { displayFirstName } from '../../lib/userDisplay.js'
import { api } from '../../lib/api.js'

function timeAgo(raw) {
  if (!raw) return ''
  const diff = Date.now() - new Date(raw).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'just now'
  if (mins < 60) return `${mins}m ago`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h ago`
  return `${Math.floor(hrs / 24)}d ago`
}

export default function TherapistChatPage() {
  const { user } = useAuth()
  const { getSocket, setUnread } = useSocket()
  const welcomeName = displayFirstName(user)
  const [searchParams, setSearchParams] = useSearchParams()

  const [conversations, setConversations] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [activePatientId, setActivePatientId] = useState(searchParams.get('patientId') || null)

  const loadConversations = useCallback(async () => {
    try {
      const json = await api('/chat/therapist/conversations', { method: 'GET' })
      setConversations(json.data?.conversations || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadConversations()
  }, [loadConversations])

  // Refresh conversations when new message arrives
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const onNew = () => void loadConversations()
    socket.on('new_message', onNew)
    return () => socket.off('new_message', onNew)
  }, [getSocket, loadConversations])

  // Sync URL param
  useEffect(() => {
    if (activePatientId) {
      setSearchParams({ patientId: activePatientId }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }, [activePatientId, setSearchParams])

  const activeConv = conversations.find((c) => c.patientUserId === activePatientId)

  const filtered = search.trim()
    ? conversations.filter((c) => c.name?.toLowerCase().includes(search.toLowerCase()))
    : conversations

  const handleSelectConv = (patientId) => {
    setActivePatientId(patientId)
    // Reset unread for this conversation
    void api(`/chat/therapist/read/${patientId}`, { method: 'PATCH' }).catch(() => {})
    // Refresh unread count
    api('/chat/unread', { method: 'GET' }).then((j) => setUnread(j.data?.unread || 0)).catch(() => {})
    // Refresh list
    void loadConversations()
  }

  return (
    <>
      <div className="pt-4" />
      <section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-brand/70">Messages</p>
            <h1 className="text-[36px] font-extrabold text-[#0f3a2b] max-[640px]:text-[28px]">{`Welcome ${welcomeName}!`}</h1>
          </div>
          <Link to="/therapist-profile"
            className="flex items-center gap-2 bg-white border border-black/10 rounded-full px-4 py-3 shadow-sm text-[14px] font-semibold text-[#111] transition-all hover:-translate-y-0.5">
            <Bell size={18} /><span>{welcomeName}</span><ChevronRight size={18} />
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_280px] max-[1280px]:grid-cols-1 items-start">
          <div className="rounded-[30px] border border-black/5 bg-white shadow-sm overflow-hidden"
            style={{ height: 'calc(100vh - 260px)', minHeight: '500px' }}>
            <div className="flex h-full">

              {/* Conversation list */}
              <div className={`flex flex-col border-r border-black/8 bg-[#fafaf8] ${activePatientId ? 'hidden md:flex md:w-72' : 'w-full md:w-72'}`}>
                <div className="px-4 py-4 border-b border-black/8">
                  <p className="text-[15px] font-semibold text-[#111] mb-3">Conversations</p>
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#7d8b7d] pointer-events-none" />
                    <input type="text" placeholder="Search clients…" value={search}
                      onChange={(e) => setSearch(e.target.value)}
                      className="w-full rounded-full border border-black/10 bg-white pl-9 pr-4 py-2 text-[12px] outline-none focus:border-[#0f4e34] focus:ring-2 focus:ring-[#0f4e34]/15" />
                  </div>
                </div>

                <div className="flex-1 overflow-y-auto">
                  {loading && (
                    <div className="flex justify-center py-8">
                      <div className="flex gap-1">
                        {[0,1,2].map(i => (
                          <span key={i} className="w-2 h-2 rounded-full bg-[#1f5f4a]/40 animate-bounce"
                            style={{ animationDelay: `${i*150}ms` }} />
                        ))}
                      </div>
                    </div>
                  )}
                  {!loading && filtered.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <MessageCircle size={32} className="text-[#c5d5c8] mb-3" />
                      <p className="text-[13px] font-semibold text-[#556b5b]">No conversations yet</p>
                      <p className="text-[11px] text-[#7d8b7d] mt-1">Clients will appear here once you start chatting</p>
                    </div>
                  )}
                  {filtered.map((conv) => (
                    <button key={conv.patientUserId} type="button"
                      onClick={() => handleSelectConv(conv.patientUserId)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition border-b border-black/5 hover:bg-[#f0f7f3] ${
                        activePatientId === conv.patientUserId ? 'bg-[#e8f3ea]' : ''
                      }`}>
                      <div className="relative flex-shrink-0">
                        {conv.image ? (
                          <img src={conv.image} alt={conv.name} className="h-10 w-10 rounded-full object-cover border border-black/8" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-[#e8f3ea] flex items-center justify-center">
                            {conv.isAnonymous ? <EyeOff size={14} className="text-[#1f5f4a]" /> : <User size={14} className="text-[#1f5f4a]" />}
                          </div>
                        )}
                        {conv.unread > 0 && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#0f4e34] text-white text-[9px] font-bold flex items-center justify-center">
                            {conv.unread > 9 ? '9+' : conv.unread}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-[13px] truncate ${conv.unread > 0 ? 'font-bold text-[#111]' : 'font-semibold text-[#1a2e22]'}`}>
                            {conv.name}
                          </p>
                          <span className="text-[10px] text-[#9aaa9a] flex-shrink-0">{timeAgo(conv.lastAtRaw)}</span>
                        </div>
                        <p className={`text-[11px] truncate mt-0.5 ${conv.unread > 0 ? 'text-[#1f5f4a] font-medium' : 'text-[#7d8b7d]'}`}>
                          {conv.lastSenderRole === 'therapist' ? 'You: ' : ''}{conv.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat window */}
              <div className={`flex-1 flex flex-col min-w-0 ${!activePatientId ? 'hidden md:flex' : 'flex'}`}>
                {activePatientId && activeConv ? (
                  <ChatWindow
                    therapistUserId={user?.id}
                    patientUserId={activePatientId}
                    otherName={activeConv.name}
                    otherImage={activeConv.image}
                    otherIsAnonymous={activeConv.isAnonymous}
                    myRole="therapist"
                    onBack={() => setActivePatientId(null)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center px-8">
                    <div className="h-16 w-16 rounded-full bg-[#e8f3ea] flex items-center justify-center mb-4">
                      <MessageCircle size={28} className="text-[#1f5f4a]" />
                    </div>
                    <p className="text-[16px] font-semibold text-[#111]">Select a conversation</p>
                    <p className="text-[13px] text-[#7d8b7d] mt-2">Choose a client from the list to start messaging</p>
                  </div>
                )}
              </div>
            </div>
          </div>

          <TherapistSidebar activeItem="Messages" />
        </div>
      </section>
    </>
  )
}
