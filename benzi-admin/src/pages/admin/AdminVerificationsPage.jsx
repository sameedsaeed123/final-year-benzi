import { useState, useEffect } from 'react'
import AdminPagination from '../../components/AdminPagination.jsx'
import { paginateList, ADMIN_LIST_PAGE_SIZE } from '../../lib/adminPagination.js'
import { Check, X, Loader2, FileText, ExternalLink, UserCheck } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout.jsx'
import AdminPageLoader from '../../components/AdminPageLoader.jsx'
import AdminPanel from '../../components/AdminPanel.jsx'
import { AdminAlert } from '../../components/AdminAlert.jsx'
import { useAdminGet } from '../../hooks/useAdminQuery.js'
import { api } from '../../lib/api.js'

export default function AdminVerificationsPage() {
  const { data: requests, loading, error, setError, reload } = useAdminGet('/admin/pending-verifications')
  const [actioningId, setActioningId] = useState(null)
  const [success, setSuccess] = useState('')

  const list = Array.isArray(requests) ? requests : []
  const [listPage, setListPage] = useState(1)
  const {
    items: paginatedList,
    totalPages: listTotalPages,
    currentPage: listSafePage,
    totalItems: listTotal,
  } = paginateList(list, listPage)

  useEffect(() => {
    setListPage(1)
  }, [list.length])

  const handleDecision = async (id, approve) => {
    setError('')
    setSuccess('')
    try {
      setActioningId(id)
      const res = await api(`/admin/verify-therapist/${id}`, {
        method: 'POST',
        body: JSON.stringify({ approve }),
      })
      setSuccess(res.message || (approve ? 'Therapist approved' : 'Request rejected'))
      await reload()
    } catch (e) {
      setError(e.message || 'Operation failed')
    } finally {
      setActioningId(null)
    }
  }

  const docBase = import.meta.env.VITE_API_URL || ''

  return (
    <AdminLayout activeItem="Verification Requests" title="Therapist verifications">
      <p className="text-sm text-[#556b5b] -mt-2 mb-2">
        Review licenses and credentials, then approve or reject therapist signups.
      </p>

      <AdminAlert type="error" message={error} onDismiss={() => setError('')} />
      <AdminAlert type="success" message={success} onDismiss={() => setSuccess('')} />

      {loading ? (
        <AdminPageLoader label="Loading verification requests…" />
      ) : list.length === 0 ? (
        <AdminPanel>
          <div className="flex flex-col items-center py-8 text-center">
            <div className="mb-4 rounded-full bg-[#e7f4ee] p-4 text-brand">
              <UserCheck size={32} />
            </div>
            <h3 className="text-lg font-bold text-[#0f3a2b]">All caught up</h3>
            <p className="mt-1 text-sm text-[#7d8b7d] max-w-sm">
              No pending therapist verification requests right now.
            </p>
          </div>
        </AdminPanel>
      ) : (
        <div className="space-y-4">
          {paginatedList.map((req) => (
            <AdminPanel key={req.id} className="!p-0">
              <div className="p-5 flex flex-col lg:flex-row lg:items-start justify-between gap-6">
                <div className="space-y-4 flex-1 min-w-0">
                  <div className="flex items-center gap-3">
                    <div className="h-12 w-12 rounded-full bg-brand/10 text-brand flex items-center justify-center font-bold text-lg shrink-0">
                      {(req.name || '?')
                        .split(' ')
                        .map((n) => n[0])
                        .join('')
                        .replace('Dr.', '')
                        .slice(0, 2)}
                    </div>
                    <div>
                      <h3 className="text-lg font-bold text-[#0f3a2b]">{req.name}</h3>
                      <p className="text-xs text-[#7d8b7d]">
                        {req.specializationTitle} · {req.qualification}
                      </p>
                    </div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 rounded-xl border border-black/5 bg-cream/40 p-4 text-xs">
                    <div>
                      <p className="font-semibold text-brand/75 mb-0.5">University</p>
                      <p className="font-bold text-[#111]">{req.university || '—'}</p>
                    </div>
                    <div>
                      <p className="font-semibold text-brand/75 mb-0.5">Experience</p>
                      <p className="font-bold text-[#111]">{req.experienceYears ?? '—'} years</p>
                    </div>
                    <div>
                      <p className="font-semibold text-brand/75 mb-0.5">Contact</p>
                      <p className="font-bold text-[#111]">{req.email}</p>
                      <p className="text-[10px] text-[#7d8b7d]">{req.phone || 'No phone'}</p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs font-bold text-[#0f3a2b] mb-2">Documents</p>
                    <div className="flex flex-wrap gap-2">
                      {[
                        { label: 'Degree / License', url: req.degreeUrl },
                        { label: 'Experience letter', url: req.experienceLetterUrl },
                        { label: 'CNIC', url: req.cnicUrl },
                      ].map((doc) =>
                        doc.url ? (
                          <a
                            key={doc.label}
                            href={`${docBase}${doc.url}`}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full border border-black/10 bg-cream px-3 py-1.5 text-xs font-semibold text-[#0f3a2b] hover:border-brand/40"
                          >
                            <FileText size={14} className="text-brand" />
                            {doc.label}
                            <ExternalLink size={11} className="opacity-60" />
                          </a>
                        ) : null
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-row lg:flex-col gap-2 shrink-0">
                  <button
                    type="button"
                    disabled={actioningId !== null}
                    onClick={() => void handleDecision(req.id, true)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full bg-brand text-white text-xs font-bold px-5 py-3 disabled:opacity-50"
                  >
                    {actioningId === req.id ? (
                      <Loader2 className="animate-spin h-3.5 w-3.5" />
                    ) : (
                      <Check size={14} />
                    )}
                    Approve
                  </button>
                  <button
                    type="button"
                    disabled={actioningId !== null}
                    onClick={() => void handleDecision(req.id, false)}
                    className="inline-flex items-center justify-center gap-1.5 rounded-full border border-[#b42318]/30 bg-[#fef2f2] text-[#b42318] text-xs font-bold px-5 py-3 disabled:opacity-50"
                  >
                    <X size={14} />
                    Reject
                  </button>
                </div>
              </div>
            </AdminPanel>
          ))}
          <AdminPagination
            currentPage={listSafePage}
            totalPages={listTotalPages}
            totalItems={listTotal}
            pageSize={ADMIN_LIST_PAGE_SIZE}
            onPageChange={setListPage}
          />
        </div>
      )}
    </AdminLayout>
  )
}
