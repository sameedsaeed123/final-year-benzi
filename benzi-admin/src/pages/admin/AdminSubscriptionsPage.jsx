import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout.jsx'
import AdminPageLoader from '../../components/AdminPageLoader.jsx'
import AdminPagination from '../../components/AdminPagination.jsx'
import { AdminAlert } from '../../components/AdminAlert.jsx'
import { api } from '../../lib/api.js'

import { paginateList, ADMIN_LIST_PAGE_SIZE } from '../../lib/adminPagination.js'

const statusStyles = {
  Active: 'bg-[#e7f4ee] text-[#1f5f4a]',
  Pending: 'bg-[#fff4df] text-[#b45309]',
  Inactive: 'bg-[#fde8e5] text-[#b42318]',
}

export default function AdminSubscriptionsPage() {
  const [plans, setPlans] = useState([])
  const [assignments, setAssignments] = useState([])
  const [doctors, setDoctors] = useState([])
  const [currentPage, setCurrentPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [assignForm, setAssignForm] = useState({
    therapistUserId: '',
    planSlug: '',
    billingInterval: 'monthly',
  })

  const load = () => {
    setLoading(true)
    setError('')
    return Promise.all([
      api('/admin/subscription/plans', { method: 'GET', silent: true }),
      api('/admin/subscription/assignments', { method: 'GET', silent: true }),
      api('/admin/doctors', { method: 'GET', silent: true }),
    ])
      .then(([plansJson, assignJson, docsJson]) => {
        const planList = plansJson.data?.plans || []
        setPlans(planList)
        setAssignments(assignJson.data?.assignments || [])
        const docList = Array.isArray(docsJson.data) ? docsJson.data : docsJson.data?.doctors || []
        setDoctors(docList)
        if (!assignForm.planSlug && planList[0]) {
          setAssignForm((f) => ({ ...f, planSlug: planList[0].slug }))
        }
      })
      .catch((e) => setError(e.message || 'Failed to load subscriptions'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    void load()
  }, [])

  const assignPlan = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api('/admin/subscription/assign', {
        method: 'POST',
        body: JSON.stringify(assignForm),
      })
      setSuccess('Plan assigned — therapist limits updated.')
      setAssignForm((f) => ({ ...f, therapistUserId: '' }))
      await load()
    } catch (e) {
      setError(e.message || 'Assign failed')
    } finally {
      setSaving(false)
    }
  }

  const {
    items: paginated,
    totalPages,
    currentPage: safePage,
    totalItems: assignmentTotal,
  } = paginateList(assignments, currentPage)

  const countByPlan = (slug) => assignments.filter((a) => a.planSlug === slug).length

  return (
    <AdminLayout activeItem="Subscriptions" title="Subscriptions">
      <AdminAlert type="error" message={error} onDismiss={() => setError('')} />
      <AdminAlert type="success" message={success} onDismiss={() => setSuccess('')} />

      <div className="flex flex-wrap gap-3">
        <Link
          to="/admin-plans"
          className="rounded-full bg-white border border-black/10 px-4 py-2 text-sm font-semibold text-brand hover:bg-[#f6f8f3]"
        >
          Edit plans & limits
        </Link>
        <Link
          to="/admin-coupons"
          className="rounded-full bg-white border border-black/10 px-4 py-2 text-sm font-semibold text-brand hover:bg-[#f6f8f3]"
        >
          Coupons
        </Link>
        <Link
          to="/admin-revenue"
          className="rounded-full bg-white border border-black/10 px-4 py-2 text-sm font-semibold text-brand hover:bg-[#f6f8f3]"
        >
          Revenue
        </Link>
      </div>

      <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {plans.map((p) => (
          <div key={p.slug} className="rounded-2xl border border-black/10 bg-white p-4 shadow-sm">
            <p className="font-bold text-[#0f3a2b]">{p.name}</p>
            <p className="text-[12px] text-[#7d8b7d] mt-1">
              ${p.priceMonthly}/mo · ${p.priceYearly}/yr
            </p>
            <p className="text-[11px] text-[#556b5b] mt-2">
              {countByPlan(p.slug)} active · max {p.maxPatients} patients · {p.limits?.aiMessageLimitMonthly}{' '}
              AI msgs/mo
            </p>
          </div>
        ))}
      </div>

      <form
        onSubmit={assignPlan}
        className="rounded-2xl border border-black/10 bg-white p-5 shadow-sm space-y-4"
      >
        <h2 className="text-[15px] font-bold text-[#0f3a2b]">Assign / change therapist plan</h2>
        <p className="text-[12px] text-[#7d8b7d]">
          Applies plan limits immediately (patients, AI messages, recommendations).
        </p>
        <div className="grid gap-3 sm:grid-cols-3">
          <label className="block text-[12px] font-semibold text-[#3f4f41]">
            Therapist
            <select
              required
              value={assignForm.therapistUserId}
              onChange={(e) => setAssignForm((f) => ({ ...f, therapistUserId: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm bg-white"
            >
              <option value="">Select doctor…</option>
              {doctors.map((d) => (
                <option key={d.userId} value={d.userId}>
                  {d.name} — {d.subscription || 'No plan'}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[12px] font-semibold text-[#3f4f41]">
            Plan
            <select
              required
              value={assignForm.planSlug}
              onChange={(e) => setAssignForm((f) => ({ ...f, planSlug: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm bg-white"
            >
              {plans.map((p) => (
                <option key={p.slug} value={p.slug}>
                  {p.name}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-[12px] font-semibold text-[#3f4f41]">
            Billing
            <select
              value={assignForm.billingInterval}
              onChange={(e) => setAssignForm((f) => ({ ...f, billingInterval: e.target.value }))}
              className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm bg-white"
            >
              <option value="monthly">Monthly</option>
              <option value="yearly">Yearly</option>
              <option value="free">Free</option>
            </select>
          </label>
        </div>
        <button
          type="submit"
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-brand text-white px-6 py-2.5 text-sm font-semibold disabled:opacity-60"
        >
          {saving && <Loader2 size={16} className="animate-spin" />}
          Assign plan
        </button>
      </form>

      <div className="rounded-2xl border border-black/10 bg-white overflow-hidden shadow-sm">
        <p className="p-4 font-semibold text-[#0f3a2b] border-b border-black/5">
          Therapist subscriptions ({assignments.length})
        </p>
        {loading ? (
          <div className="p-4">
            <AdminPageLoader label="Loading subscriptions…" className="min-h-[160px]" />
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-[#f6f8f3] text-left text-[11px] uppercase text-[#7d8b7d]">
                  <tr>
                    <th className="p-3">Doctor</th>
                    <th className="p-3">Plan</th>
                    <th className="p-3">Limits</th>
                    <th className="p-3">Billing</th>
                    <th className="p-3">Expires</th>
                    <th className="p-3">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {paginated.map((row) => (
                    <tr key={row.id} className="border-t border-black/5">
                      <td className="p-3">
                        <p className="font-semibold">{row.doctor}</p>
                        <p className="text-[11px] text-[#7d8b7d]">{row.email}</p>
                      </td>
                      <td className="p-3">{row.plan}</td>
                      <td className="p-3 text-[11px] text-[#556b5b]">
                        {row.limits ? (
                          <>
                            {row.limits.maxPatients} patients · {row.limits.aiMessageLimitMonthly} AI
                            msgs
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="p-3 capitalize">{row.billingInterval}</td>
                      <td className="p-3">
                        {row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="p-3">
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            statusStyles[row.status] || statusStyles.Pending
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!assignments.length && (
              <p className="p-6 text-[#7d8b7d] text-sm">No therapist subscriptions yet.</p>
            )}
            <AdminPagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={assignmentTotal}
              pageSize={ADMIN_LIST_PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </>
        )}
      </div>
    </AdminLayout>
  )
}
