import { useState, useEffect, useCallback } from 'react'
import { Link } from 'react-router-dom'
import {
  Bell, ChevronRight, ChevronDown, Download, EyeOff,
  FileText, Plus, Search, UploadCloud, User, X,
} from 'lucide-react'
import TherapistSidebar from '../../components/TherapistSidebar'
import { useAuth } from '../../context/AuthContext.jsx'
import { displayFirstName } from '../../lib/userDisplay.js'
import { api, apiForm } from '../../lib/api.js'

const reviewStyles = {
  'Not Reviewed': 'bg-[#f2f6f1] text-[#3d6c4d]',
  'Half Reviewed': 'bg-[#edf2ec] text-[#5b705f]',
  Reviewed: 'bg-[#e7f1e8] text-[#1f5f4a]',
}

const REVIEW_OPTIONS = [
  { value: 'NOT_REVIEWED', label: 'Not Reviewed' },
  { value: 'HALF_REVIEWED', label: 'Half Reviewed' },
  { value: 'REVIEWED', label: 'Reviewed' },
]

const RECORD_TYPES = [
  { value: 'session_notes', label: 'Session Notes' },
  { value: 'clinical_report', label: 'Clinical Report' },
  { value: 'prescription', label: 'Prescription' },
  { value: 'lab_result', label: 'Lab Result' },
  { value: 'patient_upload', label: 'General Upload' },
]

