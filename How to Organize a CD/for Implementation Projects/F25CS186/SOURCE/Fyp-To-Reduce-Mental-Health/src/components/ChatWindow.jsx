import { useState, useEffect, useRef, useCallback } from 'react'
import { User, EyeOff } from 'lucide-react'
import { api, apiForm } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import { useSocket } from '../context/SocketContext.jsx'
import { groupMessagesByDay } from '../lib/chatFormat.js'
import ChatMessageRow, { ChatDayDivider } from './ChatMessageRow.jsx'
import ChatComposer from './ChatComposer.jsx'
import ChatPanelHeader from './ChatPanelHeader.jsx'
import ChatTypingIndicator from './ChatTypingIndicator.jsx'
import ChatAvatar from './ChatAvatar.jsx'

function messageFingerprint(msg) {
  const att = msg.attachment
  if (att?.url) return `att:${att.url}`
  return `txt:${msg.text || ''}`
}

function mergeIncomingMessage(prev, msg, myUserId, replaceTempId = null) {
  if (prev.some((m) => m.id === msg.id)) {
    return prev.map((m) => (m.id === msg.id ? { ...m, ...msg } : m))
  }

  const withoutDupTemps = prev.filter((m) => {
    if (replaceTempId && m.id === replaceTempId) return false
    if (!String(m.id).startsWith('temp-')) return true
    if (String(msg.senderUserId) !== String(myUserId)) return true

    if (messageFingerprint(m) === messageFingerprint(msg)) return false

    if (
      msg.attachment?.url &&
      m.attachment?.type &&
      m.attachment.type === msg.attachment.type
    ) {
      return false
    }

    return true
  })

  return [...withoutDupTemps, msg]
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
  const { getSocket, connected } = useSocket()
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [otherTyping, setOtherTyping] = useState(false)
  const [editingMessage, setEditingMessage] = useState(null)
  const [actionError, setActionError] = useState('')
  const listRef = useRef(null)
  const stickToBottomRef = useRef(true)
  const typingTimerRef = useRef(null)
  const isTypingRef = useRef(false)
  const typingClearTimerRef = useRef(null)
  const pendingUploadTempRef = useRef(null)

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

  const messageActionBase = myRole === 'therapist'
    ? `/chat/therapist/messages/${patientUserId}`
    : `/chat/patient/messages/${therapistUserId}`

  const loadMessages = useCallback(async () => {
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
    setLoading(true)
    setMessages([])
    setOtherTyping(false)
    setUploadError('')
    setEditingMessage(null)
    setActionError('')
    void loadMessages()
  }, [loadMessages, therapistUserId, patientUserId])

  useEffect(() => {
    void api(readEndpoint, { method: 'PATCH', silent: true }).catch(() => {})
  }, [readEndpoint])

  useEffect(() => {
    if (stickToBottomRef.current) scrollToBottom(otherTyping ? 'smooth' : 'auto')
  }, [messages, otherTyping, scrollToBottom])

  useEffect(() => {
    if (!loading) scrollToBottom('auto')
  }, [loading, scrollToBottom])

  useEffect(() => {
    const socket = getSocket()
    if (!socket || !connected || !therapistUserId || !patientUserId) return

    const joinRoom = () => {
      socket.emit('join_room', { therapistUserId, patientUserId })
      socket.emit('mark_read', { therapistUserId, patientUserId })
    }

    joinRoom()

    const onNewMessage = (msg) => {
      const replaceTempId =
        String(msg.senderUserId) === String(user?.id) ? pendingUploadTempRef.current : null
      if (replaceTempId) pendingUploadTempRef.current = null

      setMessages((prev) => mergeIncomingMessage(prev, msg, user?.id, replaceTempId))
      setOtherTyping(false)
      void api(readEndpoint, { method: 'PATCH', silent: true }).catch(() => {})
      requestAnimationFrame(() => {
        if (stickToBottomRef.current) scrollToBottom('smooth')
      })
    }

    const onTyping = ({ senderRole, isTyping }) => {
      if (senderRole === myRole) return
      clearTimeout(typingClearTimerRef.current)
      setOtherTyping(!!isTyping)
      if (isTyping) {
        typingClearTimerRef.current = setTimeout(() => setOtherTyping(false), 2500)
      }
    }

    const onMessageUpdated = (msg) => {
      setMessages((prev) => mergeIncomingMessage(prev, msg, user?.id))
    }

    socket.on('connect', joinRoom)
    socket.on('new_message', onNewMessage)
    socket.on('message_updated', onMessageUpdated)
    socket.on('typing', onTyping)

    return () => {
      socket.off('connect', joinRoom)
      socket.off('new_message', onNewMessage)
      socket.off('message_updated', onMessageUpdated)
      socket.off('typing', onTyping)
      clearTimeout(typingClearTimerRef.current)
    }
  }, [
    getSocket,
    connected,
    therapistUserId,
    patientUserId,
    myRole,
    readEndpoint,
    user?.id,
    scrollToBottom,
  ])

  const emitTyping = useCallback((isTyping) => {
    const socket = getSocket()
    if (!socket?.connected) return
    socket.emit('typing', { therapistUserId, patientUserId, isTyping })
  }, [getSocket, therapistUserId, patientUserId])

  const handleInputChange = (e) => {
    setText(e.target.value)
    setUploadError('')
    if (!isTypingRef.current) {
      isTypingRef.current = true
      emitTyping(true)
    }
    clearTimeout(typingTimerRef.current)
    typingTimerRef.current = setTimeout(() => {
      isTypingRef.current = false
      emitTyping(false)
    }, 1200)
  }

  const sendWithAttachment = async (file, caption = '') => {
    if (!file || uploading) return

    clearTimeout(typingTimerRef.current)
    isTypingRef.current = false
    emitTyping(false)
    stickToBottomRef.current = true
    setUploadError('')
    setUploading(true)

    const tempId = `temp-${Date.now()}`
    pendingUploadTempRef.current = tempId
    const previewUrl =
      file.type.startsWith('image/') || file.type.startsWith('audio/')
        ? URL.createObjectURL(file)
        : ''
    const optimistic = {
      id: tempId,
      senderUserId: user.id,
      senderRole: myRole,
      text: caption,
      attachment: {
        type: file.type.startsWith('image/')
          ? 'image'
          : file.type === 'application/pdf'
            ? 'pdf'
            : file.type.startsWith('video/')
              ? 'video'
              : 'audio',
        url: previewUrl || '',
        name: file.name,
        mimeType: file.type,
        size: file.size,
      },
      createdAt: new Date().toISOString(),
      readAt: null,
    }
    setMessages((prev) => [...prev, optimistic])
    setText('')
    requestAnimationFrame(() => scrollToBottom('smooth'))

    try {
      const fd = new FormData()
      fd.append('file', file)
      if (caption) fd.append('text', caption)

      const json = await apiForm(messagesEndpoint, fd, { silent: true })
      pendingUploadTempRef.current = null
      setMessages((prev) => mergeIncomingMessage(prev, json.data.message, user?.id, tempId))
    } catch (e) {
      pendingUploadTempRef.current = null
      setMessages((prev) => prev.filter((m) => m.id !== tempId))
      if (e.body?.code === 'IMAGE_BLOCKED' || e.message?.includes('explicit')) {
        setUploadError('This image was blocked — explicit or sexual content is not allowed in therapy chat.')
      } else {
        setUploadError(e.message || 'Could not send attachment. Please try again.')
      }
    } finally {
      if (previewUrl) URL.revokeObjectURL(previewUrl)
      setUploading(false)
    }
  }

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending || uploading) return

    if (editingMessage) {
      setSending(true)
      setActionError('')
      try {
        const json = await api(`${messageActionBase}/${editingMessage.id}`, {
          method: 'PATCH',
          silent: true,
          body: JSON.stringify({ text: trimmed }),
        })
        setMessages((prev) => mergeIncomingMessage(prev, json.data.message, user?.id))
        setText('')
        setEditingMessage(null)
      } catch (e) {
        setActionError(e.message || 'Could not edit message')
      } finally {
        setSending(false)
      }
      return
    }

    clearTimeout(typingTimerRef.current)
    isTypingRef.current = false
    emitTyping(false)
    stickToBottomRef.current = true
    setUploadError('')

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
      requestAnimationFrame(() => scrollToBottom('smooth'))
    } else {
      setSending(true)
      try {
        const json = await api(messagesEndpoint, {
          method: 'POST',
          silent: true,
          body: JSON.stringify({ text: trimmed }),
        })
        setMessages((prev) => mergeIncomingMessage(prev, json.data.message, user?.id))
        setText('')
      } catch {
        // ignore
      } finally {
        setSending(false)
      }
    }
  }

  const handleStartEdit = (msg) => {
    setEditingMessage(msg)
    setText(msg.text || '')
    setActionError('')
  }

  const handleCancelEdit = () => {
    setEditingMessage(null)
    setText('')
    setActionError('')
  }

  const handleDeleteMessage = async (msg) => {
    if (!window.confirm('Delete this message for everyone?')) return
    setActionError('')
    try {
      const json = await api(`${messageActionBase}/${msg.id}`, { method: 'DELETE', silent: true })
      setMessages((prev) => mergeIncomingMessage(prev, json.data.message, user?.id))
      if (editingMessage?.id === msg.id) handleCancelEdit()
    } catch (e) {
      setActionError(e.message || 'Could not delete message')
    }
  }

  const handleReactMessage = async (msg, emoji) => {
    setActionError('')
    try {
      const json = await api(`${messageActionBase}/${msg.id}/reaction`, {
        method: 'PATCH',
        silent: true,
        body: JSON.stringify({ emoji }),
      })
      setMessages((prev) => mergeIncomingMessage(prev, json.data.message, user?.id))
    } catch (e) {
      setActionError(e.message || 'Could not react to message')
    }
  }

  const grouped = groupMessagesByDay(messages)

  const otherAvatarEl = (
    <div className="relative flex-shrink-0">
      {otherIsAnonymous ? (
        <div className="h-10 w-10 rounded-full bg-[#e8f3ea] flex items-center justify-center">
          <EyeOff size={16} className="text-[#1f5f4a]" />
        </div>
      ) : (
        <ChatAvatar
          src={otherImage}
          alt={otherName}
          className="h-10 w-10 rounded-full object-cover border border-black/8"
        />
      )}
      <span
        className={`absolute bottom-0 right-0 h-2.5 w-2.5 rounded-full border-2 border-white ${
          connected ? 'bg-green-400' : 'bg-amber-400'
        }`}
      />
    </div>
  )

  const listAvatar = otherIsAnonymous ? (
    <div className="h-7 w-7 rounded-full bg-[#e8f3ea] flex items-center justify-center flex-shrink-0 mb-1">
      <EyeOff size={11} className="text-[#1f5f4a]" />
    </div>
  ) : (
    <ChatAvatar
      src={otherImage}
      alt={otherName}
      className="h-7 w-7 rounded-full object-cover flex-shrink-0 mb-1"
    />
  )

  const headerStatus = otherTyping ? (
    <span className="text-[#1f5f4a] font-medium animate-pulse">typing…</span>
  ) : connected ? (
    'Online'
  ) : (
    <span className="text-amber-600">Connecting…</span>
  )

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#f8faf8]">
      <ChatPanelHeader
        onBack={onBack}
        title={otherName}
        status={headerStatus}
        avatar={otherAvatarEl}
      />

      <div ref={listRef} onScroll={handleListScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {loading && (
          <div className="py-4">
            <ChatTypingIndicator label={`Loading chat with ${otherName}…`} />
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
          const isPending = String(item.id).startsWith('temp-')
          return (
            <ChatMessageRow
              key={item.id}
              messageId={item.id}
              isMe={isMe}
              senderUserId={item.senderUserId}
              text={item.text}
              attachment={item.attachment}
              reactions={item.reactions || []}
              editedAt={item.editedAt}
              isDeleted={item.isDeleted}
              createdAt={item.createdAt}
              avatar={!isMe ? listAvatar : null}
              className={isPending ? 'opacity-80' : undefined}
              myUserId={user?.id}
              onEdit={() => handleStartEdit(item)}
              onDelete={() => void handleDeleteMessage(item)}
              onReact={(emoji) => void handleReactMessage(item, emoji)}
            />
          )
        })}

        {otherTyping && <ChatTypingIndicator label={`${otherName} is typing`} />}
      </div>

      {(uploadError || actionError) && (
        <p className="px-4 py-2 text-[12px] text-red-700 bg-red-50 border-t border-red-100">
          {uploadError || actionError}
        </p>
      )}

      <ChatComposer
        value={text}
        onChange={handleInputChange}
        onSend={() => void handleSend()}
        onSendFile={(file, caption) => void sendWithAttachment(file, caption)}
        onSendVoice={(file) => void sendWithAttachment(file, '')}
        allowAttachments={!editingMessage}
        editing={!!editingMessage}
        onCancelEdit={handleCancelEdit}
        placeholder="Type a message…"
        disabled={sending}
        uploading={uploading}
        uploadError=""
      />
    </div>
  )
}
