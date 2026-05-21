import { Link } from 'react-router-dom'
import { Bell, ChevronRight, Image, Mic, Plus, Search, Sparkles, User } from 'lucide-react'
import PatientSidebar from '../../components/PatientSidebar'
import { useAuth } from '../../context/AuthContext.jsx'
import { displayFirstName } from '../../lib/userDisplay.js'

const conversationThreads = [
  { label: 'New Chat', icon: Plus, active: true },
  { label: 'Search', icon: Search },
  { label: 'Images', icon: Image },
]

const recentMessages = [
  { category: 'Today', label: 'Lorem ipsum is simply...', time: '2 min ago', active: true },
  { category: 'Yesterday', label: 'Lorem ipsum is simply...', time: 'Yesterday', active: false },
  { category: 'Previous', label: 'Lorem ipsum is simply...', time: '2 days ago', active: false },
]

const chatHistory = [
  { sender: 'You', text: 'Hey there!', side: 'left' },
  { sender: 'Benzi', text: "Hi there! I'm here to help. It's great that you reached out. Let's start by exploring what's been on your mind.", side: 'right' },
  { sender: 'You', text: 'Hey there!', side: 'left' },
  { sender: 'Benzi', text: "Hi there! I'm here to help. It's great that you reached out. Let's start by exploring what's been on your mind.", side: 'right' },
  { sender: 'You', text: 'Hey there!', side: 'left' },
  { sender: 'Benzi', text: "Hi there! I'm here to help. It's great that you reached out. Let's start by exploring what's been on your mind.", side: 'right' },
]

export default function PatientConversationPage() {
  const { user } = useAuth()
  const welcomeName = displayFirstName(user)
  return (
    <>
      <div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
      <section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-brand/70">Patient Conversation</p>
            <h1 className="text-[36px] font-extrabold text-[#0f3a2b] max-[640px]:text-[28px]">{`Welcome ${welcomeName}!`}</h1>
          </div>
          <Link
            to="/patient-profile"
            className="flex items-center gap-2 bg-white border border-black/10 rounded-full px-4 py-3 shadow-sm text-[14px] font-semibold text-[#111] transition-all hover:-translate-y-0.5"
          >
            <Bell size={18} />
            <span>{welcomeName}</span>
            <ChevronRight size={18} />
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[280px_1fr_280px] max-[1280px]:grid-cols-1">
          <aside className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm max-w-[280px]">
            <div className="mb-8">
              <div className="flex items-center gap-3 mb-5">
                <div className="h-12 w-12 rounded-3xl bg-[#1f5f4a] text-white flex items-center justify-center text-lg font-bold">B</div>
                <div>
                  <p className="text-[18px] font-semibold text-[#0f3a2b]">Benzi</p>
                  <p className="text-sm text-[#6d7c70]">AI Wellness Chat</p>
                </div>
              </div>
              <div className="space-y-3">
                {conversationThreads.map((thread) => {
                  const Icon = thread.icon
                  return (
                    <button
                      key={thread.label}
                      type="button"
                      className={`flex items-center gap-1 w-full rounded-3xl  text-left text-sm font-semibold transition ${thread.active ? '' : ' text-[#2f4c40] '
                        }`}
                    >
                      <span className="flex h-10 w-10 items-center justify-center ">
                        <Icon size={18} />
                      </span>
                      {thread.label}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="space-y-4">
              {['Today', 'Yesterday', 'Previous'].map((heading) => (
                <div key={heading}>
                  <p className="text-[11px] uppercase tracking-[0.2em] text-[#94a08f] mb-3">{heading}</p>
                  {recentMessages
                    .filter((item) => item.category === heading)
                    .map((item) => (
                      <button
                        key={item.label}
                        type="button"
                        className={`w-full py-4 text-left transition ${item.active ? ' text-black' : ' text-[#23382d] hover:border-brand'
                          }`}
                      >
                        <p className="text-sm font-semibold">{item.label}</p>
                        <p className="mt-2 text-xs text-[#6b7b6a]">{item.time}</p>
                      </button>
                    ))}
                </div>
              ))}
            </div>

            <div className="mt-8">
              <div className="mb-3 text-sm text-[#6d7c70]">Faizyab</div>
              <div className="flex items-center gap-3 rounded-3xl px-4 py-3 shadow-sm">
                <div className="h-10 w-10 rounded-full bg-[#1f5f4a] text-white grid place-items-center text-sm font-semibold">F</div>
                <div>
                  <p className="text-sm font-semibold text-[#0f3a2b]">Faizyab Ahmad</p>
                  <p className="text-xs text-[#6b7b6a]">faizyab@gmail.com</p>
                </div>
              </div>
            </div>
          </aside>

          <main className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
            <div className="rounded-[30px] border border-black/5 bg-[#f8faf8] p-6">
              <div className="space-y-6 overflow-hidden">
                <div className="flex items-center gap-3">
                  <div className="h-8 w-8 rounded-full bg-[#1f5f4a] text-white flex items-center justify-center text-sm font-bold">B</div>
                  <div>
                    <p className="text-sm font-semibold text-[#0f3a2b]">Benzi</p>
                    <p className="text-xs text-[#6b7b6a]">Online</p>
                  </div>
                </div>
                <div className="max-h-[100vh] overflow-y-auto pr-2 space-y-4">
                  {chatHistory.map((message, index) => (
                    <div
                      key={`${message.sender}-${index}`}
                      className={`flex items-start gap-3 ${message.side === 'right' ? 'justify-end' : 'justify-start'}`}
                    >
                      {message.side === 'left' && (
                        <div className="h-8 w-8 rounded-full bg-[#1f5f4a] text-white flex items-center justify-center text-xs font-bold flex-shrink-0">
                          B
                        </div>
                      )}
                      <div
                        className={`max-w-[95%] rounded-[24px] p-4 text-sm leading-6 shadow-sm ${message.side === 'right'
                          ? 'bg-[#13503f] text-white'
                          : 'bg-white text-[#23382d] border border-black/5'
                          }`}
                      >
                        <p className="font-semibold mb-1">{message.sender}</p>
                        <p>{message.text}</p>
                      </div>
                      {message.side === 'right' && (
                        <div className="h-8 w-8 rounded-full bg-[#e9f1ea] text-[#2f533f] flex items-center justify-center text-xs font-bold flex-shrink-0">
                          H
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            <div className="mt-6">
              <div className="flex items-center gap-4">
                <button className="rounded-full border border-black/10 bg-[#f5f9f0] p-3 text-[#2f533f] hover:bg-[#e9f1ea] transition">
                  <Plus size={20} />
                </button>
                <div className="flex-1 relative">
                  <input
                    type="text"
                    placeholder="Type your message here..."
                    className="w-full rounded-full border border-black/10 bg-[#f9faf8] px-6 py-3 pr-12 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                  <button className="absolute right-3 top-1/2 -translate-y-1/2 rounded-full bg-brand p-2 text-white hover:bg-[#16583e] transition">
                    <Mic size={16} />
                  </button>
                </div>
              </div>
            </div>

            <p className="mt-4 text-center text-sm text-[#6e7d70]">Therapeutic Services for High-Need Teenagers</p>
          </main>

          <PatientSidebar activeItem="Conversations" />
        </div>
      </section>
    </>
  )
}
