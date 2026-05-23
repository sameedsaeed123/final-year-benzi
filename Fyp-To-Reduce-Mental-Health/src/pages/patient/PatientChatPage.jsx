import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Bell, ChevronRight, MessageCircle, Sparkles, User } from 'lucide-react'
import PatientSidebar from '../../components/PatientSidebar'
import ChatWindow from '../../components/ChatWindow'
import BenziAiChatWindow from '../../components/BenziAiChatWindow'
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

export default function PatientChatPage() {
  const { user } = useAuth()
  const { getSocket, setUnread } = useSocket()
  const welcomeName = displayFirstName(user)
  const [searchParams, setSearchParams] = useSearchParams()

  const [conversations, setConversations] = useState([])
  const [linkedTherapist, setLinkedTherapist] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeTherapistId, setActiveTherapistId] = useState(searchParams.get('therapistId') || null)
  const [chatTab, setChatTab] = useState(searchParams.get('tab') === 'benzi' ? 'benzi' : 'therapist')

  const loadData = useCallback(async () => {
    try {
      const [convJson, linkedJson] = await Promise.all([
        api('/chat/patient/conversations', { method: 'GET', silent: true }),
        api('/patients/linked-therapist/me', { method: 'GET', silent: true }),
      ])
      setConversations(convJson.data?.conversations || [])
      if (linkedJson.data?.linked && linkedJson.data?.therapist) {
        setLinkedTherapist(linkedJson.data.therapist)
        // Auto-open if only one therapist and no active
        if (!activeTherapistId) {
          setActiveTherapistId(linkedJson.data.therapist.id)
        }
      }
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void loadData()
  }, [loadData])

  // Refresh on new message
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const onNew = () => void loadData()
    socket.on('new_message', onNew)
    return () => socket.off('new_message', onNew)
  }, [getSocket, loadData])

  // Sync URL
  useEffect(() => {
    if (activeTherapistId) {
      setSearchParams({ therapistId: activeTherapistId }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }, [activeTherapistId, setSearchParams])

  const handleSelectTherapist = (therapistId) => {
    setActiveTherapistId(therapistId)
    void api(`/chat/patient/read/${therapistId}`, { method: 'PATCH', silent: true }).catch(() => {})
    api('/chat/unread', { method: 'GET', silent: true }).then((j) => setUnread(j.data?.unread || 0)).catch(() => {})
    void loadData()
  }

  // Build the therapist info for the active chat
  const activeConv = conversations.find((c) => c.therapistUserId === activeTherapistId)
  const activeTherapistInfo = activeConv || (linkedTherapist && activeTherapistId === linkedTherapist.id ? {
    therapistUserId: linkedTherapist.id,
    name: linkedTherapist.name,
    image: linkedTherapist.image,
  } : null)

  // All therapists to show (linked + any from conversations)
  const allTherapists = (() => {
    const map = {}
    conversations.forEach((c) => { map[c.therapistUserId] = c })
    if (linkedTherapist && !map[linkedTherapist.id]) {
      map[linkedTherapist.id] = {
        therapistUserId: linkedTherapist.id,
        name: linkedTherapist.name,
        image: linkedTherapist.image,
        lastMessage: null,
        lastAtRaw: null,
        unread: 0,
      }
    }
    return Object.values(map)
  })()

  return (
    <>
      <div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
      <section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-brand/70">Messages</p>
            <h1 className="text-[36px] font-extrabold text-[#0f3a2b] max-[640px]:text-[28px]">{`Welcome ${welcomeName}!`}</h1>
          </div>
          <Link to="/patient-profile"
            className="flex items-center gap-2 bg-white border border-black/10 rounded-full px-4 py-3 shadow-sm text-[14px] font-semibold text-[#111] transition-all hover:-translate-y-0.5">
            <Bell size={18} /><span>{welcomeName}</span><ChevronRight size={18} />
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_280px] max-[1280px]:grid-cols-1 items-start">
          <div className="rounded-[30px] border border-black/5 bg-white shadow-sm overflow-hidden"
            style={{ height: 'calc(100vh - 260px)', minHeight: '500px' }}>
            <div className="flex border-b border-black/8 bg-[#f5f7f2] px-3 pt-3 gap-2">
              <button
                type="button"
                onClick={() => setChatTab('therapist')}
                className={`flex-1 rounded-full py-2 text-[13px] font-semibold transition ${
                  chatTab === 'therapist' ? 'bg-[#0f4e34] text-white' : 'text-[#1f5f4a] hover:bg-white'
                }`}
              >
                Therapist
              </button>
              <button
                type="button"
                onClick={() => {
                  setChatTab('benzi')
                  setActiveTherapistId(null)
                }}
                className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full py-2 text-[13px] font-semibold transition ${
                  chatTab === 'benzi' ? 'bg-[#0f4e34] text-white' : 'text-[#1f5f4a] hover:bg-white'
                }`}
              >
                <Sparkles size={14} />
                BENZI AI
              </button>
            </div>
            <div className="flex h-[calc(100%-52px)] min-h-0">

              {chatTab === 'benzi' ? (
                <div className="flex-1 flex flex-col min-w-0 min-h-0">
                  <BenziAiChatWindow />
                </div>
              ) : (
              <>
              {/* Therapist list */}
              <div className={`flex flex-col border-r border-black/8 bg-[#fafaf8] ${activeTherapistId ? 'hidden md:flex md:w-72' : 'w-full md:w-72'}`}>
                <div className="px-4 py-4 border-b border-black/8">
                  <p className="text-[15px] font-semibold text-[#111]">Your Therapist</p>
                  <p className="text-[11px] text-[#7d8b7d] mt-0.5">Chat with your assigned therapist</p>
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
                  {!loading && allTherapists.length === 0 && (
                    <div className="flex flex-col items-center justify-center py-12 px-4 text-center">
                      <MessageCircle size={32} className="text-[#c5d5c8] mb-3" />
                      <p className="text-[13px] font-semibold text-[#556b5b]">No therapist linked yet</p>
                      <p className="text-[11px] text-[#7d8b7d] mt-1">Book an appointment to get connected</p>
                      <Link to="/doctors"
                        className="mt-4 rounded-full bg-[#0f4e34] text-white px-4 py-2 text-[12px] font-semibold hover:bg-[#0d4530] transition">
                        Find a Therapist
                      </Link>
                    </div>
                  )}
                  {allTherapists.map((t) => (
                    <button key={t.therapistUserId} type="button"
                      onClick={() => handleSelectTherapist(t.therapistUserId)}
                      className={`w-full flex items-center gap-3 px-4 py-3.5 text-left transition border-b border-black/5 hover:bg-[#f0f7f3] ${
                        activeTherapistId === t.therapistUserId ? 'bg-[#e8f3ea]' : ''
                      }`}>
                      <div className="relative flex-shrink-0">
                        {t.image ? (
                          <img src={t.image} alt={t.name} className="h-10 w-10 rounded-full object-cover border border-black/8" />
                        ) : (
                          <div className="h-10 w-10 rounded-full bg-[#e8f3ea] flex items-center justify-center">
                            <User size={14} className="text-[#1f5f4a]" />
                          </div>
                        )}
                        {t.unread > 0 && (
                          <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#0f4e34] text-white text-[9px] font-bold flex items-center justify-center">
                            {t.unread > 9 ? '9+' : t.unread}
                          </span>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-1">
                          <p className={`text-[13px] truncate ${t.unread > 0 ? 'font-bold text-[#111]' : 'font-semibold text-[#1a2e22]'}`}>
                            {t.name}
                          </p>
                          <span className="text-[10px] text-[#9aaa9a] flex-shrink-0">{timeAgo(t.lastAtRaw)}</span>
                        </div>
                        <p className={`text-[11px] truncate mt-0.5 ${t.unread > 0 ? 'text-[#1f5f4a] font-medium' : 'text-[#7d8b7d]'}`}>
                          {t.lastSenderRole === 'patient' ? 'You: ' : ''}{t.lastMessage || 'Start a conversation'}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>

              {/* Chat window */}
              <div className={`flex-1 flex flex-col min-w-0 ${!activeTherapistId ? 'hidden md:flex' : 'flex'}`}>
                {activeTherapistId && activeTherapistInfo ? (
                  <ChatWindow
                    therapistUserId={activeTherapistId}
                    patientUserId={user?.id}
                    otherName={activeTherapistInfo.name}
                    otherImage={activeTherapistInfo.image}
                    otherIsAnonymous={false}
                    myRole="patient"
                    onBack={() => setActiveTherapistId(null)}
                  />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full text-center px-8">
                    <div className="h-16 w-16 rounded-full bg-[#e8f3ea] flex items-center justify-center mb-4">
                      <MessageCircle size={28} className="text-[#1f5f4a]" />
                    </div>
                    <p className="text-[16px] font-semibold text-[#111]">Your messages</p>
                    <p className="text-[13px] text-[#7d8b7d] mt-2">Select your therapist to start chatting</p>
                  </div>
                )}
              </div>
              </>
              )}
            </div>
          </div>

          <PatientSidebar activeItem="Messages" />
        </div>
      </section>
    </>
  )
}
