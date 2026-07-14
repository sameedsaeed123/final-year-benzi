import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { Loader2 } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout.jsx'
import AdminPageLoader from '../../components/AdminPageLoader.jsx'
import AdminPagination from '../../components/AdminPagination.jsx'
import AdminPanel from '../../components/AdminPanel.jsx'
import { AdminAlert } from '../../components/AdminAlert.jsx'
import { ADMIN_LIST_PAGE_SIZE } from '../../lib/adminPagination.js'
import { api } from '../../lib/api.js'


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
  const [assignmentTotal, setAssignmentTotal] = useState(0)
  const [assignmentTotalPages, setAssignmentTotalPages] = useState(1)
  const [planCounts, setPlanCounts] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [assignForm, setAssignForm] = useState({
    therapistUserId: '',
    planSlug: '',
    billingInterval: 'monthly',
  })

  const load = (assignPage = currentPage) => {
    setLoading(true)
    setError('')
    return Promise.all([
      api('/admin/subscription/plans', { method: 'GET', silent: true }),
      api(
        `/admin/subscription/assignments?page=${assignPage}&limit=${ADMIN_LIST_PAGE_SIZE}`,
        { method: 'GET', silent: true }
      ),
      api('/admin/doctors?page=1&limit=100', { method: 'GET', silent: true }),
      api('/admin/subscription/revenue', { method: 'GET', silent: true }),
    ])
      .then(([plansJson, assignJson, docsJson, revenueJson]) => {
        const planList = plansJson.data?.plans || []
        setPlans(planList)
        setAssignments(assignJson.data?.assignments || [])
        setAssignmentTotal(assignJson.data?.total ?? 0)
        setAssignmentTotalPages(assignJson.data?.totalPages ?? 1)
        const distribution = revenueJson.data?.planDistribution || []
        setPlanCounts(Object.fromEntries(distribution.map((d) => [d.planSlug, d.count])))
        const docList = docsJson.data?.doctors || []
        setDoctors(docList)
        if (!assignForm.planSlug && planList[0]) {
          setAssignForm((f) => ({ ...f, planSlug: planList[0].slug }))
        }
      })
      .catch((e) => setError(e.message || 'Failed to load subscriptions'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    void load(currentPage)
  }, [currentPage])

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

  const countByPlan = (slug) => planCounts[slug] || 0

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

      {loading && !assignments.length ? (
        <AdminPageLoader label="Loading subscriptions…" />
      ) : (
        <AdminPanel title={`Therapist subscriptions (${assignmentTotal})`}>
          <div className={`overflow-x-auto -mx-5 px-5 transition-opacity ${loading ? 'opacity-50' : ''}`}>
            <table className="min-w-full border border-black/10 text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.15em] text-[#7d8b7d] bg-[#f7f4ef]">
                  <th className="px-3 py-3 border border-black/10">Doctor</th>
                  <th className="px-3 py-3 border border-black/10">Plan</th>
                  <th className="px-3 py-3 border border-black/10">Limits</th>
                  <th className="px-3 py-3 border border-black/10">Billing</th>
                  <th className="px-3 py-3 border border-black/10">Expires</th>
                  <th className="px-3 py-3 border border-black/10 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {assignments.length > 0 ? (
                  assignments.map((row) => (
                    <tr key={row.id} className="text-[#3f4f41] hover:bg-[#fafbfa]">
                      <td className="px-3 py-3 border border-black/10">
                        <p className="font-semibold text-brand">{row.doctor}</p>
                        <p className="text-[11px] text-[#7d8b7d]">{row.email}</p>
                      </td>
                      <td className="px-3 py-3 border border-black/10 font-semibold">{row.plan}</td>
                      <td className="px-3 py-3 border border-black/10 text-[11px] text-[#556b5b]">
                        {row.limits ? (
                          <>
                            {row.limits.maxPatients} patients · {row.limits.aiMessageLimitMonthly} AI
                            msgs/mo
                          </>
                        ) : (
                          '—'
                        )}
                      </td>
                      <td className="px-3 py-3 border border-black/10 capitalize">{row.billingInterval}</td>
                      <td className="px-3 py-3 border border-black/10">
                        {row.expiryDate ? new Date(row.expiryDate).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-3 py-3 border border-black/10 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                            statusStyles[row.status] || statusStyles.Pending
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#7d8b7d]">
                      No therapist subscriptions yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
          {assignmentTotal > 0 && (
            <AdminPagination
              currentPage={currentPage}
              totalPages={assignmentTotalPages}
              totalItems={assignmentTotal}
              pageSize={ADMIN_LIST_PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          )}
        </AdminPanel>
      )}
    </AdminLayout>
  )
}
