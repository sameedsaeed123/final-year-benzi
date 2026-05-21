import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  BarChart3,
  CheckCircle,
  MessageCircle,
  Target,
  X,
} from 'lucide-react'
import { api } from '../lib/api.js'
import { sanitizeAiText } from '../lib/textSanitize.js'

const goalStatusStyle = {
  pending: 'bg-[#f6f1ec] text-[#7a5b4b]',
  'in-progress': 'bg-[#e7f1e8] text-[#1f5f4a]',
  completed: 'bg-[#e8f0fb] text-[#2d5fa6]',
}

export default function TherapistPatientPanel({ client, onClose, onUpdated }) {
  const navigate = useNavigate()
  const [tab, setTab] = useState('stats')
  const [analytics, setAnalytics] = useState(null)
  const [overview, setOverview] = useState(null)
  const [goals, setGoals] = useState([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingGoals, setLoadingGoals] = useState(true)
  const [aiRecommendations, setAiRecommendations] = useState([])
  const [loadingRecs, setLoadingRecs] = useState(false)
  const [goalTitle, setGoalTitle] = useState('')
  const [goalDescription, setGoalDescription] = useState('')
  const [goalPriority, setGoalPriority] = useState('medium')
  const [assigning, setAssigning] = useState(false)
  const [msg, setMsg] = useState('')

  const patientId = client?.id

  const loadGoals = useCallback(async () => {
    if (!patientId) return
    setLoadingGoals(true)
    try {
      const json = await api(`/ai/goals/patient/${patientId}`, { method: 'GET', silent: true })
      setGoals(json.data?.goals || [])
    } catch {
      setGoals([])
    } finally {
      setLoadingGoals(false)
    }
  }, [patientId])

  const loadStats = useCallback(async () => {
    if (!patientId) return
    setLoadingStats(true)
    try {
      const [analyticsJson, overviewJson] = await Promise.all([
        api(`/ai/analytics/patient/${patientId}`, { method: 'GET', silent: true }),
        api(`/ai/overview/patient/${patientId}`, { method: 'GET', silent: true }),
      ])
      setAnalytics(analyticsJson.data || null)
      setOverview(overviewJson.data || null)
    } catch {
      setAnalytics(null)
      setOverview(null)
    } finally {
      setLoadingStats(false)
    }
  }, [patientId])

  useEffect(() => {
    void loadStats()
    void loadGoals()
  }, [loadStats, loadGoals])

  useEffect(() => {
    if (!patientId || tab !== 'goals') return
    let cancelled = false
    setLoadingRecs(true)
    api(`/ai/goals/recommend/${patientId}`, { method: 'POST', silent: true })
      .then((json) => {
        if (!cancelled) setAiRecommendations(json.data?.recommendations || [])
      })
      .catch(() => {
        if (!cancelled) setAiRecommendations([])
      })
      .finally(() => {
        if (!cancelled) setLoadingRecs(false)
      })
    return () => { cancelled = true }
  }, [patientId, tab])

  const patientSubmitted = goals.filter((g) => g.submittedBy === 'patient')

  const handleAssign = async () => {
    if (!goalTitle.trim()) {
      setMsg('Enter a goal title.')
      return
    }
    setAssigning(true)
    setMsg('')
    try {
      await api('/ai/goals/assign', {
        method: 'POST',
        body: JSON.stringify({
          patientUserId: patientId,
          title: sanitizeAiText(goalTitle),
          description: sanitizeAiText(goalDescription),
          priority: goalPriority,
          aiRecommended: aiRecommendations.some(
            (r) => sanitizeAiText(r.title) === sanitizeAiText(goalTitle)
          ),
        }),
      })
      setMsg('Goal assigned.')
      setGoalTitle('')
      setGoalDescription('')
      await loadGoals()
      onUpdated?.()
    } catch (e) {
      setMsg(e.message || 'Failed to assign.')
    } finally {
      setAssigning(false)
    }
  }

  const handleGoalStatus = async (goalId, status) => {
    try {
      await api(`/ai/goals/${goalId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      await loadGoals()
      onUpdated?.()
    } catch {
      /* ignore */
    }
  }

  const sentiment = analytics?.sentimentCounts || overview?.sentimentCounts || {
    negative: 0,
    neutral: 0,
    positive: 0,
  }
  const individualStats = analytics?.individualStats || []

  return (
    <div className="fixed inset-0 z-50 flex justify-end bg-black/40 backdrop-blur-sm">
      <div className="bg-cream h-full w-full max-w-xl shadow-2xl border-l border-black/10 flex flex-col overflow-hidden max-[640px]:max-w-full">
        <div className="flex items-start justify-between gap-3 p-5 border-b border-black/10 bg-white/80">
          <div>
            <p className="text-[11px] uppercase tracking-widest text-[#7d8b7d]">Patient</p>
            <h2 className="text-xl font-bold text-[#0f3a2b]">{client?.name}</h2>
            {!client?.isAnonymous && client?.email && (
              <p className="text-[12px] text-[#556b5b] mt-0.5">{client.email}</p>
            )}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#7d8b7d] hover:bg-[#f0f4ee]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex gap-1 px-5 pt-3 border-b border-black/5">
          {[
            { id: 'stats', label: 'Stats', icon: BarChart3 },
            { id: 'goals', label: 'Goals', icon: Target },
          ].map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              type="button"
              onClick={() => setTab(id)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold rounded-t-2xl transition ${
                tab === id
                  ? 'bg-white text-brand border border-black/10 border-b-white -mb-px'
                  : 'text-[#7d8b7d] hover:text-[#1f5f4a]'
              }`}
            >
              <Icon size={16} />
              {label}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {tab === 'stats' && (
            <>
              {loadingStats && (
                <p className="text-sm text-[#7d8b7d]">Loading patient stats…</p>
              )}
              {!loadingStats && (
                <>
                  <div className="grid grid-cols-2 gap-3">
                    <StatCard
                      label="Wellness"
                      value={`${overview?.taskScore ?? analytics?.taskScore ?? 0}%`}
                    />
                    <StatCard
                      label="Goal progress"
                      value={`${overview?.progressCenterPct ?? analytics?.progressCenterPct ?? 0}%`}
                    />
                    <StatCard
                      label="AI mood"
                      value={(overview?.dominantMood || 'neutral').replace(/^./, (c) => c.toUpperCase())}
                      capitalize
                    />
                    <StatCard
                      label="BENZI chats"
                      value={String(overview?.aiMessageCount ?? analytics?.aiMessageCount ?? 0)}
                    />
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-white p-4">
                    <p className="text-[11px] uppercase tracking-wider text-[#7d8b7d] mb-3">
                      Chat sentiment
                    </p>
                    <div className="grid grid-cols-3 gap-2 text-center text-sm">
                      {[
                        { label: 'Positive', n: sentiment.positive, color: '#1F5F4A' },
                        { label: 'Neutral', n: sentiment.neutral, color: '#8CA287' },
                        { label: 'Negative', n: sentiment.negative, color: '#D6E3D6' },
                      ].map((s) => (
                        <div key={s.label} className="rounded-xl bg-[#f6f8f3] p-3">
                          <div
                            className="mx-auto mb-2 h-2 w-2 rounded-full"
                            style={{ backgroundColor: s.color }}
                          />
                          <p className="font-bold text-[#23382d]">{s.n}</p>
                          <p className="text-[#7d8b7d] text-[11px]">{s.label}</p>
                        </div>
                      ))}
                    </div>
                  </div>

                  {individualStats.length > 0 && (
                    <div className="rounded-2xl border border-black/10 bg-white p-4 space-y-4">
                      <p className="text-[11px] uppercase tracking-wider text-[#7d8b7d]">
                        Progress breakdown
                      </p>
                      {individualStats.map((s) => (
                        <div key={s.label}>
                          <div className="flex justify-between text-sm font-semibold text-[#23382d] mb-1">
                            <span>{s.label}</span>
                            <span>{s.value}%</span>
                          </div>
                          <div className="h-2 rounded-full bg-[#e8f2e9] overflow-hidden">
                            <div
                              className="h-full rounded-full"
                              style={{ width: `${s.value}%`, backgroundColor: s.color || '#1F5F4A' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {analytics?.goals?.length > 0 && (
                    <div className="rounded-2xl border border-black/10 bg-white p-4">
                      <p className="text-[11px] uppercase tracking-wider text-[#7d8b7d] mb-2">
                        Active goals snapshot
                      </p>
                      <ul className="space-y-2">
                        {analytics.goals
                          .filter((g) => g.status !== 'completed')
                          .slice(0, 5)
                          .map((g) => (
                            <li key={g.id} className="text-sm text-[#3f4f41] flex justify-between gap-2">
                              <span className="font-medium">{sanitizeAiText(g.title)}</span>
                              <span className="text-[11px] capitalize text-[#7d8b7d]">{g.status}</span>
                            </li>
                          ))}
                      </ul>
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => navigate(`/therapist-chat?patientId=${patientId}`)}
                    className="w-full flex items-center justify-center gap-2 rounded-2xl bg-[#0f4e34] text-white py-3 text-sm font-semibold"
                  >
                    <MessageCircle size={16} />
                    Open chat
                  </button>
                </>
              )}
            </>
          )}

          {tab === 'goals' && (
            <>
              {patientSubmitted.length > 0 && (
                <div className="rounded-2xl border border-[#7a5b4b]/30 bg-[#fdf9f6] p-4">
                  <p className="text-[11px] uppercase tracking-wider text-[#7a5b4b] font-semibold mb-3">
                    Patient submitted — review
                  </p>
                  <ul className="space-y-3">
                    {patientSubmitted.map((g) => (
                      <GoalRow
                        key={g._id || g.id}
                        goal={g}
                        onStatus={handleGoalStatus}
                      />
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-2xl border border-dashed border-brand/30 bg-[#f8faf8] p-4">
                <p className="text-[11px] font-semibold text-[#1f5f4a] mb-2">
                  AI suggestions (reports & stats)
                </p>
                {loadingRecs && <p className="text-[11px] text-[#7d8b7d]">Loading…</p>}
                <div className="flex flex-wrap gap-2">
                  {!loadingRecs &&
                    aiRecommendations.map((rec, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => {
                          setGoalTitle(sanitizeAiText(rec.title || ''))
                          setGoalDescription(sanitizeAiText(rec.description || ''))
                          if (rec.priority) setGoalPriority(rec.priority)
                        }}
                        className="rounded-xl border border-black/10 bg-white px-2.5 py-1.5 text-left text-[11px] hover:border-brand"
                      >
                        <span className="font-semibold text-[#111] block">
                          {sanitizeAiText(rec.title)}
                        </span>
                      </button>
                    ))}
                </div>
              </div>

              <div className="rounded-2xl border border-black/10 bg-white p-4 space-y-3">
                <p className="text-[11px] uppercase tracking-wider text-[#7d8b7d]">
                  Assign new goal
                </p>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="Goal title"
                  className="w-full rounded-xl border border-black/10 bg-[#f8faf8] px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
                <textarea
                  rows={2}
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  placeholder="Details (optional)"
                  className="w-full rounded-xl border border-black/10 bg-[#f8faf8] px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
                <select
                  value={goalPriority}
                  onChange={(e) => setGoalPriority(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-[#f8faf8] px-3 py-2.5 text-sm outline-none focus:border-brand"
                >
                  <option value="low">Low</option>
                  <option value="medium">Medium</option>
                  <option value="high">High</option>
                </select>
                {msg && <p className="text-[12px] text-[#1f5f4a] font-medium">{msg}</p>}
                <button
                  type="button"
                  disabled={assigning}
                  onClick={() => void handleAssign()}
                  className="w-full rounded-xl bg-brand text-white py-2.5 text-sm font-semibold disabled:opacity-60"
                >
                  {assigning ? 'Assigning…' : 'Assign to patient'}
                </button>
              </div>

              <div>
                <p className="text-[11px] uppercase tracking-wider text-[#7d8b7d] mb-3">
                  All goals
                </p>
                {loadingGoals && <p className="text-sm text-[#7d8b7d]">Loading goals…</p>}
                {!loadingGoals && goals.length === 0 && (
                  <p className="text-sm text-[#7d8b7d]">No goals yet.</p>
                )}
                <ul className="space-y-3">
                  {goals.map((g) => (
                    <GoalRow key={g._id || g.id} goal={g} onStatus={handleGoalStatus} />
                  ))}
                </ul>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  )
}

function StatCard({ label, value, capitalize: cap }) {
  return (
    <div className="rounded-2xl border border-black/10 bg-white p-4 text-center">
      <p className="text-[10px] uppercase tracking-wider text-[#7d8b7d]">{label}</p>
      <p className={`mt-1 text-xl font-bold text-[#0f3a2b] ${cap ? 'capitalize' : ''}`}>{value}</p>
    </div>
  )
}

function GoalRow({ goal, onStatus }) {
  const id = goal._id || goal.id
  const title = sanitizeAiText(goal.title)
  const isPatient = goal.submittedBy === 'patient'

  return (
    <li className="rounded-xl border border-black/10 bg-white p-3">
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div>
          <p className="font-semibold text-[#111] text-sm">{title}</p>
          {goal.description && (
            <p className="text-[12px] text-[#556b5b] mt-1">{sanitizeAiText(goal.description)}</p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                goalStatusStyle[goal.status] || goalStatusStyle.pending
              }`}
            >
              {goal.status}
            </span>
            {isPatient && (
              <span className="rounded-full bg-[#fdf9f6] border border-[#7a5b4b]/20 px-2 py-0.5 text-[10px] font-semibold text-[#7a5b4b]">
                Patient submitted
              </span>
            )}
            {goal.aiRecommended && !isPatient && (
              <span className="rounded-full bg-[#e8f3ea] px-2 py-0.5 text-[10px] font-semibold text-[#1f5f4a]">
                AI suggested
              </span>
            )}
          </div>
        </div>
        {goal.status !== 'completed' && (
          <div className="flex flex-col gap-1">
            {goal.status === 'pending' && (
              <button
                type="button"
                onClick={() => void onStatus(id, 'in-progress')}
                className="text-[11px] font-semibold text-brand whitespace-nowrap"
              >
                Start
              </button>
            )}
            {goal.status === 'in-progress' && (
              <button
                type="button"
                onClick={() => void onStatus(id, 'completed')}
                className="flex items-center gap-1 text-[11px] font-semibold text-[#1f5f4a] whitespace-nowrap"
              >
                <CheckCircle size={12} />
                Complete
              </button>
            )}
          </div>
        )}
      </div>
    </li>
  )
}
