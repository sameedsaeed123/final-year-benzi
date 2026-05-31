import { useState, useEffect, useRef, useCallback } from 'react'
import { Sparkles } from 'lucide-react'
import { api } from '../lib/api.js'
import { sanitizeChatReply } from '../lib/textSanitize.js'
import { groupMessagesByDay } from '../lib/chatFormat.js'
import ChatTypingIndicator from './ChatTypingIndicator.jsx'
import ChatMessageRow, { ChatDayDivider } from './ChatMessageRow.jsx'
import ChatComposer from './ChatComposer.jsx'
import ChatPanelHeader from './ChatPanelHeader.jsx'

function AiAvatar() {
  return (
    <div className="h-7 w-7 rounded-full bg-[#0f4e34] flex items-center justify-center flex-shrink-0 mb-1 text-white">
      <Sparkles size={12} />
    </div>
  )
}

export default function BenziAiChatWindow() {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const listRef = useRef(null)
  const stickToBottomRef = useRef(true)

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

  const loadHistory = useCallback(async () => {
    try {
      const json = await api('/ai/chat/history', { method: 'GET', silent: true })
      setMessages(json.data?.messages || [])
      setError('')
    } catch (e) {
      setError(e.message || 'Could not load chat history')
    } finally {
      setLoadingHistory(false)
    }
  }, [])

  useEffect(() => {
    void loadHistory()
  }, [loadHistory])

  useEffect(() => {
    if (stickToBottomRef.current) scrollToBottom('smooth')
  }, [messages, sending, scrollToBottom])

  useEffect(() => {
    if (!loadingHistory) scrollToBottom('auto')
  }, [loadingHistory, scrollToBottom])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    const optimistic = {
      _id: `tmp-${Date.now()}`,
      sender: 'patient',
      text: trimmed,
      createdAt: new Date().toISOString(),
    }
    stickToBottomRef.current = true
    setMessages((prev) => [...prev, optimistic])
    setText('')
    setSending(true)
    setError('')

    try {
      const json = await api('/ai/chat', {
        method: 'POST',
        body: JSON.stringify({ text: trimmed }),
        silent: true,
      })
      const reply = json.data?.reply
      if (reply) {
        setMessages((prev) => [
          ...prev.filter((m) => m._id !== optimistic._id),
          { ...optimistic, _id: optimistic._id },
          {
            _id: `ai-${Date.now()}`,
            sender: 'ai',
            text: reply,
            createdAt: new Date().toISOString(),
          },
        ])
      } else {
        await loadHistory()
      }
    } catch (e) {
      setError(e.message || 'AI chat failed. Check OpenRouter credits or API key.')
      setMessages((prev) => prev.filter((m) => m._id !== optimistic._id))
      setText(trimmed)
    } finally {
      setSending(false)
    }
  }

  const grouped = groupMessagesByDay(messages)

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#f8faf8]">
      <ChatPanelHeader
        title="BENZI AI"
        subtitle="Supports your therapy — not a replacement for your therapist"
        avatar={
          <div className="h-10 w-10 rounded-full bg-[#0f4e34] flex items-center justify-center text-white flex-shrink-0">
            <Sparkles size={18} />
          </div>
        }
      />

      <div ref={listRef} onScroll={handleListScroll} className="flex-1 overflow-y-auto px-4 py-4 space-y-3 min-h-0">
        {loadingHistory && (
          <div className="py-4">
            <ChatTypingIndicator variant="ai" label="Loading conversation…" />
          </div>
        )}

        {!loadingHistory && messages.length === 0 && (
          <div className="flex flex-col items-center justify-center py-14 px-6 text-center">
            <div className="h-14 w-14 rounded-full bg-[#e8f3ea] flex items-center justify-center mb-4">
              <Sparkles size={24} className="text-[#1f5f4a]" />
            </div>
            <p className="text-[14px] font-semibold text-[#111]">Chat with BENZI</p>
            <p className="text-[12px] text-[#7d8b7d] mt-2 max-w-sm leading-relaxed">
              Ask about your reports in plain language. For diagnosis, meds, or big decisions — talk to your therapist.
            </p>
          </div>
        )}

        {!loadingHistory &&
          grouped.map((item, idx) => {
            if (item.type === 'day') {
              return <ChatDayDivider key={`day-${idx}`} label={item.label} />
            }
            const isPatient = item.sender === 'patient'
            const body = isPatient ? item.text : sanitizeChatReply(item.text)
            return (
              <ChatMessageRow
                key={item._id}
                isMe={isPatient}
                text={body}
                createdAt={item.createdAt}
                avatar={!isPatient ? <AiAvatar /> : null}
              />
            )
          })}

        {sending && <ChatTypingIndicator variant="ai" label="BENZI is typing" />}
      </div>

      {error && (
        <p className="px-4 py-2 text-[12px] text-red-700 bg-red-50 border-t border-red-100">{error}</p>
      )}

      <ChatComposer
        value={text}
        onChange={(e) => setText(e.target.value)}
        onSend={() => void handleSend()}
        placeholder="Message BENZI AI…"
        disabled={sending}
      />
    </div>
  )
}
