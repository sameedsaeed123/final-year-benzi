import { useState, useEffect, useCallback, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle,
  BarChart3,
  CheckCircle,
  Link2Off,
  MessageCircle,
  Target,
  X,
  XCircle,
} from 'lucide-react'
import { api } from '../lib/api.js'
import { sanitizeAiText } from '../lib/textSanitize.js'
import { useSocket } from '../context/SocketContext.jsx'

const goalStatusStyle = {
  pending: 'bg-[#f6f1ec] text-[#7a5b4b]',
  'in-progress': 'bg-[#e7f1e8] text-[#1f5f4a]',
  completed: 'bg-[#e8f0fb] text-[#2d5fa6]',
  rejected: 'bg-[#fef2f2] text-[#b42318]',
}

export default function TherapistPatientPanel({ client, onClose, onUpdated }) {
  const navigate = useNavigate()
  const { subscribeActivity } = useSocket() || {}
  const [tab, setTab] = useState('stats')
  const [analytics, setAnalytics] = useState(null)
  const [overview, setOverview] = useState(null)
  const [goals, setGoals] = useState([])
  const [loadingStats, setLoadingStats] = useState(true)
  const [loadingGoals, setLoadingGoals] = useState(true)
  const [typingRecs, setTypingRecs] = useState([])
  const [loadingTypingRecs, setLoadingTypingRecs] = useState(false)
  const [goalTitle, setGoalTitle] = useState('')
  const [goalDescription, setGoalDescription] = useState('')
  const [goalPriority, setGoalPriority] = useState('medium')
  const [assigning, setAssigning] = useState(false)
  const [unlinking, setUnlinking] = useState(false)
  const [showUnlinkConfirm, setShowUnlinkConfirm] = useState(false)
  const [msg, setMsg] = useState('')
  const previewTimer = useRef(null)

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

  const refreshAll = useCallback(async () => {
    await Promise.all([loadStats(), loadGoals()])
    onUpdated?.()
  }, [loadStats, loadGoals, onUpdated])

  useEffect(() => {
    void loadStats()
    void loadGoals()
  }, [loadStats, loadGoals])

  useEffect(() => {
    if (!subscribeActivity || !patientId) return
    return subscribeActivity((payload) => {
      const pid = payload?.patientUserId
      if (pid && String(pid) === String(patientId)) {
        void refreshAll()
      }
    })
  }, [subscribeActivity, patientId, refreshAll])

  useEffect(() => {
    if (!patientId || tab !== 'goals') return
    const draft = `${goalTitle} ${goalDescription}`.trim()
    if (previewTimer.current) clearTimeout(previewTimer.current)
    if (draft.length < 2) {
      setTypingRecs([])
      return
    }
    previewTimer.current = setTimeout(() => {
      setLoadingTypingRecs(true)
      api(`/ai/goals/preview/patient/${patientId}`, {
        method: 'POST',
        body: JSON.stringify({ draft }),
        silent: true,
      })
        .then((json) => setTypingRecs(json.data?.recommendations || []))
        .catch(() => setTypingRecs([]))
        .finally(() => setLoadingTypingRecs(false))
    }, 550)
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current)
    }
  }, [patientId, tab, goalTitle, goalDescription])

  const patientSubmitted = goals.filter(
    (g) => g.submittedBy === 'patient' && g.status === 'pending' && !g.crisisFlag && !g.isCrisisAlert
  )
  const crisisGoals = goals.filter((g) => g.crisisFlag || g.isCrisisAlert)

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
          aiRecommended: typingRecs.some(
            (r) => sanitizeAiText(r.title) === sanitizeAiText(goalTitle)
          ),
        }),
      })
      setMsg('Goal assigned.')
      setGoalTitle('')
      setGoalDescription('')
      setTypingRecs([])
      await refreshAll()
    } catch (e) {
      setMsg(e.message || 'Failed to assign.')
    } finally {
      setAssigning(false)
    }
  }

  const handleGoalStatus = async (goalId, status, rejectionNote = '') => {
    try {
      await api(`/ai/goals/${goalId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status, rejectionNote }),
      })
      await refreshAll()
    } catch (e) {
      setMsg(e.message || 'Could not update goal.')
    }
  }

  const handleUnlink = async () => {
    if (!patientId) return
    setUnlinking(true)
    setMsg('')
    try {
      await api(`/therapists/clients/${patientId}/unlink`, { method: 'POST' })
      setShowUnlinkConfirm(false)
      onUpdated?.()
      onClose?.()
    } catch (e) {
      setMsg(e.message || 'Could not unlink patient.')
    } finally {
      setUnlinking(false)
    }
  }

  const canAssignGoals = client?.isLinked !== false

  const sentiment = analytics?.sentimentCounts || overview?.sentimentCounts || {
    negative: 0,
    neutral: 0,
    positive: 0,
  }
  const individualStats = analytics?.individualStats || []
  const wellness = overview?.taskScore ?? analytics?.taskScore ?? 0
  const goalPct = overview?.progressCenterPct ?? analytics?.progressCenterPct ?? 0

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
            {client?.isLinked === false && (
              <p className="text-[11px] text-[#7a5b4b] mt-1 font-medium">Unlinked — view-only (past sessions kept)</p>
            )}
          </div>
          <div className="flex items-center gap-1">
            {client?.isLinked !== false && (
              <button
                type="button"
                onClick={() => setShowUnlinkConfirm(true)}
                className="rounded-full p-2 text-[#b42318] hover:bg-[#fef2f2]"
                title="Unlink patient"
                aria-label="Unlink patient"
              >
                <Link2Off size={18} />
              </button>
            )}
            <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-[#7d8b7d] hover:bg-[#f0f4ee]"
            aria-label="Close"
          >
            <X size={20} />
          </button>
          </div>
        </div>

        {showUnlinkConfirm && (
          <div className="mx-5 mt-3 rounded-2xl border border-[#fecaca] bg-[#fef2f2] p-4 text-sm">
            <p className="font-semibold text-[#b42318]">Unlink this patient?</p>
            <p className="text-[#7a5b4b] mt-1 text-[13px] leading-relaxed">
              They can still book with you again later. Past appointments, reports, and stats stay saved.
            </p>
            <div className="flex gap-2 mt-3">
              <button
                type="button"
                onClick={() => setShowUnlinkConfirm(false)}
                className="flex-1 rounded-full border border-black/10 bg-white py-2 text-[13px] font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={() => void handleUnlink()}
                disabled={unlinking}
                className="flex-1 rounded-full bg-[#b42318] text-white py-2 text-[13px] font-semibold disabled:opacity-60"
              >
                {unlinking ? 'Unlinking…' : 'Unlink'}
              </button>
            </div>
          </div>
        )}

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
              {id === 'goals' && patientSubmitted.length > 0 && (
                <span className="h-5 min-w-5 rounded-full bg-[#b42318] text-white text-[10px] flex items-center justify-center px-1">
                  {patientSubmitted.length}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-5 space-y-5">
          {tab === 'stats' && (
            <>
              {loadingStats && <p className="text-sm text-[#7d8b7d]">Loading patient stats…</p>}
              {!loadingStats && (
                <>
                  <div className="rounded-2xl border border-brand/20 bg-gradient-to-br from-[#e8f3ea] to-white p-4">
                    <p className="text-[11px] uppercase tracking-wider text-[#1f5f4a] font-semibold mb-3">
                      At a glance
                    </p>
                    <div className="grid grid-cols-2 gap-3">
                      <StatCard label="Wellness" value={`${wellness}%`} highlight />
                      <StatCard label="Goal progress" value={`${goalPct}%`} highlight />
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
                    <p className="text-[11px] text-[#556b5b] mt-3">
                      Stats refresh when the patient uses BENZI AI, submits goals, or uploads reports.
                    </p>
                  </div>

                  <div className="rounded-2xl border border-black/10 bg-white p-4">
                    <p className="text-[11px] uppercase tracking-wider text-[#7d8b7d] mb-3">
                      Chat sentiment
                    </p>
                    <SentimentBar sentiment={sentiment} />
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
                          <div className="h-2.5 rounded-full bg-[#e8f2e9] overflow-hidden">
                            <div
                              className="h-full rounded-full transition-all duration-500"
                              style={{ width: `${s.value}%`, backgroundColor: s.color || '#1F5F4A' }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  <button
                    type="button"
                    onClick={() => void refreshAll()}
                    className="text-[12px] font-semibold text-brand"
                  >
                    Refresh stats
                  </button>

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
              {crisisGoals.length > 0 && (
                <div className="rounded-2xl border-2 border-[#b42318] bg-[#fef2f2] p-4">
                  <p className="text-[11px] uppercase tracking-wider text-[#b42318] font-bold mb-3 flex items-center gap-2">
                    <AlertTriangle size={14} /> Crisis alert — immediate review
                  </p>
                  <ul className="space-y-3">
                    {crisisGoals.map((g) => (
                      <GoalRow key={`crisis-${g._id || g.id}`} goal={g} onStatus={handleGoalStatus} crisis />
                    ))}
                  </ul>
                </div>
              )}

              {patientSubmitted.length > 0 && (
                <div className="rounded-2xl border-2 border-[#7a5b4b]/40 bg-[#fdf9f6] p-4">
                  <p className="text-[11px] uppercase tracking-wider text-[#7a5b4b] font-semibold mb-1">
                    Awaiting your review ({patientSubmitted.length})
                  </p>
                  <p className="text-[12px] text-[#556b5b] mb-3">
                    Approve to start therapy on this goal, or decline with an optional note.
                  </p>
                  <ul className="space-y-3">
                    {patientSubmitted.map((g) => (
                      <GoalRow
                        key={g._id || g.id}
                        goal={g}
                        onStatus={handleGoalStatus}
                        showReviewActions
                      />
                    ))}
                  </ul>
                </div>
              )}

              <div className="rounded-2xl border border-black/10 bg-white p-4 space-y-3">
                <p className="text-[11px] uppercase tracking-wider text-[#7d8b7d]">
                  Assign new goal
                </p>
                {!canAssignGoals ? (
                  <p className="text-[13px] text-[#7a5b4b] leading-relaxed">
                    This patient is unlinked. You can still view past stats; re-link happens when they book again.
                  </p>
                ) : (
                <>
                <input
                  type="text"
                  value={goalTitle}
                  onChange={(e) => setGoalTitle(e.target.value)}
                  placeholder="Goal title — AI suggests as you type"
                  className="w-full rounded-xl border border-black/10 bg-[#f8faf8] px-3 py-2.5 text-sm outline-none focus:border-brand"
                />
                <textarea
                  rows={2}
                  value={goalDescription}
                  onChange={(e) => setGoalDescription(e.target.value)}
                  placeholder="Details (optional)"
                  className="w-full rounded-xl border border-black/10 bg-[#f8faf8] px-3 py-2.5 text-sm outline-none focus:border-brand"
                />

                {(loadingTypingRecs || typingRecs.length > 0) && (
                  <div className="rounded-xl border border-dashed border-brand/30 bg-[#f8faf8] p-3">
                    <p className="text-[10px] font-semibold text-[#1f5f4a] mb-2">
                      {loadingTypingRecs ? 'Suggesting…' : 'Suggestions for what you typed'}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {typingRecs.map((rec, i) => (
                        <button
                          key={i}
                          type="button"
                          onClick={() => {
                            setGoalTitle(sanitizeAiText(rec.title || ''))
                            setGoalDescription(sanitizeAiText(rec.description || ''))
                            if (rec.priority) setGoalPriority(rec.priority)
                          }}
                          className="rounded-lg border border-black/10 bg-white px-2 py-1.5 text-left text-[11px] hover:border-brand max-w-full"
                        >
                          <span className="font-semibold text-[#111] block">
                            {sanitizeAiText(rec.title)}
                          </span>
                          {rec.description && (
                            <span className="text-[#7d8b7d] line-clamp-1">
                              {sanitizeAiText(rec.description)}
                            </span>
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                <select
                  value={goalPriority}
                  onChange={(e) => setGoalPriority(e.target.value)}
                  className="w-full rounded-xl border border-black/10 bg-[#f8faf8] px-3 py-2.5 text-sm outline-none focus:border-brand"
                >
                  <option value="low">Low priority</option>
                  <option value="medium">Medium priority</option>
                  <option value="high">High priority</option>
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
                </>
                )}
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
                    <GoalRow
                      key={g._id || g.id}
                      goal={g}
                      onStatus={handleGoalStatus}
                      showReviewActions={
                        g.submittedBy === 'patient' &&
                        g.status === 'pending' &&
                        !g.crisisFlag &&
                        !g.isCrisisAlert
                      }
                    />
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

function StatCard({ label, value, capitalize: cap, highlight }) {
  return (
    <div
      className={`rounded-xl p-3 text-center ${
        highlight ? 'bg-white/90 border border-brand/10' : 'bg-white/60'
      }`}
    >
      <p className="text-[10px] uppercase tracking-wider text-[#7d8b7d]">{label}</p>
      <p className={`mt-1 text-lg font-bold text-[#0f3a2b] ${cap ? 'capitalize' : ''}`}>{value}</p>
    </div>
  )
}

function SentimentBar({ sentiment }) {
  const total = (sentiment.positive || 0) + (sentiment.neutral || 0) + (sentiment.negative || 0) || 1
  const segments = [
    { label: 'Positive', n: sentiment.positive || 0, color: '#1F5F4A' },
    { label: 'Neutral', n: sentiment.neutral || 0, color: '#8CA287' },
    { label: 'Negative', n: sentiment.negative || 0, color: '#c4d4c4' },
  ]
  return (
    <>
      <div className="flex h-3 rounded-full overflow-hidden mb-3">
        {segments.map((s) => (
          <div
            key={s.label}
            style={{ width: `${(s.n / total) * 100}%`, backgroundColor: s.color }}
            title={`${s.label}: ${s.n}`}
          />
        ))}
      </div>
      <div className="grid grid-cols-3 gap-2 text-center text-sm">
        {segments.map((s) => (
          <div key={s.label} className="rounded-xl bg-[#f6f8f3] p-2">
            <p className="font-bold text-[#23382d]">{s.n}</p>
            <p className="text-[#7d8b7d] text-[10px]">{s.label}</p>
          </div>
        ))}
      </div>
    </>
  )
}

function GoalRow({ goal, onStatus, crisis: crisisRow, showReviewActions }) {
  const id = goal._id || goal.id
  const title = sanitizeAiText(goal.title)
  const isPatient = goal.submittedBy === 'patient'
  const isCrisis = crisisRow || goal.crisisFlag || goal.isCrisisAlert
  const [rejectNote, setRejectNote] = useState('')
  const [showReject, setShowReject] = useState(false)

  return (
    <li
      className={`rounded-xl border p-3 ${
        isCrisis ? 'border-[#b42318] bg-white' : 'border-black/10 bg-white'
      }`}
    >
      <div className="flex flex-wrap items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-[#111] text-sm">{title}</p>
          {goal.description && (
            <p className="text-[12px] text-[#556b5b] mt-1">{sanitizeAiText(goal.description)}</p>
          )}
          {goal.status === 'rejected' && goal.rejectionNote && (
            <p className="text-[11px] text-[#b42318] mt-1 italic">
              Note: {sanitizeAiText(goal.rejectionNote)}
            </p>
          )}
          <div className="mt-2 flex flex-wrap gap-2">
            <span
              className={`rounded-full px-2 py-0.5 text-[10px] font-semibold capitalize ${
                goalStatusStyle[goal.status] || goalStatusStyle.pending
              }`}
            >
              {goal.status === 'rejected' ? 'declined' : goal.status}
            </span>
            {isCrisis && (
              <span className="rounded-full bg-[#fef2f2] border border-[#b42318]/30 px-2 py-0.5 text-[10px] font-semibold text-[#b42318]">
                Crisis {goal.crisisSeverity || goal.crisisFlag || 'alert'}
              </span>
            )}
            {isPatient && !isCrisis && goal.status !== 'rejected' && (
              <span className="rounded-full bg-[#fdf9f6] border border-[#7a5b4b]/20 px-2 py-0.5 text-[10px] font-semibold text-[#7a5b4b]">
                Patient submitted
              </span>
            )}
          </div>
        </div>

        <div className="flex flex-col gap-1 items-end">
          {showReviewActions && (
            <>
              <button
                type="button"
                onClick={() => void onStatus(id, 'in-progress')}
                className="flex items-center gap-1 rounded-lg bg-brand text-white px-2.5 py-1 text-[11px] font-semibold"
              >
                <CheckCircle size={12} />
                Approve
              </button>
              {!showReject ? (
                <button
                  type="button"
                  onClick={() => setShowReject(true)}
                  className="flex items-center gap-1 text-[11px] font-semibold text-[#b42318]"
                >
                  <XCircle size={12} />
                  Decline
                </button>
              ) : (
                <div className="w-full max-w-[200px] space-y-1">
                  <input
                    type="text"
                    value={rejectNote}
                    onChange={(e) => setRejectNote(e.target.value)}
                    placeholder="Optional note"
                    className="w-full rounded border border-black/10 px-2 py-1 text-[11px]"
                  />
                  <button
                    type="button"
                    onClick={() => void onStatus(id, 'rejected', rejectNote)}
                    className="w-full rounded bg-[#b42318] text-white py-1 text-[11px] font-semibold"
                  >
                    Confirm decline
                  </button>
                </div>
              )}
            </>
          )}
          {!showReviewActions && goal.status !== 'completed' && goal.status !== 'rejected' && (
            <>
              {goal.status === 'pending' && !isPatient && (
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
            </>
          )}
        </div>
      </div>
    </li>
  )
}
