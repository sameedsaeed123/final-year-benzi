import { useState, useEffect, useMemo } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronRight } from 'lucide-react'
import { api } from '../../lib/api.js'
import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'
import PatientSidebar from '../../components/PatientSidebar'
import { useAuth } from '../../context/AuthContext.jsx'
import { displayFirstName } from '../../lib/userDisplay.js'

const defaultIndividual = [
  { label: 'Mood balance', value: 0, color: '#1F5F4A' },
  { label: 'Goal progress', value: 0, color: '#527f62' },
  { label: 'AI engagement', value: 0, color: '#97BFA5' },
  { label: 'Active goals', value: 0, color: '#c9d8cb' },
]

const reportPeriods = ['7 days', '30 days', '12 months']
const usagePeriods = ['Monthly', 'Annually']

export default function PatientProgressPage() {
  const { user } = useAuth()
  const welcomeName = displayFirstName(user)
  const [analytics, setAnalytics] = useState(null)
  const [selectedUsagePeriod, setSelectedUsagePeriod] = useState('Annually')
  const [selectedReportPeriod, setSelectedReportPeriod] = useState('12 months')

  useEffect(() => {
    let cancelled = false
    api('/ai/analytics/me', { method: 'GET' })
      .then((json) => {
        if (!cancelled && json.success) setAnalytics(json.data)
      })
      .catch(() => {
        if (!cancelled) setAnalytics(null)
      })
    return () => { cancelled = true }
  }, [])

  const individualStats = analytics?.individualStats?.length ? analytics.individualStats : defaultIndividual
  const overallProgress = analytics?.overallProgress?.length
    ? analytics.overallProgress
    : [{ month: '—', value: 0 }]
  const benziUsageData = analytics?.benziUsageData?.length
    ? analytics.benziUsageData
    : [{ name: '—', value: 0 }]
  const chatbotUsageData = analytics?.chatbotUsageData?.length
    ? analytics.chatbotUsageData
    : [{ day: 'Mon', value: 0 }]
  const reportData = analytics?.reportLines?.length
    ? analytics.reportLines
    : [{ month: 'JAN', weekly: 0, monthly: 0, yearly: 0 }]

  const progressMonths = useMemo(
    () => overallProgress.map((p) => p.month).filter(Boolean),
    [overallProgress]
  )
  const [selectedProgressMonth, setSelectedProgressMonth] = useState('')

  useEffect(() => {
    if (progressMonths.length && !progressMonths.includes(selectedProgressMonth)) {
      setSelectedProgressMonth(progressMonths[progressMonths.length - 1])
    }
  }, [progressMonths, selectedProgressMonth])

  return (
    <>
      <div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
      <section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-brand/70">Patient Progress</p>
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

        <div className="grid gap-6 xl:grid-cols-[2.4fr_280px] max-[1280px]:grid-cols-1">
          <div className="space-y-6">
            <div className="grid gap-6 xl:grid-cols-[0.75fr_1.25fr]">
              <div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
                <p className="text-sm uppercase tracking-[0.2em] text-[#7d8b7d]">Statistics</p>
                <h2 className="mt-3 text-[22px] font-semibold text-[#111]">Individual goal progress</h2>
                <div className="mt-8 space-y-5">
                  {individualStats.map((item) => (
                    <div key={item.label}>
                      <div className="flex items-center justify-between text-sm font-semibold text-[#23382d] mb-2">
                        <span>{item.label}</span>
                        <span>{item.value}%</span>
                      </div>
                      <div className="h-3 rounded-full bg-[#eef2eb] overflow-hidden">
                        <div className="h-full rounded-full" style={{ width: `${item.value}%`, backgroundColor: item.color }} />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="mt-6 flex items-center justify-between text-[11px] font-semibold text-[#7b8a7b]">
                  <span>100%</span>
                  <span>50%</span>
                  <span>30%</span>
                  <span>10%</span>
                </div>
              </div>

              <div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-[#7d8b7d]">Statistics</p>
                    <h2 className="mt-3 text-[22px] font-semibold text-[#111]">Overall goal progress</h2>
                  </div>
                  <div className="rounded-full border border-black/10 bg-[#f5f7f2] px-4 py-2 text-sm text-[#1f5f4a]">
                    {selectedProgressMonth || 'Mood trend'}
                  </div>
                </div>
                <div className="mt-6 h-72 min-h-[300px] min-w-0">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <AreaChart data={overallProgress} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                      <defs>
                        <linearGradient id="progressGradient" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="0%" stopColor="#1F5F4A" stopOpacity={0.95} />
                          <stop offset="100%" stopColor="#1F5F4A" stopOpacity={0.08} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ece7" />
                      <XAxis dataKey="month" axisLine={false} tickLine={false} tick={{ fill: '#7b8a7b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7b8a7b' }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }} />
                      <Area type="monotone" dataKey="value" stroke="#1F5F4A" strokeWidth={3} fill="url(#progressGradient)" />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
                {progressMonths.length > 1 && (
                  <div className="mt-5 flex flex-wrap items-center justify-center gap-2">
                    {progressMonths.map((month) => (
                      <button
                        key={month}
                        type="button"
                        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${month === selectedProgressMonth ? 'bg-brand text-white' : 'bg-[#eef2eb] text-[#2f533f]'
                          }`}
                        onClick={() => setSelectedProgressMonth(month)}
                      >
                        {month}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-2">
              <div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-[#7d8b7d]">Statistics</p>
                    <h2 className="mt-3 text-[22px] font-semibold text-[#111]">Benzi Usage</h2>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-black/10 bg-[#f5f7f2] px-3 py-1 text-sm text-[#1f5f4a]">
                    {usagePeriods.map((period) => (
                      <button
                        key={period}
                        type="button"
                        className={`rounded-full px-3 py-1 font-semibold transition ${period === selectedUsagePeriod ? 'bg-brand text-white' : 'text-[#1f5f4a]'
                          }`}
                        onClick={() => setSelectedUsagePeriod(period)}
                      >
                        {period}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="mt-8 h-56 min-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={benziUsageData} layout="vertical" margin={{ top: 0, right: 0, left: 0, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} horizontal={false} stroke="#e9ece7" />
                      <XAxis type="number" axisLine={false} tickLine={false} tick={{ fill: '#7b8a7b' }} />
                      <YAxis dataKey="name" type="category" axisLine={false} tickLine={false} tick={{ fill: '#7b8a7b' }} width={70} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }} />
                      <Bar dataKey="value" radius={[16, 16, 16, 16]} fill="#1F5F4A" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-[#7d8b7d]">Activity</p>
                    <h2 className="mt-3 text-[22px] font-semibold text-[#111]">Chatbot Usage</h2>
                  </div>
                  <div className="rounded-full border border-black/10 bg-[#f5f7f2] px-3 py-1 text-sm text-[#1f5f4a]">{selectedUsagePeriod}</div>
                </div>
                <div className="mt-8 h-56 min-h-[220px]">
                  <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                    <BarChart data={chatbotUsageData} margin={{ top: 10, right: 0, left: -18, bottom: 0 }}>
                      <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e9ece7" />
                      <XAxis dataKey="day" axisLine={false} tickLine={false} tick={{ fill: '#7b8a7b' }} />
                      <YAxis axisLine={false} tickLine={false} tick={{ fill: '#7b8a7b' }} />
                      <Tooltip contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 8px 30px rgba(0,0,0,0.08)' }} />
                      <Bar dataKey="value" radius={[12, 12, 0, 0]} fill="#528e77" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>

            <div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-sm uppercase tracking-[0.2em] text-[#7d8b7d]">Statistics</p>
                  <h2 className="mt-3 text-[22px] font-semibold text-[#111]">Overall report</h2>
                </div>
                <div className="flex items-center gap-2">
                  {reportPeriods.map((period) => (
                    <button
                      key={period}
                      type="button"
                      className={`rounded-full px-4 py-2 text-sm font-semibold transition ${period === selectedReportPeriod ? 'bg-brand text-white' : 'bg-[#eef2eb] text-[#2f533f]'
                        }`}
                      onClick={() => setSelectedReportPeriod(period)}
                    >
                      {period}
                    </button>
                  ))}
                </div>
              </div>
              <div className="mt-6 h-80 min-h-[320px] min-w-0">
                <ResponsiveContainer width="100%" height="100%" minWidth={0} minHeight={0}>
                  <LineChart data={reportData} margin={{ top: 15, right: 20, left: -10, bottom: 0 }}>
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
                    <Line type="monotone" dataKey="weekly" stroke="url(#weeklyLine)" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="monthly" stroke="url(#monthlyLine)" strokeWidth={3} dot={false} />
                    <Line type="monotone" dataKey="yearly" stroke="url(#yearlyLine)" strokeWidth={3} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          <PatientSidebar activeItem="Progress" />
        </div>
      </section>
    </>
  )
}
