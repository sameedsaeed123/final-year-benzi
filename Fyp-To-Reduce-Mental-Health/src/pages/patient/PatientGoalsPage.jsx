import { useState, useEffect, useMemo, useRef, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Bell, CheckCircle, ChevronRight, MessageCircle, Moon, ShieldCheck, Sparkles, Target } from 'lucide-react'
import PatientSidebar from '../../components/PatientSidebar'
import { api } from '../../lib/api.js'
import { sanitizeAiText } from '../../lib/textSanitize.js'

const iconByTitle = (title) => {
  const t = String(title || '').toLowerCase()
  if (t.includes('sleep')) return Moon
  if (t.includes('stress') || t.includes('anxiety')) return ShieldCheck
  if (t.includes('communic')) return MessageCircle
  return Target
}

export default function PatientGoalsPage() {
  const [goals, setGoals] = useState([])
  const [analytics, setAnalytics] = useState(null)
  const [selectedGoalId, setSelectedGoalId] = useState(null)
  const [loading, setLoading] = useState(true)
  const [goalDraft, setGoalDraft] = useState('')
  const [insight, setInsight] = useState('')
  const [insightTips, setInsightTips] = useState([])
  const [previewRecs, setPreviewRecs] = useState([])
  const [insightLoading, setInsightLoading] = useState(false)
  const [previewLoading, setPreviewLoading] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [submitMsg, setSubmitMsg] = useState('')
  const [submitError, setSubmitError] = useState('')
  const previewTimer = useRef(null)

  const insightDate = useMemo(
    () => new Date().toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: '2-digit' }),
    []
  )

  const loadInsight = useCallback(async (draft = '') => {
    setInsightLoading(true)
    try {
      const q = draft ? `?draft=${encodeURIComponent(draft)}` : ''
      const json = await api(`/ai/goals/insight/me${q}`, { method: 'GET', silent: true })
      setInsight(json.data?.insight || '')
      setInsightTips(json.data?.tips || [])
    } catch {
      setInsight('')
      setInsightTips([])
    } finally {
      setInsightLoading(false)
    }
  }, [])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const [goalsJson, analyticsJson] = await Promise.all([
          api('/ai/goals/me', { method: 'GET' }),
          api('/ai/analytics/me', { method: 'GET' }),
        ])
        if (!cancelled) {
          const g = goalsJson.data?.goals || []
          setGoals(g)
          setAnalytics(analyticsJson.data || null)
          if (g.length && !selectedGoalId) setSelectedGoalId(String(g[0]._id || g[0].id))
        }
      } catch {
        if (!cancelled) {
          setGoals([])
          setAnalytics(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  useEffect(() => {
    void loadInsight('')
  }, [loadInsight])

  useEffect(() => {
    if (previewTimer.current) clearTimeout(previewTimer.current)
    const draft = goalDraft.trim()
    if (draft.length < 3) {
      setPreviewRecs([])
      return
    }
    previewTimer.current = setTimeout(() => {
      setPreviewLoading(true)
      api('/ai/goals/preview/me', {
        method: 'POST',
        body: JSON.stringify({ draft }),
        silent: true,
      })
        .then((json) => setPreviewRecs(json.data?.recommendations || []))
        .catch(() => setPreviewRecs([]))
        .finally(() => setPreviewLoading(false))
      void loadInsight(draft)
    }, 700)
    return () => {
      if (previewTimer.current) clearTimeout(previewTimer.current)
    }
  }, [goalDraft, loadInsight])

  const handleSubmitGoal = async () => {
    const title = goalDraft.trim()
    if (!title) {
      setSubmitError('Write your goal before submitting.')
      return
    }
    setSubmitting(true)
    setSubmitError('')
    setSubmitMsg('')
    try {
      const json = await api('/ai/goals/submit-proposal', {
        method: 'POST',
        body: JSON.stringify({ title, description: title }),
      })
      setSubmitMsg(json.data?.message || 'Goal sent to your therapist.')
      setGoalDraft('')
      const goalsJson = await api('/ai/goals/me', { method: 'GET', silent: true })
      setGoals(goalsJson.data?.goals || [])
      void loadInsight('')
    } catch (e) {
      setSubmitError(e.message || 'Could not submit goal.')
    } finally {
      setSubmitting(false)
    }
  }

  const reviewCounts = useMemo(() => {
    const s = analytics?.sentimentCounts || { negative: 0, neutral: 0, positive: 0 }
    return [
      { label: 'Negative', value: s.negative, color: '#D6E3D6' },
      { label: 'Neutral', value: s.neutral, color: '#8CA287' },
      { label: 'Positive', value: s.positive, color: '#1F5F4A' },
    ]
  }, [analytics])

  const goalStatusPct = useMemo(() => {
    const total = goals.length || 1
    const completed = goals.filter((g) => g.status === 'completed').length
    const inProgress = goals.filter((g) => g.status === 'in-progress').length
    const pending = goals.filter((g) => g.status === 'pending').length
    return {
      completed: Math.round((completed / total) * 100),
      inProgress: Math.round((inProgress / total) * 100),
      pending: Math.round((pending / total) * 100),
    }
  }, [goals])

  const selectedGoal = goals.find((g) => String(g._id || g.id) === String(selectedGoalId))
  const activeGoals = goals.filter((g) => g.status !== 'completed')
  const stressScore = analytics?.progressBars?.find((b) => b.label === 'Mental Health')?.pct ?? 0
  const communicationScore = analytics?.progressCenterPct ?? 0

  const handleStatusUpdate = async (goalId, status) => {
    try {
      await api(`/ai/goals/${goalId}/status`, {
        method: 'PATCH',
        body: JSON.stringify({ status }),
      })
      const goalsJson = await api('/ai/goals/me', { method: 'GET' })
      setGoals(goalsJson.data?.goals || [])
    } catch {
      /* ignore */
    }
  }

  return (
    <>
      <div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
      <section className="bg-cream min-h-screen px-5 py-8 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
        <div className="grid gap-5 xl:grid-cols-[2.4fr_280px] max-[1280px]:grid-cols-1">
          <div className="space-y-5">
            <div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
              <div className="max-w-full">
                <p className="text-sm uppercase tracking-[0.2em] text-[#7d8b7d]">Set Your Goal</p>
                <h1 className="mt-2 text-[28px] font-semibold text-[#111] max-[640px]:text-[26px]">
                  Let’s set some goals together to support your mental well-being.
                </h1>
                <p className="mt-4 text-sm leading-6 text-[#5f6c5d]">
                  What would you like to achieve or improve upon during your time here?
                </p>
              </div>

              {loading && <p className="mt-6 text-sm text-[#7d8b7d]">Loading your therapy goals…</p>}
              {!loading && goals.length === 0 && (
                <p className="mt-6 text-sm text-[#5f6c5d]">
                  No goals assigned yet. Your therapist will assign goals — or chat with{' '}
                  <Link to="/patient-chat?tab=benzi" className="text-brand font-semibold">BENZI AI</Link> to track mood.
                </p>
              )}
              <div className="mt-8 grid gap-4 lg:grid-cols-3">
                {goals.map((goal) => {
                  const Icon = iconByTitle(goal.title)
                  const gid = String(goal._id || goal.id)
                  const isSelected = selectedGoalId === gid
                  return (
                    <button
                      key={gid}
                      type="button"
                      onClick={() => setSelectedGoalId(gid)}
                      className={`rounded-[26px] border p-2 text-left transition ${isSelected
                        ? 'border-brand bg-[#f0fbf3] shadow-sm'
                        : 'border-black/10 bg-[#f8f8f3] hover:border-brand'
                        }`}
                    >
                      <div className="flex items-center justify-between gap-3">
                        <div className={`flex h-12 w-12 items-center justify-center rounded-3xl ${isSelected ? 'bg-brand text-white' : 'bg-[#eff6ee] text-[#1f5f4a]'
                          }`}>
                          <Icon size={18} />
                        </div>
                        <span className="text-[10px] uppercase font-semibold text-[#7d8b7d]">{goal.status}</span>
                      </div>
                      <h3 className="mt-6 text-[15px] font-semibold text-[#0f3a2b]">{sanitizeAiText(goal.title)}</h3>
                      <p className="mt-3 text-sm text-[#5f6c5d]">{sanitizeAiText(goal.description) || 'Assigned by your therapist'}</p>
                      {goal.submittedBy === 'patient' && (
                        <p className="mt-2 text-[11px] text-[#7a5b4b] font-medium">Sent to therapist</p>
                      )}
                      {goal.aiRecommended && goal.submittedBy !== 'patient' && (
                        <p className="mt-2 text-[11px] text-brand font-medium">AI recommended</p>
                      )}
                    </button>
                  )
                })}
              </div>

              {selectedGoal && selectedGoal.status !== 'completed' && (
                <div className="mt-6 flex flex-wrap gap-3">
                  {selectedGoal.status === 'pending' && (
                    <button
                      type="button"
                      onClick={() => void handleStatusUpdate(selectedGoal._id || selectedGoal.id, 'in-progress')}
                      className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white"
                    >
                      Start goal
                    </button>
                  )}
                  {selectedGoal.status === 'in-progress' && (
                    <button
                      type="button"
                      onClick={() => void handleStatusUpdate(selectedGoal._id || selectedGoal.id, 'completed')}
                      className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white"
                    >
                      Mark complete
                    </button>
                  )}
                </div>
              )}
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
                <p className="text-sm uppercase tracking-[0.2em] text-[#7d8b7d]">AI chat sentiment</p>
                <div className="mt-3">
                  <div className="flex items-end gap-2">
                    <div className="h-10 w-10 rounded-xl bg-[#d6e3d6]" />
                    <div className="h-10 w-13 rounded-xl bg-[#b6ccb7]" />
                    <div className="h-10 w-16 rounded-xl bg-[#8ca287]" />
                    <div className="h-10 w-20 rounded-xl bg-[#1f5f4a]" />
                  </div>
                </div>
                <div className="mt-8 grid grid-cols-3 gap-3 text-center text-sm text-[#556b5b]">
                  {reviewCounts.map((item) => (
                    <div key={item.label} className="rounded-3xl bg-[#f6f8f3] p-4">
                      <div className="mx-auto mb-3 h-3 w-3 rounded-full" style={{ backgroundColor: item.color }} />
                      <p className="font-semibold text-[#23382d]">{item.value}</p>
                      <p>{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="rounded-[30px] border border-black/5 bg-cream p-5 shadow-sm">
                <p className="text-sm uppercase tracking-[0.2em] text-[#7d8b7d]">Current Status</p>
                <h3 className=" text-[22px] font-semibold text-[#111]">Understanding your current status helps us provide tailored support.</h3>
                <p className=" text-sm text-[#5f6c5d]">How would you describe your current condition for the selected options?</p>

                <div className="mt-2 space-y-6">
                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm font-semibold text-[#23382d]">
                      <span>{selectedGoal?.title || 'Mental health'}</span>
                      <span>{stressScore}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-[#e8f2e9] relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 rounded-full bg-brand" style={{ width: `${stressScore}%` }} />
                      <div className="absolute left-[32%] top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-4 border-white bg-[#16603d] shadow-sm" />
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center justify-between text-sm font-semibold text-[#23382d]">
                      <span>Goal completion</span>
                      <span>{communicationScore}%</span>
                    </div>
                    <div className="h-3 rounded-full bg-[#e8f2e9] relative overflow-hidden">
                      <div className="absolute inset-y-0 left-0 rounded-full bg-[#527f62]" style={{ width: `${communicationScore}%` }} />
                      <div className="absolute left-[50%] top-1/2 h-4 w-4 -translate-y-1/2 rounded-full border-4 border-white bg-[#35634a] shadow-sm" />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div className="grid gap-6 lg:grid-cols-[1.3fr_0.95fr]">
              <div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
                <div className="flex items-center justify-between gap-4 flex-wrap">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-[#7d8b7d]">Administration</p>
                    <h3 className="text-[22px] font-semibold text-[#111]">Goals</h3>
                  </div>
                </div>

                <div className="mt-8 flex justify-center">
                  <div className="relative h-64 w-64">
                    <div className="absolute left-0 top-8 h-44 w-44 rounded-full bg-[#1f5f4a] shadow-[0_0_0_12px_rgba(31,95,74,0.1)] flex items-center justify-center text-[32px] font-bold text-white">
                      {goalStatusPct.completed}%
                    </div>
                    <div className="absolute right-0 top-0 h-28 w-28 rounded-full bg-[#4f7b63] shadow-sm flex items-center justify-center text-sm font-semibold text-white">
                      {goalStatusPct.inProgress}%
                    </div>
                    <div className="absolute right-10 bottom-0 h-24 w-24 rounded-full bg-[#97bfa5] shadow-sm flex items-center justify-center text-sm font-semibold text-white">
                      {goalStatusPct.pending}%
                    </div>
                  </div>
                </div>

                <div className="mt-8 flex flex-wrap items-center justify-center gap-4 text-sm text-[#556b5b]">
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-brand" />Completed
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#4f7b63]" />In progress
                  </span>
                  <span className="flex items-center gap-2">
                    <span className="h-2 w-2 rounded-full bg-[#97bfa5]" />Pending
                  </span>
                </div>
              </div>

              <div className="rounded-[30px] border border-black/5 bg-cream p-5 shadow-sm">
                <div className="flex items-center justify-between gap-3 flex-wrap">
                  <div>
                    <p className="text-sm uppercase tracking-[0.2em] text-[#7d8b7d]">Please Write your Goal</p>
                    <p className="text-sm text-[#5f6c5d]">Share a goal you'd like to work on and get tailored recommendations.</p>
                  </div>
                  <button
                    type="button"
                    disabled={submitting || !goalDraft.trim()}
                    onClick={() => void handleSubmitGoal()}
                    className="rounded-full bg-brand px-5 py-2 text-sm font-semibold text-white transition hover:bg-[#1b513a] disabled:opacity-50"
                  >
                    {submitting ? 'Sending…' : 'Submit to therapist'}
                  </button>
                </div>
                {submitMsg && <p className="mt-2 text-[12px] font-medium text-[#1f5f4a]">{submitMsg}</p>}
                {submitError && <p className="mt-2 text-[12px] text-red-700">{submitError}</p>}

                <textarea
                  rows={2}
                  value={goalDraft}
                  onChange={(e) => setGoalDraft(e.target.value)}
                  placeholder="write your goal here..."
                  className="mt-3 w-full rounded-[24px] border border-black/10 bg-[#f8f8f3] p-5 text-sm text-[#2e3f34] outline-none transition focus:border-brand focus:ring-2 focus:ring-brand/20"
                />

                {(previewLoading || previewRecs.length > 0) && (
                  <div className="mt-3 flex flex-wrap gap-2">
                    {previewLoading && <span className="text-[11px] text-[#7d8b7d]">Updating suggestions…</span>}
                    {previewRecs.map((rec, i) => (
                      <button
                        key={i}
                        type="button"
                        onClick={() => setGoalDraft(sanitizeAiText(rec.title || rec.description || ''))}
                        className="rounded-full border border-brand/30 bg-white px-3 py-1.5 text-[11px] font-medium text-[#1f5f4a] hover:bg-[#f0fbf3]"
                      >
                        {sanitizeAiText(rec.title)}
                      </button>
                    ))}
                  </div>
                )}

                <div className="mt-2 rounded-[26px] border border-black/5 bg-[#f7f8f4] p-3">
                  <div className="flex items-center justify-between gap-3 flex-wrap">
                    <p className="text-sm uppercase tracking-[0.1em] text-[#7d8b7d]">Insights & Recommendations</p>
                    <span className="text-[11px] text-[#7d8b7d]">{insightDate}</span>
                  </div>
                  <div className="mt-2 rounded-3xl bg-white p-4 shadow-sm min-h-[80px]">
                    {insightLoading && !insight && (
                      <p className="text-sm text-[#6b7b6a]">Building insights from your reports & chat…</p>
                    )}
                    {!insightLoading && insight && (
                      <p className="text-sm text-[#2e3f34] leading-relaxed">{insight}</p>
                    )}
                    {!insightLoading && !insight && (
                      <p className="text-sm text-[#6b7b6a]">
                        Start typing a goal or{' '}
                        <Link to="/patient-chat?tab=benzi" className="text-brand font-semibold">chat with BENZI AI</Link>{' '}
                        to unlock personalized insights.
                      </p>
                    )}
                    {insightTips.length > 0 && (
                      <ul className="mt-3 space-y-1.5 text-[12px] text-[#556b5b] list-disc pl-4">
                        {insightTips.map((tip, i) => (
                          <li key={i}>{tip}</li>
                        ))}
                      </ul>
                    )}
                  </div>
                </div>
              </div>
            </div>
          </div>

          <PatientSidebar activeItem="Goals" />
        </div>
      </section>
    </>
  )
}
