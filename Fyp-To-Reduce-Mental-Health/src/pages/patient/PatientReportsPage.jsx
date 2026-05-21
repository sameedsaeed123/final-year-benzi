import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell, ChevronRight, Download, FileText, Plus, Search,
  Trash2, UploadCloud, X, MessageSquare, EyeOff, RefreshCw,
} from 'lucide-react'
import PatientSidebar from '../../components/PatientSidebar'
import { useAuth } from '../../context/AuthContext.jsx'
import { displayFirstName } from '../../lib/userDisplay.js'
import { api, apiForm } from '../../lib/api.js'

const reviewStyles = {
  'Not Reviewed': 'bg-[#f2f6f1] text-[#3d6c4d]',
  'Half Reviewed': 'bg-[#edf2ec] text-[#5b705f]',
  Reviewed: 'bg-[#e7f1e8] text-[#1f5f4a]',
}

const RECORD_TYPES = [
  { value: 'patient_upload', label: 'My Upload' },
  { value: 'clinical_report', label: 'Clinical Report' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'lab_result', label: 'Lab Result' },
  { value: 'session_notes', label: 'Session Notes' },
]

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ onClose, onUploaded }) {
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('patient_upload')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!file) { setError('Please select a file.'); return }
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('title', title || file.name)
      fd.append('description', description)
      fd.append('type', type)
      await apiForm('/records/upload', fd)
      onUploaded()
      onClose()
    } catch (e) {
      setError(e.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-lg rounded-3xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <p className="text-[18px] font-semibold text-[#111]">Upload Report</p>
          <button onClick={onClose} className="rounded-full border border-black/10 p-2 text-[#2f4c40] hover:bg-[#f4f6f1]">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">File (PDF, Word, Image — max 10 MB)</label>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-black/15 bg-[#f8faf8] px-4 py-4 text-sm text-[#556b5b] hover:bg-[#f0f4ee]">
              <UploadCloud size={18} className="text-[#0f4e34] shrink-0" />
              <span className="truncate">{file ? file.name : 'Click to select file'}</span>
              <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Title</label>
            <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Blood Test Results Jan 2026"
              className="w-full rounded-2xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Type</label>
            <select value={type} onChange={(e) => setType(e.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20">
              {RECORD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Description (optional)</label>
            <textarea rows={2} value={description} onChange={(e) => setDescription(e.target.value)}
              placeholder="Brief notes about this report…"
              className="w-full rounded-2xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-3 pt-2">
            <button type="button" onClick={onClose}
              className="rounded-full border border-black/10 px-5 py-2 text-sm font-semibold text-[#1f5f4a]">Cancel</button>
            <button type="submit" disabled={uploading}
              className="rounded-full bg-[#0f4e34] px-6 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {uploading ? 'Uploading…' : 'Upload'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Feedback Modal ───────────────────────────────────────────────────────────
function FeedbackModal({ record, onClose, onSaved }) {
  const [feedback, setFeedback] = useState(record?.patientFeedback || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api(`/records/${record.id}/feedback`, {
        method: 'POST',
        body: JSON.stringify({ feedback }),
      })
      onSaved()
      onClose()
    } catch (e) {
      setError(e.message || 'Failed to save feedback.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <p className="text-[18px] font-semibold text-[#111]">Add Feedback</p>
          <button onClick={onClose} className="rounded-full border border-black/10 p-2 text-[#2f4c40] hover:bg-[#f4f6f1]">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <p className="text-[13px] text-[#556b5b]">Report: <span className="font-semibold text-[#111]">{record?.title}</span></p>
          <textarea rows={4} value={feedback} onChange={(e) => setFeedback(e.target.value)}
            placeholder="Your feedback or notes on this report…"
            className="w-full rounded-2xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="rounded-full border border-black/10 px-5 py-2 text-sm font-semibold text-[#1f5f4a]">Cancel</button>
            <button type="submit" disabled={saving}
              className="rounded-full bg-[#0f4e34] px-6 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Feedback'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function PatientReportsPage() {
  const { user } = useAuth()
  const welcomeName = displayFirstName(user)
  const [reports, setReports] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [feedbackRecord, setFeedbackRecord] = useState(null)
  const [deletingId, setDeletingId] = useState(null)
  const [anonymousMode, setAnonymousMode] = useState(false)
  const [anonymousAlias, setAnonymousAlias] = useState('')
  const [togglingAnon, setTogglingAnon] = useState(false)
  const [retryingRedaction, setRetryingRedaction] = useState(false)

  const loadReports = useCallback(async () => {
    setLoading(true)
    setError('')
    try {
      const json = await api('/records/patient/me', { method: 'GET' })
      if (json.success && json.data) {
        setReports(json.data.records || [])
        setTotal(json.data.total || 0)
      }
    } catch (e) {
      setError(e.message || 'Could not load reports.')
    } finally {
      setLoading(false)
    }
  }, [])

  const loadAnonymousStatus = useCallback(async () => {
    try {
      const json = await api('/records/anonymous/status', { method: 'GET' })
      if (json.success && json.data) {
        setAnonymousMode(json.data.anonymousModeEnabled)
        setAnonymousAlias(json.data.anonymousAlias)
      }
    } catch { /* silent */ }
  }, [])

  useEffect(() => {
    void loadReports()
    void loadAnonymousStatus()
  }, [loadReports, loadAnonymousStatus])

  const toggleAnonymous = async () => {
    setTogglingAnon(true)
    try {
      const json = await api('/records/anonymous/toggle', {
        method: 'POST',
        body: JSON.stringify({ enable: !anonymousMode }),
      })
      if (json.success && json.data) {
        setAnonymousMode(json.data.anonymousModeEnabled)
        setAnonymousAlias(json.data.anonymousAlias)
        // Reload reports to see updated redaction status
        await loadReports()
      }
    } catch (e) {
      setError(e.message || 'Could not toggle anonymous mode.')
    } finally {
      setTogglingAnon(false)
    }
  }

  const retryRedaction = async () => {
    setRetryingRedaction(true)
    setError('')
    try {
      const json = await api('/records/anonymous/retry-redaction', {
        method: 'POST',
      })
      if (json.success) {
        // Wait a moment then reload to show updated status
        setTimeout(() => {
          void loadReports()
        }, 1000)
      }
    } catch (e) {
      setError(e.message || 'Could not retry redaction.')
    } finally {
      setRetryingRedaction(false)
    }
  }

  const deleteReport = async (id) => {
    if (!window.confirm('Delete this report? This cannot be undone.')) return
    setDeletingId(id)
    try {
      await api(`/records/${id}`, { method: 'DELETE' })
      await loadReports()
    } catch (e) {
      setError(e.message || 'Could not delete report.')
    } finally {
      setDeletingId(null)
    }
  }

  const filtered = search.trim()
    ? reports.filter((r) =>
        r.title?.toLowerCase().includes(search.toLowerCase()) ||
        r.uploadedBy?.toLowerCase().includes(search.toLowerCase())
      )
    : reports

  return (
    <>
      <div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
      <section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-brand/70">Reports</p>
            <h1 className="text-[36px] font-extrabold text-[#0f3a2b] max-[640px]:text-[28px]">{`Welcome ${welcomeName}!`}</h1>
          </div>
          <Link to="/patient-profile"
            className="flex items-center gap-2 bg-white border border-black/10 rounded-full px-4 py-3 shadow-sm text-[14px] font-semibold text-[#111] transition-all hover:-translate-y-0.5">
            <Bell size={18} /><span>{welcomeName}</span><ChevronRight size={18} />
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_280px] max-[1280px]:grid-cols-1">
          <div className="space-y-6">

            {/* Anonymous Mode Banner */}
            <div className={`rounded-[24px] border px-5 py-4 flex flex-wrap items-center justify-between gap-4 ${anonymousMode ? 'border-[#0f4e34]/20 bg-[#f0f7f3]' : 'border-black/5 bg-cream'}`}>
              <div className="flex items-center gap-3">
                <span className={`h-9 w-9 rounded-full flex items-center justify-center ${anonymousMode ? 'bg-[#0f4e34] text-white' : 'bg-[#e8f3ea] text-[#1f5f4a]'}`}>
                  <EyeOff size={16} />
                </span>
                <div>
                  <p className="text-[14px] font-semibold text-[#111]">
                    Anonymous Mode {anonymousMode ? <span className="text-[#0f4e34]">— Active</span> : '— Off'}
                  </p>
                  <p className="text-[12px] text-[#556b5b]">
                    {anonymousMode
                      ? `Your therapist sees you as "${anonymousAlias}". Your name is hidden from reports.`
                      : 'Your therapist can see your name and reports normally.'}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {anonymousMode && (
                  <button
                    type="button"
                    onClick={retryRedaction}
                    disabled={retryingRedaction}
                    className="inline-flex items-center gap-2 rounded-full border border-[#0f4e34]/20 bg-white px-4 py-2 text-[13px] font-semibold text-[#0f4e34] transition hover:bg-[#f8faf8] disabled:opacity-50"
                    title="Retry redaction for stuck reports">
                    <RefreshCw size={14} className={retryingRedaction ? 'animate-spin' : ''} />
                    {retryingRedaction ? 'Retrying…' : 'Retry Redaction'}
                  </button>
                )}
                <button
                  type="button"
                  onClick={toggleAnonymous}
                  disabled={togglingAnon}
                  className={`rounded-full px-5 py-2 text-[13px] font-semibold transition disabled:opacity-50 ${anonymousMode ? 'bg-[#f6f1ec] text-[#7a5b4b] hover:bg-[#ede8e3]' : 'bg-[#0f4e34] text-white hover:bg-[#164e35]'}`}>
                  {togglingAnon ? 'Updating…' : anonymousMode ? 'Disable Anonymous' : 'Enable Anonymous'}
                </button>
              </div>
            </div>

            {/* Reports Table */}
            <div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[22px] font-semibold text-[#111]">My Reports</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#556b5b]">
                    <span>All Reports</span>
                    <span className="rounded-full bg-[#e8f3ea] px-3 py-1 text-[#1f5f4a] font-semibold">{total}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setUploadOpen(true)}
                  className="inline-flex items-center gap-2 rounded-full bg-[#0f4e34] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#164e35]">
                  <Plus size={16} /> Upload Report
                </button>
              </div>

              {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

              <div className="mt-5">
                <div className="relative max-w-sm">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7b8b7d]" />
                  <input type="text" placeholder="Search by title or uploader…" value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="w-full rounded-full border border-black/10 bg-[#f8faf8] py-3 pl-12 pr-4 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border border-black/10 border-collapse">
                  <thead>
                    <tr className="text-left text-[12px] uppercase tracking-[0.2em] text-[#7d8b7d] bg-[#f7f4ef]">
                      <th className="px-3 py-3 border border-black/10">Report</th>
                      <th className="px-3 py-3 border border-black/10">Uploaded By</th>
                      <th className="px-3 py-3 border border-black/10">Date</th>
                      <th className="px-3 py-3 border border-black/10">Status</th>
                      <th className="px-3 py-3 border border-black/10">Actions</th>
                    </tr>
                  </thead>
                  <tbody>
                    {loading && (
                      <tr><td colSpan={5} className="px-3 py-6 text-center text-sm text-[#7d8b7d]">Loading reports…</td></tr>
                    )}
                    {!loading && filtered.length === 0 && (
                      <tr><td colSpan={5} className="px-3 py-6 text-center text-sm text-[#7d8b7d]">
                        {search ? 'No reports match your search.' : 'No reports yet. Upload your first report above.'}
                      </td></tr>
                    )}
                    {!loading && filtered.map((item) => (
                      <tr key={item.id} className="text-sm text-[#3f4f41]">
                        <td className="px-3 py-4 border border-black/10">
                          <div className="flex items-center gap-2">
                            <FileText size={15} className="text-[#1f5f4a] shrink-0" />
                            <div>
                              <p className="font-semibold text-[#111] leading-tight">{item.title}</p>
                              {item.description && <p className="text-[11px] text-[#7d8b7d] mt-0.5">{item.description}</p>}
                            </div>
                          </div>
                        </td>
                        <td className="px-3 py-4 border border-black/10">
                          <span className={`text-[12px] ${item.uploadedByRole === 'therapist' ? 'text-[#1f5f4a] font-semibold' : 'text-[#556b5b]'}`}>
                            {item.uploadedByRole === 'therapist' ? `Dr. ${item.uploadedBy}` : 'You'}
                          </span>
                        </td>
                        <td className="px-3 py-4 border border-black/10 text-[#556b5b]">{item.createdAt}</td>
                        <td className="px-3 py-4 border border-black/10">
                          <span className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1 text-[12px] font-semibold ${reviewStyles[item.reviewStatus] || reviewStyles['Not Reviewed']}`}>
                            <span className="h-1.5 w-1.5 rounded-full bg-current" />
                            {item.reviewStatus}
                          </span>
                        </td>
                        <td className="px-3 py-4 border border-black/10">
                          <div className="flex items-center gap-2">
                            <a href={item.fileUrl} target="_blank" rel="noreferrer"
                              className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#1f5f4a] shadow-sm hover:bg-[#f0f4ee]">
                              <Download size={13} /> Download
                            </a>
                            <button type="button" onClick={() => setFeedbackRecord(item)}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-[#556b5b] shadow-sm hover:bg-[#f0f4ee]"
                              title="Add feedback">
                              <MessageSquare size={13} />
                            </button>
                            <button type="button" onClick={() => deleteReport(item.id)}
                              disabled={deletingId === item.id}
                              className="inline-flex h-8 w-8 items-center justify-center rounded-full border border-black/10 bg-white text-[#c0392b] shadow-sm hover:bg-[#fdf0ee] disabled:opacity-50"
                              title="Delete report">
                              <Trash2 size={13} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
              <div className="mt-4 text-sm text-[#7d8b7d]">
                {!loading && `Showing ${filtered.length} of ${total} report${total !== 1 ? 's' : ''}`}
              </div>
            </div>

            {/* Therapist Notes Panel */}
            {reports.some((r) => r.therapistNotes) && (
              <div className="rounded-[24px] border border-black/5 bg-cream p-6 shadow-sm">
                <p className="text-[18px] font-semibold text-[#111] mb-4">Therapist Notes on Your Reports</p>
                <div className="space-y-3">
                  {reports.filter((r) => r.therapistNotes).map((r) => (
                    <div key={r.id} className="rounded-2xl border border-black/5 bg-[#f8faf8] p-4">
                      <p className="text-[12px] font-semibold text-[#1f5f4a]">{r.title}</p>
                      <p className="mt-1 text-[13px] text-[#3f4f41]">{r.therapistNotes}</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* AI Context Placeholder */}
            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[20px] border border-dashed border-black/10 bg-cream p-6">
                <p className="text-[16px] font-semibold text-[#111]">AI Context</p>
                <p className="mt-2 text-sm text-[#7d8b7d]">Your uploaded reports will be used to provide personalised AI insights. Coming soon.</p>
              </div>
              <div className="rounded-[20px] border border-dashed border-black/10 bg-cream p-6">
                <p className="text-[16px] font-semibold text-[#111]">Therapist Notes</p>
                <p className="mt-2 text-sm text-[#7d8b7d]">Notes and guidance from your therapist will appear here after report review.</p>
              </div>
            </div>
          </div>

          <PatientSidebar activeItem="Reports" />
        </div>
      </section>

      {uploadOpen && (
        <UploadModal onClose={() => setUploadOpen(false)} onUploaded={loadReports} />
      )}
      {feedbackRecord && (
        <FeedbackModal record={feedbackRecord} onClose={() => setFeedbackRecord(null)} onSaved={loadReports} />
      )}
    </>
  )
}
