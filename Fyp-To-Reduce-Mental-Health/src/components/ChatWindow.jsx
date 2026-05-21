import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, ArrowLeft, User, EyeOff } from 'lucide-react'
import { api } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useSocket } from '../context/SocketContext.jsx'

function formatTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

function formatDay(d) {
  if (!d) return ''
  const date = new Date(d)
  const today = new Date()
  const yesterday = new Date(today)
  yesterday.setDate(yesterday.getDate() - 1)
  if (date.toDateString() === today.toDateString()) return 'Today'
  if (date.toDateString() === yesterday.toDateString()) return 'Yesterday'
  return date.toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
}

// Group messages by day
function groupByDay(messages) {
  const groups = []
  let currentDay = null
  for (const msg of messages) {
    const day = formatDay(msg.createdAt)
    if (day !== currentDay) {
      groups.push({ type: 'day', label: day })
      currentDay = day
    }
    groups.push({ type: 'message', ...msg })
  }
  return groups
}

// Typing dots animation
function TypingIndicator({ name }) {
  return (
    <div className="flex items-end gap-2 justify-start">
      <div className="h-7 w-7 rounded-full bg-[#e8f3ea] flex items-center justify-center flex-shrink-0">
        <User size={12} className="text-[#1f5f4a]" />
      </div>
      <div className="bg-white border border-black/8 rounded-[20px] rounded-bl-[4px] px-4 py-3 shadow-sm">
        <div className="flex items-center gap-1 h-4">
          <span className="w-1.5 h-1.5 rounded-full bg-[#1f5f4a]/60 animate-bounce" style={{ animationDelay: '0ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-[#1f5f4a]/60 animate-bounce" style={{ animationDelay: '150ms' }} />
          <span className="w-1.5 h-1.5 rounded-full bg-[#1f5f4a]/60 animate-bounce" style={{ animationDelay: '300ms' }} />
        </div>
      </div>
    </div>
  )
}

export default function ChatWindow({
  therapistUserId,
  patientUserId,
  otherName,
  otherImage,
  otherIsAnonymous,
  myRole, // 'therapist' | 'patient'
  onBack,
}) {
  const { user } = useAuth()
  const { getSocket } = useSocket()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [otherTyping, setOtherTyping] = useState(false)
  const bottomRef = useRef(null)
  const inputRef = useRef(null)
  const typingTimerRef = useRef(null)
  const isTypingRef = useRef(false)

  const messagesEndpoint = myRole === 'therapist'
    ? `/chat/therapist/messages/${patientUserId}`
    : `/chat/patient/messages/${therapistUserId}`

  const readEndpoint = myRole === 'therapist'
    ? `/chat/therapist/read/${patientUserId}`
    : `/chat/patient/read/${therapistUserId}`

  // Load history
  const loadMessages = useCallback(async () => {
    setLoading(true)
    try {
      const json = await api(messagesEndpoint, { method: 'GET', silent: true })
      setMessages(json.data?.messages || [])
    } catch {
      // ignore
    } finally {
      setLoading(false)
    }
  }, [messagesEndpoint])

  useEffect(() => {
    void loadMessages()
  }, [loadMessages])

  // Mark read on open
  useEffect(() => {
    void api(readEndpoint, { method: 'PATCH', silent: true }).catch(() => {})
  }, [readEndpoint])

  // Scroll to bottom when messages change
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, otherTyping])

  // Socket.IO
  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    socket.emit('join_room', { therapistUserId, patientUserId })

    const onNewMessage = (msg) => {
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
      // Mark read immediately if window is open
      void api(readEndpoint, { method: 'PATCH', silent: true }).catch(() => {})
    }

    const onTyping = ({ senderRole, isTyping }) => {
      if (senderRole !== myRole) setOtherTyping(isTyping)
    }

    socket.on('new_message', onNewMessage)
    socket.on('typing', onTyping)

    return () => {
      socket.off('new_message', onNewMessage)
      socket.off('typing', onTyping)
    }
  }, [getSocket, therapistUserId, patientUserId, myRole, readEndpoint])

  // Typing indicator emit
  const emitTyping = useCallback((isTyping) => {
    const socket = getSocket()
    if (!socket) return
    socket.emit('typing', { therapistUserId, patientUserId, isTyping })
  }, [getSocket, therapistUserId, patientUserId])

  const handleInputChange = (e) => {
    setText(e.target.value)
    if (!isTypingRef.current) {
      isTypingRef.current = true
      emitTyping(true)
    }
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false
      emitTyping(false)
    }, 1500)
  }

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    // Stop typing indicator
    clearTimeout(typingTimerRef.current)
    isTypingRef.current = false
    emitTyping(false)

    const socket = getSocket()
    if (socket?.connected) {
      // Send via socket (optimistic)
      const tempId = `temp-${Date.now()}`
      const optimistic = {
        id: tempId,
        senderUserId: user.id,
        senderRole: myRole,
        text: trimmed,
        createdAt: new Date().toISOString(),
        readAt: null,
      }
      setMessages((prev) => [...prev, optimistic])
      setText('')
      socket.emit('send_message', { therapistUserId, patientUserId, text: trimmed })
    } else {
      // REST fallback
      setSending(true)
      try {
        const endpoint = myRole === 'therapist'
          ? `/chat/therapist/messages/${patientUserId}`
          : `/chat/patient/messages/${therapistUserId}`
        const json = await api(endpoint, {
          method: 'POST',
          silent: true,
          body: JSON.stringify({ text: trimmed }),
        })
        setMessages((prev) => [...prev, json.data.message])
        setText('')
      } catch {
        // ignore
      } finally {
        setSending(false)
      }
    }
    inputRef.current?.focus()
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      void handleSend()
    }
  }

  const grouped = groupByDay(messages)

  return (
    <div className="flex flex-col h-full min-h-0">
      {/* Header */}
      <div className="flex items-center gap-3 px-5 py-4 border-b border-black/8 bg-white rounded-t-[24px] flex-shrink-0">
        {onBack && (
          <button onClick={onBack} className="p-2 rounded-full hover:bg-[#f0f4ee] transition text-[#1f5f4a]">
            <ArrowLeft size={18} />
          </button>
        )}
        <div className="relative">
          {otherImage ? (
            <img src={otherImage} alt={otherName} className="h-10 w-10 rounded-full object-cover border border-black/8" />
          ) : (
            <div className="h-10 w-10 rounded-full bg-[#e8f3ea] flex items-center justify-center">
              {otherIsAnonymous ? <EyeOff size={16} className="text-[#1f5f4a]" /> : <User size={16} className="text-[#1f5f4a]" />}
            </div>
          )}
          <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-white" />
        </div>
        <div>
          <p className="text-[14px] font-semibold text-[#111]">{otherName}</p>
          <p className="text-[11px] text-[#7d8b7d]">
            {otherTyping ? (
              <span className="text-[#1f5f4a] font-medium">typing…</span>
            ) : 'Online'}
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3 bg-[#f8faf8] min-h-0">
        {loading && (
          <div className="py-4">
            <TypingIndicator name={otherName} />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-16 text-center">
            <div className="h-14 w-14 rounded-full bg-[#e8f3ea] flex items-center justify-center mb-4">
              <User size={24} className="text-[#1f5f4a]" />
            </div>
            <p className="text-[14px] font-semibold text-[#111]">Start the conversation</p>
            <p className="text-[12px] text-[#7d8b7d] mt-1">Send a message to {otherName}</p>
          </div>
        )}

        {grouped.map((item, idx) => {
          if (item.type === 'day') {
            return (
              <div key={`day-${idx}`} className="flex items-center gap-3 py-2">
                <div className="flex-1 h-px bg-black/8" />
                <span className="text-[11px] text-[#7d8b7d] font-medium px-2">{item.label}</span>
                <div className="flex-1 h-px bg-black/8" />
              </div>
            )
          }

          const isMe = item.senderUserId === user?.id || item.senderRole === myRole
          return (
            <div
              key={item.id}
              className={`flex items-end gap-2 ${isMe ? 'justify-end' : 'justify-start'}`}
              style={{ animation: 'fadeSlideIn 0.2s ease-out' }}
            >
              {!isMe && (
                <div className="h-7 w-7 rounded-full bg-[#e8f3ea] flex items-center justify-center flex-shrink-0 mb-1">
                  {otherImage ? (
                    <img src={otherImage} alt="" className="h-7 w-7 rounded-full object-cover" />
                  ) : otherIsAnonymous ? (
                    <EyeOff size={11} className="text-[#1f5f4a]" />
                  ) : (
                    <User size={11} className="text-[#1f5f4a]" />
                  )}
                </div>
              )}
              <div className={`max-w-[72%] ${isMe ? 'items-end' : 'items-start'} flex flex-col gap-1`}>
                <div
                  className={`px-4 py-2.5 text-[13px] leading-5 shadow-sm ${
                    isMe
                      ? 'bg-[#0f4e34] text-white rounded-[20px] rounded-br-[4px]'
                      : 'bg-white text-[#1a2e22] border border-black/8 rounded-[20px] rounded-bl-[4px]'
                  }`}
                >
                  {item.text}
                </div>
                <span className="text-[10px] text-[#9aaa9a] px-1">{formatTime(item.createdAt)}</span>
              </div>
            </div>
          )
        })}

        {(otherTyping || sending) && <TypingIndicator name={otherName} />}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div className="flex-shrink-0 px-4 py-3 bg-white border-t border-black/8 rounded-b-[24px]">
        <div className="flex items-center gap-2">
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            placeholder="Type a message…"
            className="flex-1 rounded-full border border-black/10 bg-[#f5f9f5] px-5 py-2.5 text-[13px] text-[#1a2e22] outline-none focus:border-[#0f4e34] focus:ring-2 focus:ring-[#0f4e34]/15 transition"
          />
          <button
            onClick={handleSend}
            disabled={!text.trim() || sending}
            className="h-10 w-10 rounded-full bg-[#0f4e34] text-white flex items-center justify-center shadow-sm hover:bg-[#0d4530] transition disabled:opacity-40 disabled:cursor-not-allowed flex-shrink-0"
          >
            <Send size={15} />
          </button>
        </div>
      </div>
    </div>
  )
}
