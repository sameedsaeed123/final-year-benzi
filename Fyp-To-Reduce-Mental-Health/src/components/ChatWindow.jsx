import { useState, useEffect, useRef, useCallback } from 'react'
import { User, EyeOff } from 'lucide-react'
import { api } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useSocket } from '../context/SocketContext.jsx'
import { groupMessagesByDay } from '../lib/chatFormat.js'
import ChatMessageRow, { ChatDayDivider } from './ChatMessageRow.jsx'
import ChatComposer from './ChatComposer.jsx'
import ChatPanelHeader from './ChatPanelHeader.jsx'

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
  myRole,
  onBack,
}) {
  const { user } = useAuth()
  const { getSocket } = useSocket()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [otherTyping, setOtherTyping] = useState(false)
  const listRef = useRef(null)
  const stickToBottomRef = useRef(true)
  const typingTimerRef = useRef(null)
  const isTypingRef = useRef(false)

  const scrollToBottom = useCallback((behavior = 'smooth') => {
    const el = listRef.current
    if (el) el.scrollTo({ top: el.scrollHeight, behavior })
  }, [])

  const handleListScroll = useCallback(() => {
    const el = listRef.current
    if (!el) return
    const distanceFromBottom = el.scrollHeight - el.scrollTop - el.clientHeight
    stickToBottomRef.current = distanceFromBottom < 120
  }, [])

  const messagesEndpoint = myRole === 'therapist'
    ? `/chat/therapist/messages/${patientUserId}`
    : `/chat/patient/messages/${therapistUserId}`

  const readEndpoint = myRole === 'therapist'
    ? `/chat/therapist/read/${patientUserId}`
    : `/chat/patient/read/${therapistUserId}`

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

  useEffect(() => {
    void api(readEndpoint, { method: 'PATCH', silent: true }).catch(() => {})
  }, [readEndpoint])

  useEffect(() => {
    if (stickToBottomRef.current) scrollToBottom('smooth')
  }, [messages, otherTyping, scrollToBottom])

  useEffect(() => {
    if (!loading) scrollToBottom('auto')
  }, [loading, scrollToBottom])

  useEffect(() => {
    const socket = getSocket()
    if (!socket) return

    socket.emit('join_room', { therapistUserId, patientUserId })

    const onNewMessage = (msg) => {
      setMessages((prev) => {
        if (prev.some((m) => m.id === msg.id)) return prev
        return [...prev, msg]
      })
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

    clearTimeout(typingTimerRef.current)
    isTypingRef.current = false
    emitTyping(false)
    stickToBottomRef.current = true

    const socket = getSocket()
    if (socket?.connected) {
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
  }

  const grouped = groupMessagesByDay(messages)

  const otherAvatarEl = (
    <div className="relative flex-shrink-0">
      {otherImage ? (
        <img src={otherImage} alt="" className="h-10 w-10 rounded-full object-cover border border-black/8" />
      ) : (
        <div className="h-10 w-10 rounded-full bg-[#e8f3ea] flex items-center justify-center">
          {otherIsAnonymous ? <EyeOff size={16} className="text-[#1f5f4a]" /> : <User size={16} className="text-[#1f5f4a]" />}
        </div>
      )}
      <span className="absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full bg-green-400 border-2 border-white" />
    </div>
  )

  const listAvatar = otherImage ? (
    <img src={otherImage} alt="" className="h-7 w-7 rounded-full object-cover flex-shrink-0 mb-1" />
  ) : (
    <div className="h-7 w-7 rounded-full bg-[#e8f3ea] flex items-center justify-center flex-shrink-0 mb-1">
      {otherIsAnonymous ? <EyeOff size={11} className="text-[#1f5f4a]" /> : <User size={11} className="text-[#1f5f4a]" />}
    </div>
  )

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#f8faf8]">
      <ChatPanelHeader
        onBack={onBack}
        title={otherName}
        status={otherTyping ? <span className="text-[#1f5f4a] font-medium">typing…</span> : 'Online'}
        avatar={otherAvatarEl}
      />

      <div ref={listRef} onScroll={handleListScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {loading && (
          <div className="py-4">
            <TypingIndicator name={otherName} />
          </div>
        )}

        {!loading && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 text-center px-6">
            <div className="h-14 w-14 rounded-full bg-[#e8f3ea] flex items-center justify-center mb-4">
              <User size={24} className="text-[#1f5f4a]" />
            </div>
            <p className="text-[14px] font-semibold text-[#111]">Start the conversation</p>
            <p className="text-[12px] text-[#7d8b7d] mt-1">Send a message to {otherName}</p>
          </div>
        )}

        {grouped.map((item, idx) => {
          if (item.type === 'day') {
            return <ChatDayDivider key={`day-${idx}`} label={item.label} />
          }

          const isMe = item.senderUserId === user?.id || item.senderRole === myRole
          return (
            <ChatMessageRow
              key={item.id}
              isMe={isMe}
              text={item.text}
              createdAt={item.createdAt}
              avatar={!isMe ? listAvatar : null}
            />
          )
        })}

        {(otherTyping || sending) && <TypingIndicator name={otherName} />}
      </div>

      <ChatComposer
        value={text}
        onChange={handleInputChange}
        onSend={() => void handleSend()}
        placeholder="Type a message…"
        disabled={sending}
      />
    </div>
  )
}
