import { useEffect, useMemo, useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronRight, Plus, Trash2 } from 'lucide-react'
import TherapistSidebar from '../../components/TherapistSidebar'
import { useAuth } from '../../context/AuthContext.jsx'
import { displayFirstName } from '../../lib/userDisplay.js'
import { api } from '../../lib/api.js'

const DAYS = [
  { key: 'mon', label: 'Monday' },
  { key: 'tue', label: 'Tuesday' },
  { key: 'wed', label: 'Wednesday' },
  { key: 'thu', label: 'Thursday' },
  { key: 'fri', label: 'Friday' },
  { key: 'sat', label: 'Saturday' },
  { key: 'sun', label: 'Sunday' },
]

const emptySlot = { start: '09:00', end: '17:00' }

function normalizeSlots(list) {
  return Array.isArray(list) && list.length ? list : []
}

export default function TherapistAvailabilityPage() {
  const { user } = useAuth()
  const welcomeName = displayFirstName(user)
  const [weeklyAvailability, setWeeklyAvailability] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [message, setMessage] = useState('')

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const json = await api('/therapists/availability/me', { method: 'GET' })
        if (!cancelled && json.success && json.data) {
          setWeeklyAvailability(json.data.weeklyAvailability || {})
        }
      } catch (e) {
        if (!cancelled) setError(e.message || 'Could not load availability.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const updateSlot = (dayKey, index, field, value) => {
    setWeeklyAvailability((prev) => {
      const next = { ...prev }
      const arr = normalizeSlots(next[dayKey]).map((slot, i) => (i === index ? { ...slot, [field]: value } : slot))
      next[dayKey] = arr
      return next
    })
  }

  const addSlot = (dayKey) => {
    setWeeklyAvailability((prev) => {
      const next = { ...prev }
      next[dayKey] = [...normalizeSlots(next[dayKey]), { ...emptySlot }]
      return next
    })
  }

  const removeSlot = (dayKey, index) => {
    setWeeklyAvailability((prev) => {
      const next = { ...prev }
      next[dayKey] = normalizeSlots(next[dayKey]).filter((_, i) => i !== index)
      return next
    })
  }

  const save = async () => {
    setSaving(true)
    setError('')
    setMessage('')
    try {
      const payload = {}
      for (const { key } of DAYS) {
        const slots = normalizeSlots(weeklyAvailability[key])
          .map((slot) => ({ start: String(slot.start || '').trim(), end: String(slot.end || '').trim() }))
          .filter((slot) => slot.start && slot.end)
        if (slots.length) payload[key] = slots
      }
      const json = await api('/therapists/availability/me', {
        method: 'PATCH',
        body: JSON.stringify(payload),
      })
      if (!json.success) throw new Error(json.message || 'Save failed')
      setWeeklyAvailability(json.data?.weeklyAvailability || payload)
      setMessage('Availability updated.')
    } catch (e) {
      setError(e.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const filledDays = useMemo(
    () => DAYS.filter(({ key }) => normalizeSlots(weeklyAvailability[key]).length > 0).length,
    [weeklyAvailability]
  )

  return (
    <>
      <div className="pt-4" />
      <section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-brand/70">Availability</p>
            <h1 className="text-[36px] font-extrabold text-[#0f3a2b] max-[640px]:text-[28px]">{`Welcome ${welcomeName}!`}</h1>
          </div>
          <Link
            to="/therapist-profile"
            className="flex items-center gap-2 bg-white border border-black/10 rounded-full px-4 py-3 shadow-sm text-[14px] font-semibold text-[#111] transition-all hover:-translate-y-0.5"
          >
            <Bell size={18} />
            <span>{welcomeName}</span>
            <ChevronRight size={18} />
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_280px] max-[1280px]:grid-cols-1">
          <div className="space-y-6">
            <div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[22px] font-semibold text-[#111]">Weekly availability</p>
                  <p className="mt-2 text-sm text-[#556b5b]">Set your available time windows for each day.</p>
                </div>
                <button
                  type="button"
                  onClick={() => void save()}
                  disabled={saving}
                  className="rounded-full bg-[#0f4e34] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#164e35] disabled:opacity-60"
                >
                  {saving ? 'Saving…' : 'Save slots'}
                </button>
              </div>

              {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
              {message && <p className="mt-4 text-sm text-[#1f5f4a]">{message}</p>}
              {loading && <p className="mt-4 text-sm text-[#66746b]">Loading availability…</p>}

              <div className="mt-6 space-y-4">
                {DAYS.map(({ key, label }) => {
                  const slots = normalizeSlots(weeklyAvailability[key])
                  return (
                    <div key={key} className="rounded-2xl border border-black/10 bg-white p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="text-[15px] font-semibold text-[#111]">{label}</p>
                          <p className="text-[12px] text-[#66746b]">{slots.length ? `${slots.length} slot(s)` : 'No slots set'}</p>
                        </div>
                        <button
                          type="button"
                          onClick={() => addSlot(key)}
                          className="inline-flex items-center gap-2 rounded-full border border-black/10 bg-[#f7f4ee] px-4 py-2 text-sm font-semibold text-[#1f5f4a]"
                        >
                          <Plus size={14} />
                          Add slot
                        </button>
                      </div>

                      <div className="mt-4 space-y-3">
                        {slots.length === 0 ? (
                          <p className="text-sm text-[#66746b]">Add a time window to make this day bookable.</p>
                        ) : (
                          slots.map((slot, index) => (
                            <div key={`${key}-${index}`} className="grid gap-3 md:grid-cols-[1fr_1fr_auto] items-center">
                              <div>
                                <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-1">Start</label>
                                <input
                                  type="time"
                                  value={slot.start}
                                  onChange={(e) => updateSlot(key, index, 'start', e.target.value)}
                                  className="w-full rounded-xl border border-black/10 bg-[#f8faf8] px-4 py-2.5 text-[13px]"
                                />
                              </div>
                              <div>
                                <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-1">End</label>
                                <input
                                  type="time"
                                  value={slot.end}
                                  onChange={(e) => updateSlot(key, index, 'end', e.target.value)}
                                  className="w-full rounded-xl border border-black/10 bg-[#f8faf8] px-4 py-2.5 text-[13px]"
                                />
                              </div>
                              <div className="pt-6">
                                <button
                                  type="button"
                                  onClick={() => removeSlot(key, index)}
                                  className="inline-flex h-11 w-11 items-center justify-center rounded-full border border-black/10 bg-white text-[#7a5b4b]"
                                >
                                  <Trash2 size={16} />
                                </button>
                              </div>
                            </div>
                          ))
                        )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <TherapistSidebar activeItem="Availability" />
        </div>
      </section>
    </>
  )
}