// ─── Upload Modal ─────────────────────────────────────────────────────────────
function UploadModal({ patients, onClose, onUploaded }) {
  const [patientId, setPatientId] = useState(patients[0]?.id || '')
  const [file, setFile] = useState(null)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [type, setType] = useState('session_notes')
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    if (!file) { setError('Please select a file.'); return }
    if (!patientId) { setError('Please select a patient.'); return }
    setUploading(true)
    setError('')
    try {
      const fd = new FormData()
      fd.append('file', file)
      fd.append('patientUserId', patientId)
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
          <p className="text-[18px] font-semibold text-[#111]">Upload Report for Patient</p>
          <button onClick={onClose} className="rounded-full border border-black/10 p-2 text-[#2f4c40] hover:bg-[#f4f6f1]">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <div>
            <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Patient</label>
            <select value={patientId} onChange={(e) => setPatientId(e.target.value)}
              className="w-full rounded-2xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20">
              {patients.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.isAnonymous ? `🔒 ${p.name}` : p.name}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">File (PDF, Word, Image — max 10 MB)</label>
            <label className="flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-black/15 bg-[#f8faf8] px-4 py-4 text-sm text-[#556b5b] hover:bg-[#f0f4ee]">
              <UploadCloud size={18} className="text-[#0f4e34] shrink-0" />
              <span className="truncate">{file ? file.name : 'Click to select file'}</span>
              <input type="file" accept=".pdf,.doc,.docx,.jpg,.jpeg,.png,.webp" className="hidden"
                onChange={(e) => setFile(e.target.files?.[0] || null)} />
            </label>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Title</label>
              <input type="text" value={title} onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Session Notes — Jan 2026"
                className="w-full rounded-2xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
            </div>
            <div>
              <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Type</label>
              <select value={type} onChange={(e) => setType(e.target.value)}
                className="w-full rounded-2xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20">
                {RECORD_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Notes (optional)</label>
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

// ─── Review Notes Modal ───────────────────────────────────────────────────────
function ReviewModal({ record, onClose, onSaved }) {
  const [reviewStatus, setReviewStatus] = useState(record?.reviewStatusCode || 'NOT_REVIEWED')
  const [notes, setNotes] = useState(record?.therapistNotes || '')
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')

  const submit = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    try {
      await api(`/records/therapist/${record.id}/review`, {
        method: 'PATCH',
        body: JSON.stringify({ reviewStatus, therapistNotes: notes }),
      })
      onSaved()
      onClose()
    } catch (e) {
      setError(e.message || 'Failed to save review.')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <p className="text-[18px] font-semibold text-[#111]">Review Report</p>
          <button onClick={onClose} className="rounded-full border border-black/10 p-2 text-[#2f4c40] hover:bg-[#f4f6f1]">
            <X size={16} />
          </button>
        </div>
        <form onSubmit={submit} className="px-6 py-5 space-y-4">
          <p className="text-[13px] text-[#556b5b]">Report: <span className="font-semibold text-[#111]">{record?.title}</span></p>
          <div>
            <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Review Status</label>
            <div className="relative">
              <select value={reviewStatus} onChange={(e) => setReviewStatus(e.target.value)}
                className="w-full appearance-none rounded-2xl border border-black/10 bg-[#f5f5f5] px-4 py-3 pr-10 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20">
                {REVIEW_OPTIONS.map((o) => <option key={o.value} value={o.value}>{o.label}</option>)}
              </select>
              <ChevronDown size={14} className="pointer-events-none absolute right-4 top-1/2 -translate-y-1/2 text-[#7d8b7d]" />
            </div>
          </div>
          <div>
            <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Notes for Patient</label>
            <textarea rows={4} value={notes} onChange={(e) => setNotes(e.target.value)}
              placeholder="Add clinical notes, guidance, or observations…"
              className="w-full rounded-2xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-[13px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20" />
          </div>
          {error && <p className="text-sm text-red-700">{error}</p>}
          <div className="flex justify-end gap-3">
            <button type="button" onClick={onClose}
              className="rounded-full border border-black/10 px-5 py-2 text-sm font-semibold text-[#1f5f4a]">Cancel</button>
            <button type="submit" disabled={saving}
              className="rounded-full bg-[#0f4e34] px-6 py-2 text-sm font-semibold text-white disabled:opacity-60">
              {saving ? 'Saving…' : 'Save Review'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

// ─── Main Page ────────────────────────────────────────────────────────────────
export default function TherapistReportsPage() {
  const { user } = useAuth()
  const welcomeName = displayFirstName(user)
  const [patients, setPatients] = useState([])
  const [selectedPatientId, setSelectedPatientId] = useState('')
  const [reports, setReports] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)
  const [patientsLoading, setPatientsLoading] = useState(true)
  const [error, setError] = useState('')
  const [search, setSearch] = useState('')
  const [uploadOpen, setUploadOpen] = useState(false)
  const [reviewRecord, setReviewRecord] = useState(null)

  // Load linked patients
  const loadPatients = useCallback(async () => {
    setPatientsLoading(true)
    try {
      const json = await api('/records/therapist/patients', { method: 'GET' })
      if (json.success && json.data) {
        const list = json.data.patients || []
        setPatients(list)
        if (list.length > 0 && !selectedPatientId) {
          setSelectedPatientId(list[0].id)
        }
      }
    } catch (e) {
      setError(e.message || 'Could not load patients.')
    } finally {
      setPatientsLoading(false)
    }
  }, [selectedPatientId])

  // Load reports for selected patient
  const loadReports = useCallback(async () => {
    if (!selectedPatientId) return
    setLoading(true)
    setError('')
    try {
      const json = await api(`/records/therapist/patient/${selectedPatientId}`, { method: 'GET' })
      if (json.success && json.data) {
        setReports(json.data.records || [])
        setTotal(json.data.total || 0)
      }
    } catch (e) {
      setError(e.message || 'Could not load reports.')
    } finally {
      setLoading(false)
    }
  }, [selectedPatientId])

  useEffect(() => { void loadPatients() }, [])
  useEffect(() => { void loadReports() }, [loadReports])

  const selectedPatient = patients.find((p) => p.id === selectedPatientId)

  const filtered = search.trim()
    ? reports.filter((r) => r.title?.toLowerCase().includes(search.toLowerCase()))
    : reports

  return (
    <>
      <div className="pt-4" />
      <section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-brand/70">Reports</p>
            <h1 className="text-[36px] font-extrabold text-[#0f3a2b] max-[640px]:text-[28px]">{`Welcome ${welcomeName}!`}</h1>
          </div>
          <Link to="/therapist-profile"
            className="flex items-center gap-2 bg-white border border-black/10 rounded-full px-4 py-3 shadow-sm text-[14px] font-semibold text-[#111] transition-all hover:-translate-y-0.5">
            <Bell size={18} /><span>{welcomeName}</span><ChevronRight size={18} />
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_280px] max-[1280px]:grid-cols-1">
          <div className="space-y-6">

            {/* Patient Selector */}
            <div className="rounded-[24px] border border-black/5 bg-cream p-5 shadow-sm">
              <p className="text-[14px] font-semibold text-[#111] mb-3">Select Patient</p>
              {patientsLoading ? (
                <p className="text-sm text-[#7d8b7d]">Loading patients…</p>
              ) : patients.length === 0 ? (
                <p className="text-sm text-[#7d8b7d]">No linked patients yet. Patients appear here once they book an appointment with you.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {patients.map((p) => (
                    <button
                      key={p.id}
                      type="button"
                      onClick={() => setSelectedPatientId(p.id)}
                      className={`flex items-center gap-2 rounded-full px-4 py-2 text-[13px] font-semibold border transition ${
                        selectedPatientId === p.id
                          ? 'bg-[#0f4e34] text-white border-[#0f4e34]'
                          : 'bg-white text-[#2f4c40] border-black/10 hover:border-[#0f4e34]'
                      }`}
                    >
                      {p.isAnonymous ? (
                        <EyeOff size={13} />
                      ) : p.image ? (
                        <img src={p.image} alt={p.name} className="h-5 w-5 rounded-full object-cover" />
                      ) : (
                        <User size={13} />
                      )}
                      {p.name}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {/* Anonymous Notice */}
            {selectedPatient?.isAnonymous && (
              <div className="rounded-[20px] border border-[#0f4e34]/20 bg-[#f0f7f3] px-5 py-3 flex items-center gap-3">
                <EyeOff size={16} className="text-[#0f4e34] shrink-0" />
                <p className="text-[13px] text-[#1f5f4a]">
                  This patient has enabled <strong>Anonymous Mode</strong>. Their real name and contact details are hidden. You can only see their reports.
                </p>
              </div>
            )}

            {/* Reports Table */}
            {selectedPatientId && (
              <div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-[22px] font-semibold text-[#111]">
                      Reports — {selectedPatient?.name || '…'}
                    </p>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#556b5b]">
                      <span>All Reports</span>
                      <span className="rounded-full bg-[#e8f3ea] px-3 py-1 text-[#1f5f4a] font-semibold">{total}</span>
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadOpen(true)}
                    disabled={patients.length === 0}
                    className="inline-flex items-center gap-2 rounded-full bg-[#0f4e34] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#164e35] disabled:opacity-50">
                    <Plus size={16} /> Upload Report
                  </button>
                </div>

                {error && <p className="mt-3 text-sm text-red-700">{error}</p>}

                <div className="mt-5">
                  <div className="relative max-w-sm">
                    <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7b8b7d]" />
                    <input type="text" placeholder="Search by title…" value={search}
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
                        <th className="px-3 py-3 border border-black/10">Review Status</th>
                        <th className="px-3 py-3 border border-black/10">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {loading && (
                        <tr><td colSpan={5} className="px-3 py-6 text-center text-sm text-[#7d8b7d]">Loading reports…</td></tr>
                      )}
                      {!loading && filtered.length === 0 && (
                        <tr><td colSpan={5} className="px-3 py-6 text-center text-sm text-[#7d8b7d]">
                          {search ? 'No reports match your search.' : 'No reports for this patient yet.'}
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
                              {item.uploadedByRole === 'therapist' ? 'You' : 'Patient'}
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
                              {item.downloadBlocked ? (
                                <span className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-[#f8faf8] px-3 py-1.5 text-[12px] text-[#7d8b7d]"
                                  title={
                                    item.redactionStatus === 'NOT_APPLICABLE'
                                      ? 'This file cannot be redacted (non-PDF or scanned image). Download is blocked while patient is in Anonymous Mode.'
                                      : item.redactionStatus === 'FAILED'
                                      ? 'Redaction failed for this file. Download blocked while patient is in Anonymous Mode.'
                                      : 'Redaction in progress — check back shortly.'
                                  }>
                                  {item.redactionStatus === 'PROCESSING' ? '⏳ Processing…' : '🔒 Blocked (Anonymous)'}
                                </span>
                              ) : (
                                <a href={item.fileUrl} target="_blank" rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#1f5f4a] shadow-sm hover:bg-[#f0f4ee]">
                                  <Download size={13} /> {item.isAnonymous ? 'Redacted PDF' : 'Download'}
                                </a>
                              )}
                              <button type="button" onClick={() => setReviewRecord(item)}
                                className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-white px-3 py-1.5 text-[12px] font-semibold text-[#556b5b] shadow-sm hover:bg-[#f0f4ee]">
                                Review
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
            )}
          </div>

          <TherapistSidebar activeItem="Reports" />
        </div>
      </section>

      {uploadOpen && patients.length > 0 && (
        <UploadModal
          patients={patients}
          onClose={() => setUploadOpen(false)}
          onUploaded={() => { void loadReports() }}
        />
      )}
      {reviewRecord && (
        <ReviewModal
          record={reviewRecord}
          onClose={() => setReviewRecord(null)}
          onSaved={() => { void loadReports() }}
        />
      )}
    </>
  )
}
