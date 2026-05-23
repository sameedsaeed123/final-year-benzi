import { useState, useEffect, useRef, useCallback } from 'react'
import { Send, Sparkles } from 'lucide-react'
import { api } from '../lib/api.js'
import { sanitizeChatReply } from '../lib/textSanitize.js'
import ChatTypingIndicator from './ChatTypingIndicator.jsx'

function formatTime(d) {
  if (!d) return ''
  return new Date(d).toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true })
}

export default function BenziAiChatWindow() {
  const [messages, setMessages] = useState([])
  const [text, setText] = useState('')
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [sending, setSending] = useState(false)
  const [error, setError] = useState('')
  const bottomRef = useRef(null)

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
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, sending])

  const handleSend = async () => {
    const trimmed = text.trim()
    if (!trimmed || sending) return

    const optimistic = {
      _id: `tmp-${Date.now()}`,
      sender: 'patient',
      text: trimmed,
      createdAt: new Date().toISOString(),
    }
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

  return (
    <div className="flex flex-col h-full min-h-0 bg-[#fafaf8]">
      <div className="flex items-center gap-3 px-4 py-3 border-b border-black/8 bg-white">
        <div className="h-10 w-10 rounded-full bg-[#0f4e34] flex items-center justify-center text-white">
          <Sparkles size={18} />
        </div>
        <div>
          <p className="text-[15px] font-semibold text-[#111]">BENZI AI</p>
          <p className="text-[11px] text-[#7d8b7d]">Supports your therapy — not a replacement for your therapist</p>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 min-h-0">
        {loadingHistory && (
          <div className="py-6">
            <ChatTypingIndicator variant="ai" label="Loading conversation…" />
          </div>
        )}
        {!loadingHistory && messages.length === 0 && (
          <div className="text-center py-10 px-6">
            <Sparkles size={32} className="mx-auto text-[#1f5f4a] mb-3" />
            <p className="text-[14px] font-semibold text-[#111]">Chat with BENZI</p>
            <p className="text-[12px] text-[#7d8b7d] mt-2 leading-relaxed">
              Ask about your reports in plain language. For diagnosis, meds, or big decisions — talk to your therapist; BENZI won't guess.
            </p>
          </div>
        )}
        {!loadingHistory &&
          messages.map((msg) => {
            const isPatient = msg.sender === 'patient'
            return (
              <div key={msg._id} className={`flex ${isPatient ? 'justify-end' : 'justify-start'}`}>
                <div
                  className={`max-w-[85%] rounded-[18px] px-4 py-2.5 text-[13px] leading-relaxed shadow-sm ${
                    isPatient
                      ? 'bg-[#0f4e34] text-white rounded-br-[4px]'
                      : 'bg-white border border-black/8 text-[#2a3d32] rounded-bl-[4px]'
                  }`}
                >
                  <p className="whitespace-pre-wrap">{isPatient ? msg.text : sanitizeChatReply(msg.text)}</p>
                  <p className={`text-[10px] mt-1 ${isPatient ? 'text-white/70' : 'text-[#9aaa9a]'}`}>
                    {formatTime(msg.createdAt)}
                  </p>
                </div>
              </div>
            )
          })}
        {sending && <ChatTypingIndicator variant="ai" label="BENZI is typing" />}
        <div ref={bottomRef} />
      </div>

      {error && (
        <p className="px-4 py-2 text-[12px] text-red-700 bg-red-50 border-t border-red-100">{error}</p>
      )}

      <div className="flex-shrink-0 p-3 border-t border-black/10 bg-white">
        <div className="flex items-end gap-2">
          <textarea
            rows={1}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter' && !e.shiftKey) {
                e.preventDefault()
                void handleSend()
              }
            }}
            placeholder="Message BENZI AI…"
            disabled={sending}
            className="flex-1 resize-none rounded-2xl border border-black/10 bg-[#f8faf8] px-4 py-2.5 text-[14px] outline-none focus:border-[#0f4e34] focus:ring-2 focus:ring-[#0f4e34]/15 max-h-28 disabled:opacity-60"
          />
          <button
            type="button"
            onClick={() => void handleSend()}
            disabled={sending || !text.trim()}
            className="h-11 w-11 rounded-full bg-[#0f4e34] text-white flex items-center justify-center disabled:opacity-40 hover:bg-[#0d4530] transition"
            aria-label="Send"
          >
            <Send size={18} />
          </button>
        </div>
      </div>
    </div>
  )
}
