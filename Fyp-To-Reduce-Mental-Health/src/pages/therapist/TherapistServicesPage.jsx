import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronRight, Plus, Pencil, Trash2 } from 'lucide-react'
import TherapistSidebar from '../../components/TherapistSidebar'
import { useAuth } from '../../context/AuthContext.jsx'
import { displayFirstName } from '../../lib/userDisplay.js'
import { api } from '../../lib/api.js'

const SERVICE_TYPES = [
  'Individual Therapy',
  'Couples Therapy',
  'Group Therapy',
  'Family Therapy',
  'Cognitive Behavioral Therapy (CBT)',
  'Dialectical Behavior Therapy (DBT)',
  'Trauma Therapy',
  'Anxiety & Stress Management',
  'Depression Counselling',
  'Career Counselling',
  'Child & Adolescent Therapy',
  'Grief Counselling',
  'Addiction Counselling',
  'Online Therapy',
]

const emptyDraft = {
  name: '',
  type: 'Individual Therapy',
  description: '',
  durationMinutes: '60',
  pricePkr: '',
  isActive: true,
}

function pkrFromStored(cents) {
  return Math.round((Number(cents) || 0) / 100)
}

export default function TherapistServicesPage() {
  const { user } = useAuth()
  const welcomeName = displayFirstName(user)
  const [services, setServices] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [draft, setDraft] = useState(emptyDraft)
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [editForm, setEditForm] = useState(null)

  const load = useCallback(async () => {
    setError('')
    try {
      const json = await api('/therapists/services/me', { method: 'GET' })
      if (json.success && json.data?.services) {
        setServices(json.data.services)
        setTotal(json.data.services.length)
      }
    } catch (e) {
      setError(e.message || 'Could not load services.')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    void load()
  }, [load])

  const createService = async (e) => {
    e.preventDefault()
    setCreating(true)
    setError('')
    try {
      const pricePkr = Number(draft.pricePkr)
      if (!draft.name.trim() || Number.isNaN(pricePkr) || pricePkr < 0) {
        setError('Name and valid PKR price are required.')
        setCreating(false)
        return
      }
      await api('/therapists/services', {
        method: 'POST',
        body: JSON.stringify({
          name: draft.name.trim(),
          type: draft.type.trim() || 'Individual Therapy',
          description: draft.description.trim(),
          durationMinutes: Number(draft.durationMinutes) || 60,
          pricePerSession: Math.round(pricePkr * 100),
          isActive: draft.isActive,
        }),
      })
      setDraft(emptyDraft)
      await load()
    } catch (e) {
      setError(e.message || 'Create failed.')
    } finally {
      setCreating(false)
    }
  }

  const startEdit = (s) => {
    setEditingId(s.id)
    setEditForm({
      name: s.name,
      type: s.type || 'Individual Therapy',
      description: s.description || '',
      durationMinutes: String(s.durationMinutes ?? 60),
      pricePkr: String(pkrFromStored(s.pricePerSession)),
      isActive: s.isActive !== false,
    })
  }

  const saveEdit = async (id) => {
    if (!editForm) return
    setError('')
    try {
      const pricePkr = Number(editForm.pricePkr)
      await api(`/therapists/services/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({
          name: editForm.name.trim(),
          type: editForm.type.trim(),
          description: editForm.description.trim(),
          durationMinutes: Number(editForm.durationMinutes) || 60,
          pricePerSession: Math.round(pricePkr * 100),
          isActive: editForm.isActive,
        }),
      })
      setEditingId(null)
      setEditForm(null)
      await load()
    } catch (e) {
      setError(e.message || 'Update failed.')
    }
  }

  const remove = async (id) => {
    if (!window.confirm('Delete this service?')) return
    setError('')
    try {
      await api(`/therapists/services/${id}`, { method: 'DELETE' })
      await load()
    } catch (e) {
      setError(e.message || 'Delete failed.')
    }
  }

  return (
    <>
      <div className="pt-4" />
      <section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-brand/70">Services</p>
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
                  <p className="text-[22px] font-semibold text-[#111]">Services</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#556b5b]">
                    <span>All services</span>
                    <span className="rounded-full bg-[#e8f3ea] px-3 py-1 text-[#1f5f4a] font-semibold">{total}</span>
                  </div>
                </div>
              </div>

              {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

              <form onSubmit={createService} className="mt-6 rounded-2xl border border-black/10 bg-[#f7f7f2] p-4 space-y-3">
                <p className="text-[14px] font-semibold text-[#111]">Add service</p>
                <div className="grid gap-3 sm:grid-cols-2">
                  <input
                    placeholder="Service name"
                    value={draft.name}
                    onChange={(e) => setDraft((d) => ({ ...d, name: e.target.value }))}
                    className="rounded-xl border border-black/10 px-3 py-2 text-[13px]"
                  />
                  <select
                    value={draft.type}
                    onChange={(e) => setDraft((d) => ({ ...d, type: e.target.value }))}
                    className="rounded-xl border border-black/10 px-3 py-2 text-[13px] bg-white"
                  >
                    {SERVICE_TYPES.map((t) => (
                      <option key={t} value={t}>{t}</option>
                    ))}
                  </select>
                  <input
                    placeholder="Duration (minutes)"
                    value={draft.durationMinutes}
                    onChange={(e) => setDraft((d) => ({ ...d, durationMinutes: e.target.value }))}
                    className="rounded-xl border border-black/10 px-3 py-2 text-[13px]"
                  />
                  <input
                    placeholder="Price (PKR per session)"
                    value={draft.pricePkr}
                    onChange={(e) => setDraft((d) => ({ ...d, pricePkr: e.target.value }))}
                    className="rounded-xl border border-black/10 px-3 py-2 text-[13px]"
                  />
                </div>
                <textarea
                  placeholder="Description"
                  value={draft.description}
                  onChange={(e) => setDraft((d) => ({ ...d, description: e.target.value }))}
                  rows={2}
                  className="w-full rounded-xl border border-black/10 px-3 py-2 text-[13px]"
                />
                <label className="flex items-center gap-2 text-[13px] text-[#333]">
                  <input
                    type="checkbox"
                    checked={draft.isActive}
                    onChange={(e) => setDraft((d) => ({ ...d, isActive: e.target.checked }))}
                    className="accent-brand"
                  />
                  Active (shown on public directory)
                </label>
                <button
                  type="submit"
                  disabled={creating}
                  className="inline-flex items-center gap-2 rounded-full bg-[#0f4e34] px-4 py-2 text-sm font-semibold text-white hover:bg-[#164e35] disabled:opacity-50"
                >
                  <Plus size={16} />
                  {creating ? 'Saving…' : 'New service'}
                </button>
              </form>

              {loading && <p className="mt-6 text-[#666]">Loading…</p>}

              <div className="mt-6 grid gap-6 lg:grid-cols-2 items-start">
                {services.map((service, index) => (
                  <div
                    key={service.id}
                    className={`rounded-[22px] bg-[#0f5a50] text-white p-5 shadow-sm ${index === 1 ? 'lg:mt-16' : ''}`}
                  >
                    {editingId === service.id && editForm ? (
                      <div className="space-y-2 text-[12.5px]">
                        <input
                          value={editForm.name}
                          onChange={(e) => setEditForm((f) => ({ ...f, name: e.target.value }))}
                          className="w-full rounded-lg px-2 py-1 text-[#111]"
                        />
                        <select
                          value={editForm.type}
                          onChange={(e) => setEditForm((f) => ({ ...f, type: e.target.value }))}
                          className="w-full rounded-lg px-2 py-1 text-[#111] bg-white"
                        >
                          {SERVICE_TYPES.map((t) => (
                            <option key={t} value={t}>{t}</option>
                          ))}
                        </select>
                        <input
                          value={editForm.durationMinutes}
                          onChange={(e) => setEditForm((f) => ({ ...f, durationMinutes: e.target.value }))}
                          className="w-full rounded-lg px-2 py-1 text-[#111]"
                        />
                        <input
                          value={editForm.pricePkr}
                          onChange={(e) => setEditForm((f) => ({ ...f, pricePkr: e.target.value }))}
                          className="w-full rounded-lg px-2 py-1 text-[#111]"
                          placeholder="PKR"
                        />
                        <textarea
                          value={editForm.description}
                          onChange={(e) => setEditForm((f) => ({ ...f, description: e.target.value }))}
                          rows={2}
                          className="w-full rounded-lg px-2 py-1 text-[#111]"
                        />
                        <label className="flex items-center gap-2 text-white/90">
                          <input
                            type="checkbox"
                            checked={editForm.isActive}
                            onChange={(e) => setEditForm((f) => ({ ...f, isActive: e.target.checked }))}
                          />
                          Active
                        </label>
                        <div className="flex gap-2 pt-2">
                          <button type="button" onClick={() => void saveEdit(service.id)} className="rounded-full bg-white/20 px-3 py-1 text-[12px] font-semibold">
                            Save
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setEditingId(null)
                              setEditForm(null)
                            }}
                            className="rounded-full bg-white/10 px-3 py-1 text-[12px]"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="rounded-[16px] bg-[#0c4b43] px-4 py-3 text-center text-[14px] font-semibold">
                          {service.name}
                          {!service.isActive && <span className="ml-2 text-[11px] opacity-80">(inactive)</span>}
                        </div>
                        <div className="mt-4 space-y-3 text-[12.5px]">
                          <p>
                            <span className="font-semibold">Service offered: </span>
                            {service.type}
                          </p>
                          <p>
                            <span className="font-semibold">Price: </span>
                            PKR {pkrFromStored(service.pricePerSession)} / {service.durationMinutes} min
                          </p>
                          <p className="leading-5">
                            <span className="font-semibold">Description: </span>
                            {service.description || '—'}
                          </p>
                        </div>
                        <div className="mt-4 flex items-center justify-center gap-3">
                          <button
                            type="button"
                            onClick={() => startEdit(service)}
                            className="inline-flex items-center gap-2 rounded-full bg-[#1a6a5e] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1e7367]"
                          >
                            <Pencil size={14} />
                            Edit
                          </button>
                          <button
                            type="button"
                            onClick={() => void remove(service.id)}
                            className="inline-flex items-center gap-2 rounded-full bg-[#1a6a5e] px-4 py-2 text-[12px] font-semibold text-white hover:bg-[#1e7367]"
                          >
                            <Trash2 size={14} />
                            Delete
                          </button>
                        </div>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          </div>

          <TherapistSidebar activeItem="Services" />
        </div>
      </section>
    </>
  )
}
