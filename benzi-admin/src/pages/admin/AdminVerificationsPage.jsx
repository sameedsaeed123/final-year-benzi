import { useState, useEffect } from 'react'
import AdminSidebar from '../../components/AdminSidebar'
import { api } from '../../lib/api'
import { ShieldAlert, FileText, Check, X, Loader2, ExternalLink, UserCheck } from 'lucide-react'

export default function AdminVerificationsPage() {
  const [requests, setRequests] = useState([])
  const [loading, setLoading] = useState(true)
  const [actioningId, setActioningId] = useState(null)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const fetchRequests = async () => {
    try {
      setLoading(true)
      const res = await api('/admin/pending-verifications')
      if (res.success) {
        setRequests(res.data)
      }
    } catch (err) {
      console.error('Error fetching verifications:', err)
      setErrorMsg('Failed to load pending verifications.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchRequests()
  }, [])

  const handleDecision = async (id, approve) => {
    setErrorMsg('')
    setSuccessMsg('')
    try {
      setActioningId(id)
      const res = await api(`/admin/verify-therapist/${id}`, {
        method: 'POST',
        body: JSON.stringify({ approve })
      })
      if (res.success) {
        setSuccessMsg(res.message)
        // Refresh list
        await fetchRequests()
      } else {
        setErrorMsg(res.message || 'Operation failed')
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred.')
    } finally {
      setActioningId(null)
    }
  }

  const getDocBaseUrl = () => {
    return import.meta.env.VITE_API_URL || ''
  }

  return (
    <div className="flex min-h-screen bg-cream font-sans">
      <AdminSidebar activeItem="Verification Requests" />

      <main className="flex-1 px-10 py-8 max-[1024px]:px-6 max-[768px]:px-4 max-[480px]:px-3">
        {/* Top Header */}
        <header className="mb-8 flex items-center justify-between border-b border-black/5 pb-5 max-[768px]:flex-col max-[768px]:items-start max-[768px]:gap-4">
          <div>
            <h1 className="text-[26px] font-extrabold text-[#0f3a2b]">Therapist Verifications</h1>
            <p className="text-[13px] text-[#7d8b7d]">Review legit medical licenses, experience credentials, and approve therapist signups</p>
          </div>
        </header>

        {errorMsg && (
          <div className="mb-6 rounded-2xl border border-red-200 bg-red-50 p-4 text-center text-sm font-semibold text-red-600">
            {errorMsg}
          </div>
        )}

        {successMsg && (
          <div className="mb-6 rounded-2xl border border-green-200 bg-green-50 p-4 text-center text-sm font-semibold text-green-600">
            {successMsg}
          </div>
        )}

        {loading ? (
          <div className="flex h-[300px] flex-col items-center justify-center rounded-[30px] border border-black/5 bg-white shadow-sm">
            <Loader2 className="animate-spin text-brand h-10 w-10 mb-4" />
            <p className="text-sm font-semibold text-brand">Fetching pending validation requests...</p>
          </div>
        ) : requests.length === 0 ? (
          <div className="flex h-[250px] flex-col items-center justify-center rounded-[30px] border border-black/5 bg-white p-6 text-center shadow-sm">
            <div className="mb-4 rounded-full bg-green-50 p-4 text-green-500">
              <UserCheck size={32} />
            </div>
            <h3 className="text-lg font-bold text-[#0f3a2b]">All Caught Up!</h3>
            <p className="mt-1 text-sm text-[#7d8b7d] max-w-sm">
              There are no pending therapist verification requests in the database right now.
            </p>
          </div>
        ) : (
          <div className="grid gap-6 md:grid-cols-1">
            {requests.map((req) => (
              <div 
                key={req.id} 
                className="rounded-[30px] border border-black/5 bg-white p-6 shadow-sm flex flex-col md:flex-row md:items-start justify-between gap-6 hover:shadow-md transition"
              >
                <div className="space-y-4 flex-1">
                  {/* Name and specialty */}
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-lg">
                      {req.name.split(' ').map(n => n[0]).join('').replace('Dr.', '')}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0f3a2b]">{req.name}</h3>
                      <p className="text-xs text-[#7d8b7d]">{req.specializationTitle} • {req.qualification}</p>
                    </div>
                  </div>

                  {/* Profile info cards */}
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 border border-black/5 bg-cream/30 rounded-2xl p-4 text-xs text-[#2e3f34]">
                    <div>
                      <p className="font-semibold text-brand/75 mb-0.5">University / Institute</p>
                      <p className="font-bold text-[#111]">{req.university}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-brand/75 mb-0.5">Legit Experience</p>
                      <p className="font-bold text-[#111]">{req.experienceYears} Years</p>
                    </div>
                    <div>
                      <p className="font-semibold text-brand/75 mb-0.5">Email & Phone</p>
                      <p className="font-bold text-[#111]">{req.email}</p>
                      <p className="text-[10px] text-[#7d8b7d]">{req.phone || 'No phone provided'}</p>
                    </div>
                  </div>

                  {/* Action link documents */}
                  <div className="space-y-2">
                    <p className="text-xs font-bold text-[#0f3a2b]">Uploaded Credentials Documents:</p>
                    <div className="flex flex-wrap gap-3">
                      {[
                        { label: 'Degree / Medical License', url: req.degreeUrl },
                        { label: 'Legit Experience Letter', url: req.experienceLetterUrl },
                        { label: 'CNIC Scan Copy', url: req.cnicUrl }
                      ].map((doc, idx) => (
                        <a 
                          key={idx}
                          href={`${getDocBaseUrl()}${doc.url}`}
                          target="_blank"
                          rel="noreferrer"
                          className="inline-flex items-center gap-1.5 bg-cream hover:bg-brand/10 border border-black/10 hover:border-brand/30 px-3.5 py-1.5 rounded-full text-xs font-bold text-[#0f3a2b] transition"
                        >
                          <FileText size={14} className="text-brand" />
                          {doc.label}
                          <ExternalLink size={11} className="ml-0.5 opacity-60" />
                        </a>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Approve / Reject Actions */}
                <div className="flex sm:flex-row md:flex-col gap-3 shrink-0 self-stretch md:self-auto justify-end">
                  <button
                    disabled={actioningId !== null}
                    onClick={() => handleDecision(req.id, true)}
                    className="flex items-center justify-center gap-1.5 rounded-full bg-green-600 hover:bg-green-700 text-white text-xs font-bold px-5 py-3 transition shadow-sm disabled:opacity-50"
                  >
                    {actioningId === req.id ? (
                      <Loader2 className="animate-spin h-3.5 w-3.5" />
                    ) : (
                      <Check size={14} />
                    )}
                    Approve Therapist
                  </button>

                  <button
                    disabled={actioningId !== null}
                    onClick={() => handleDecision(req.id, false)}
                    className="flex items-center justify-center gap-1.5 rounded-full bg-red-50 hover:bg-red-100 border border-red-200 text-red-600 text-xs font-bold px-5 py-3 transition disabled:opacity-50"
                  >
                    <X size={14} />
                    Reject Request
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>
    </div>
  )
}
