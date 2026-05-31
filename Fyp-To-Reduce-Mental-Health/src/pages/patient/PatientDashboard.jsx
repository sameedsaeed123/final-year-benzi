import { useState, useEffect, useCallback } from 'react'
import { useSocket } from '../../context/SocketContext.jsx'
import { Link } from 'react-router-dom'
import { useAuth } from '../../context/AuthContext.jsx'
import { displayFirstName } from '../../lib/userDisplay.js'
import { api } from '../../lib/api.js'
import { Bell, ChevronRight, MessageCircle } from 'lucide-react'
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  RadialBar,
  RadialBarChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import PatientSidebar from '../../components/PatientSidebar'
import AnonymousMeetJoinModal from '../../components/AnonymousMeetJoinModal.jsx'
import { sentimentToMoodLabel } from '../../lib/moodFromChat.js'

const moodOptions = [
  { label: 'Happy', image: '/images/Vector.png' },
  { label: 'Good', image: '/images/Good Vector.png' },
  { label: 'Normal', image: '/images/Normal Vector.png' },
  { label: 'Bad', image: '/images/Bad Vector.png' },
  { label: 'Awful', image: '/images/Awful Vector.png' },
]

const defaultRadial = [
  { name: 'score', value: 0, fill: '#1F5F4A' },
  { name: 'remaining', value: 100, fill: '#E4E8DF' },
]
const defaultWeekly = [
  { name: 'Mon', value: 0 },
  { name: 'Tue', value: 0 },
  { name: 'Wed', value: 0 },
  { name: 'Thu', value: 0 },
  { name: 'Fri', value: 0 },
  { name: 'Sat', value: 0 },
  { name: 'Sun', value: 0 },
]
const defaultReport = [
  { month: 'JAN', weekly: 0, monthly: 0, yearly: 0 },
  { month: 'FEB', weekly: 0, monthly: 0, yearly: 0 },
  { month: 'MAR', weekly: 0, monthly: 0, yearly: 0 },
  { month: 'APR', weekly: 0, monthly: 0, yearly: 0 },
  { month: 'MAY', weekly: 0, monthly: 0, yearly: 0 },
  { month: 'JUN', weekly: 0, monthly: 0, yearly: 0 },
  { month: 'JUL', weekly: 0, monthly: 0, yearly: 0 },
  { month: 'AUG', weekly: 0, monthly: 0, yearly: 0 },
  { month: 'SEP', weekly: 0, monthly: 0, yearly: 0 },
  { month: 'OCT', weekly: 0, monthly: 0, yearly: 0 },
  { month: 'NOV', weekly: 0, monthly: 0, yearly: 0 },
  { month: 'DEC', weekly: 0, monthly: 0, yearly: 0 },
]
const defaultProgressBars = [
  { label: 'Mental Health', pct: 0 },
  { label: 'Self Care', pct: 0 },
  { label: 'Therapy', pct: 0 },
]

const COLORS = ['#1F5F4A', '#528e77', '#97BFA5', '#c9d8cb']

