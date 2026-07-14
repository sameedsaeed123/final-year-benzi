import { useState, useEffect, useCallback } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { Bell, ChevronRight, MessageCircle, Sparkles } from 'lucide-react'
import PatientSidebar from '../../components/PatientSidebar'
import ChatWindow from '../../components/ChatWindow'
import ChatAvatar from '../../components/ChatAvatar'
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
  const [linkedTherapists, setLinkedTherapists] = useState([])
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
      const therapists = linkedJson.data?.therapists?.length
        ? linkedJson.data.therapists
        : linkedJson.data?.therapist
          ? [linkedJson.data.therapist]
          : []
      setLinkedTherapists(therapists)
      if (!activeTherapistId && therapists.length === 1) {
        setActiveTherapistId(therapists[0].id)
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

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return
    const onNew = () => void loadData()
    socket.on('new_message', onNew)
    return () => socket.off('new_message', onNew)
  }, [getSocket, loadData])

  // Sync URL with active tab + therapist
  useEffect(() => {
    if (chatTab === 'benzi') {
      setSearchParams({ tab: 'benzi' }, { replace: true })
      return
    }
    if (activeTherapistId) {
      setSearchParams({ therapistId: activeTherapistId }, { replace: true })
    } else {
      setSearchParams({}, { replace: true })
    }
  }, [chatTab, activeTherapistId, setSearchParams])

  const handleSelectTherapist = (therapistId) => {
    setActiveTherapistId(therapistId)
    void api(`/chat/patient/read/${therapistId}`, { method: 'PATCH', silent: true }).catch(() => {})
    api('/chat/unread', { method: 'GET', silent: true }).then((j) => setUnread(j.data?.unread || 0)).catch(() => {})
    void loadData()
  }

  // Build the therapist info for the active chat
  const activeConv = conversations.find((c) => c.therapistUserId === activeTherapistId)
  const linkedMatch = linkedTherapists.find((t) => t.id === activeTherapistId)
  const activeTherapistInfo = activeConv || (linkedMatch ? {
    therapistUserId: linkedMatch.id,
    name: linkedMatch.name,
    image: linkedMatch.image,
  } : null)

  const allTherapists = (() => {
    const map = {}
    conversations.forEach((c) => { map[c.therapistUserId] = c })
    linkedTherapists.forEach((t) => {
      if (!map[t.id]) {
        map[t.id] = {
          therapistUserId: t.id,
          name: t.name,
          image: t.image,
          lastMessage: null,
          lastAtRaw: null,
          unread: 0,
        }
      }
    })
    return Object.values(map)
  })()

  return (
    <>
      <div className="pt-4" />
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

        <div className="portal-layout">
          <div
            className="rounded-[30px] border border-black/5 bg-white shadow-sm overflow-hidden flex flex-col"
            style={{ height: 'calc(100vh - 260px)', minHeight: '520px', maxHeight: 'calc(100dvh - 200px)' }}
          >
            <div className="flex-shrink-0 px-4 pt-4 pb-3 border-b border-black/6 bg-[#f5f7f2]">
              <div
                className="flex rounded-full p-1 bg-[#e4ebe4] border border-black/6"
                role="tablist"
                aria-label="Message type"
              >
                <button
                  type="button"
                  role="tab"
                  aria-selected={chatTab === 'therapist'}
                  onClick={() => setChatTab('therapist')}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-semibold transition ${
                    chatTab === 'therapist'
                      ? 'bg-white text-[#0f4e34] shadow-sm'
                      : 'text-[#3d5c4d] hover:text-[#0f4e34]'
                  }`}
                >
                  <MessageCircle size={15} aria-hidden />
                  Therapist
                </button>
                <button
                  type="button"
                  role="tab"
                  aria-selected={chatTab === 'benzi'}
                  onClick={() => {
                    setChatTab('benzi')
                    setActiveTherapistId(null)
                  }}
                  className={`flex-1 inline-flex items-center justify-center gap-1.5 rounded-full py-2.5 text-[13px] font-semibold transition ${
                    chatTab === 'benzi'
                      ? 'bg-white text-[#0f4e34] shadow-sm'
                      : 'text-[#3d5c4d] hover:text-[#0f4e34]'
                  }`}
                >
                  <Sparkles size={15} aria-hidden />
                  BENZI AI
                </button>
              </div>
            </div>
            <div className="flex flex-1 min-h-0 overflow-hidden">

              {chatTab === 'benzi' ? (
                <div className="flex-1 flex flex-col min-w-0 min-h-0 h-full overflow-hidden">
                  <BenziAiChatWindow />
                </div>
              ) : (
              <>
              {/* Therapist list */}
              <div className={`flex flex-col border-r border-black/8 bg-[#f8faf8] ${activeTherapistId ? 'hidden md:flex md:w-72' : 'w-full md:w-72'}`}>
                <div className="px-4 py-4 border-b border-black/8">
                  <p className="text-[15px] font-semibold text-[#111]">Your Therapists</p>
                  <p className="text-[11px] text-[#7d8b7d] mt-0.5">Chat with any doctor you have booked</p>
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
                        <ChatAvatar
                          src={t.image}
                          alt={t.name}
                          className="h-10 w-10 rounded-full object-cover border border-black/8"
                        />
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
                    <p className="text-[13px] text-[#7d8b7d] mt-2">Select a therapist to start chatting</p>
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