export default function PatientDashboard() {
  const { user } = useAuth()
  const { unreadCount } = useSocket() || {}
  const welcomeName = displayFirstName(user)
  const [selectedMood, setSelectedMood] = useState('Happy')
  const [selectedReportRange, setSelectedReportRange] = useState('12 months')
  const [dash, setDash] = useState(null)
  const [meetJoin, setMeetJoin] = useState({ open: false, link: '', alias: '' })

  const loadDashboard = useCallback(async () => {
    try {
      const json = await api('/ai/dashboard/me', { method: 'GET' })
      if (json.success && json.data) {
        setDash(json.data)
        const fromChat = json.data.todayMood?.fromChat
          ? sentimentToMoodLabel(json.data.todayMood.label)
          : null
        if (fromChat) setSelectedMood(fromChat)
      }
    } catch {
      setDash(null)
    }
  }, [])

  useEffect(() => {
    void loadDashboard()
    const onMood = () => void loadDashboard()
    window.addEventListener('benzi-mood-updated', onMood)
    window.addEventListener('focus', onMood)
    return () => {
      window.removeEventListener('benzi-mood-updated', onMood)
      window.removeEventListener('focus', onMood)
    }
  }, [loadDashboard])

  const scoreRadial = dash?.scoreRadial ?? defaultRadial
  const progressWeekly = dash?.weeklyTaskProgress ?? defaultWeekly
  const reportLines = dash?.reportLines ?? defaultReport
  const progressBars = dash?.progressBars ?? defaultProgressBars
  const centerPct = dash?.progressCenterPct ?? 0
  const taskScore = dash?.taskScore ?? 0
  const todayMood = dash?.todayMood
  const moodFromChat = Boolean(todayMood?.fromChat)
  const chatMoodHint = moodFromChat
    ? `Detected from ${todayMood.messageCount} BENZI message${todayMood.messageCount === 1 ? '' : 's'} today (${todayMood.label})`
    : 'Chat with BENZI AI to auto-detect mood from your messages'

  return (
    <>
      <div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
      <section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
        <div className="grid grid-cols-[1.4fr_280px] gap-8 max-[1024px]:grid-cols-1">
          <main className="space-y-8">
            <div className="flex flex-wrap items-center justify-between gap-4">
              <div>
                <p className="text-sm uppercase tracking-[0.25em] text-brand/70">Patient Dashboard</p>
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

            {dash?.nextAppointment && (
              <div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
                <p className="text-sm uppercase tracking-[0.2em] text-[#7d8b7d]">Upcoming appointment</p>
                <h2 className="mt-2 text-[20px] font-semibold text-[#111]">{dash.nextAppointment.therapist}</h2>
                <p className="mt-1 text-sm text-[#556b5b]">{dash.nextAppointment.dateTime}</p>
                <p className="text-[12px] text-[#7d8b7d] capitalize">{dash.nextAppointment.status?.toLowerCase()} · {dash.nextAppointment.location}</p>
                {dash.nextAppointment.meetLink && dash.nextAppointment.location === 'online' && (
                  <button
                    type="button"
                    onClick={() => {
                      if (dash.nextAppointment.bookedAsAnonymous) {
                        setMeetJoin({
                          open: true,
                          link: dash.nextAppointment.meetLink,
                          alias: dash.nextAppointment.meetJoinAlias || 'Anonymous Patient',
                          videoProvider: dash.nextAppointment.videoProvider || 'jitsi',
                        })
                      } else {
                        window.open(dash.nextAppointment.meetLink, '_blank', 'noopener,noreferrer')
                      }
                    }}
                    className="mt-4 inline-flex rounded-full bg-[#0f4e34] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#164e35]"
                  >
                    {dash.nextAppointment.bookedAsAnonymous ? 'Join anonymously' : 'Join Google Meet'}
                  </button>
                )}
                <Link to="/patient-appointments" className="mt-3 block text-sm font-semibold text-brand hover:underline">
                  View all appointments
                </Link>
              </div>
            )}

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
                <p className="text-sm uppercase tracking-[0.2em] text-[#7d8b7d]">Statistics</p>
                <h2 className="text-[24px] font-semibold text-[#111]">Task score</h2>
                <div className="flex flex-col items-center">
                  <div className="w-40 h-40 min-w-0 min-h-0 rounded-full p-4">
                    <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                      <RadialBarChart cx="50%" cy="100%" innerRadius="65%" outerRadius="100%" barSize={18} data={scoreRadial} startAngle={180} endAngle={0}>
                        <RadialBar minAngle={15} background={{ fill: '#e3e9dc' }} clockWise dataKey="value" cornerRadius={999}>
                          {scoreRadial.map((entry, index) => (
                            <Cell key={`score-${index}`} fill={entry.fill} />
                          ))}
                        </RadialBar>
                      </RadialBarChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="text-center">
                    <p className="text-[40px] font-extrabold text-[#0f3a2b]">{taskScore}</p>
                    <p className="text-sm text-[#555]">Your Total score is</p>
                    <p className="mt-2 text-[12px] text-[#777]">
                      {moodFromChat ? 'Includes BENZI chat sentiment' : 'Log mood via BENZI chat or goals'}
                    </p>
                  </div>
                </div>
              </div>

              <div className="lg:col-span-2 rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-[#7d8b7d]">Track Your Mood</p>
                    <h2 className="mt-3 text-[24px] font-semibold text-[#111]">
                      {moodFromChat ? 'Today’s mood from chat' : 'Complete today’s log'}
                    </h2>
                  </div>
                </div>
                <p className="mt-4 text-sm text-[#555]">{chatMoodHint}</p>
                <p className="mt-1 text-[12px] text-[#7d8b7d]">Or pick how you feel manually:</p>
                <div className="mt-5 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
                  {moodOptions.map((mood) => (
                    <button
                      key={mood.label}
                      type="button"
                      onClick={() => setSelectedMood(mood.label)}
                      className={`rounded-3xl border px-4 py-4 text-center transition-all ${selectedMood === mood.label ? 'border-brand bg-brand/10' : 'border-black/10 bg-[#f8f7f3] hover:border-brand'
                        }`}
                    >
                      <img src={mood.image} alt={mood.label} className="mx-auto h-12 w-12 object-contain" />
                      <span className="mt-3 block text-[13px] font-medium text-[#444]">{mood.label}</span>
                    </button>
                  ))}
                </div>
                <div className="mt-5 flex justify-start">
                  <Link
                    to="/patient-progress"
                    className="rounded-xl border border-black/10 bg-[#f7f5ef] px-4 py-2 text-sm text-[#111]"
                  >
                    Submit
                  </Link>

                  <Link
                    to="/patient-chat"
                    className="flex items-center gap-2 bg-brand text-white rounded-full px-4 py-3 shadow-sm text-[14px] font-semibold"
                  >
                    <MessageCircle size={16} />
                    Messages
                    {unreadCount > 0 && (
                      <span className="ml-auto h-5 w-5 rounded-full bg-brand/10 text-white text-[10px] font-bold flex items-center justify-center">
                        {unreadCount}
                      </span>
                    )}
                  </Link>
                </div>
              </div>
            </div>

            <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr]">
              <div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-[#7d8b7d]">Statistics</p>
                    <h2 className="mt-3 text-[22px] font-semibold text-[#111]">Current Progress</h2>
                  </div>
                </div>
                <div className="mt-8 flex items-center justify-center">
                  <div className="relative h-44 w-44 rounded-full bg-[#f3f6f1] p-6">
                    <div className="absolute inset-0 rounded-full border-8 border-[#e7ede8]" />
                    <div className="absolute inset-6 rounded-full border-8 border-brand/30" />
                    <div className="absolute inset-12 rounded-full bg-white" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <p className="text-[28px] font-bold text-[#0f3a2b]">{centerPct}%</p>
                      <span className="text-sm text-[#666]">Weekly growth</span>
                    </div>
                  </div>
                </div>
                <div className="mt-8 space-y-4">
                  {progressBars.map((item) => (
                    <div key={item.label}>
                      <div className="flex justify-between text-sm text-[#555]">
                        <span>{item.label}</span>
                        <span>{item.pct}%</span>
                      </div>
                      <div className="mt-2 h-2 rounded-full bg-[#eee] overflow-hidden">
                        <div
                          className={`${item.label === 'Mental Health' ? 'bg-brand' : item.label === 'Self Care' ? 'bg-[#5A9378]' : 'bg-[#97BFA5]'} h-full rounded-full`}
                          style={{ width: `${item.pct}%` }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-[#7d8b7d]">Statistics</p>
                    <h2 className="mt-3 text-[22px] font-semibold text-[#111]">Task Progress</h2>
                  </div>
                  <span className="rounded-full bg-[#eef6ed] px-3 py-1 text-[12px] font-semibold text-brand">High</span>
                </div>
                <div className="mt-8 h-64 min-h-80 min-w-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={progressWeekly} margin={{ top: 10, right: 0, left: -16, bottom: 0 }}>
                      <defs>
                        <linearGradient id="barGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1F5F4A" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#528e77" stopOpacity={0.8} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ece7" />
                      <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7b8a7b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fontSize: 12, fill: '#7b8a7b' }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }} />
                      <Bar dataKey="value" radius={[16, 16, 0, 0]} fill="url(#barGradient)" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
                <div className="mt-6 flex justify-between text-sm text-[#777]">
                  <button className="text-brand font-semibold">← Previous</button>
                  <button className="text-brand font-semibold">Next →</button>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[#7d8b7d]">Statistics</p>
                  <h2 className="mt-3 text-[22px] font-semibold text-[#111]">Overall report</h2>
                </div>
                <div className="flex flex-wrap items-center gap-2 text-sm">
                  {['7 days', '30 days', '12 months'].map((option) => (
                    <button
                      key={option}
                      type="button"
                      onClick={() => setSelectedReportRange(option)}
                      className={`rounded-full px-3 py-2 ${option === selectedReportRange ? 'bg-brand text-white' : 'bg-[#edf4ea] text-[#5f7f6c]'}`}
                    >
                      {option}
                    </button>
                  ))}
                </div>
              </div>

              <div className="mt-8 h-72 min-h-70 min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <LineChart data={reportLines} margin={{ top: 20, right: 20, left: -10, bottom: 0 }}>
                    <defs>
                      <linearGradient id="weeklyLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#1F5F4A" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#1F5F4A" stopOpacity={0.35} />
                      </linearGradient>
                      <linearGradient id="monthlyLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#528e77" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#528e77" stopOpacity={0.35} />
                      </linearGradient>
                      <linearGradient id="yearlyLine" x1="0" y1="0" x2="1" y2="0">
                        <stop offset="0%" stopColor="#97BFA5" stopOpacity={0.95} />
                        <stop offset="100%" stopColor="#97BFA5" stopOpacity={0.35} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ece7" />
                    <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#7b8a7b' }} />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7b8a7b' }} />
                    <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }} />
                    <Line type="monotone" dataKey="weekly" stroke="url(#weeklyLine)" strokeWidth={3} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="monthly" stroke="url(#monthlyLine)" strokeWidth={3} dot={{ r: 2 }} />
                    <Line type="monotone" dataKey="yearly" stroke="url(#yearlyLine)" strokeWidth={3} dot={{ r: 2 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </main>

          <PatientSidebar activeItem="Dashboard" />
        </div>
      </section>

      <AnonymousMeetJoinModal
        open={meetJoin.open}
        meetLink={meetJoin.link}
        alias={meetJoin.alias}
        onClose={() => setMeetJoin({ open: false, link: '', alias: '' })}
      />
    </>
  )
}
