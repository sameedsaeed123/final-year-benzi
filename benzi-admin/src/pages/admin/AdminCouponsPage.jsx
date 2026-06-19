import { useEffect, useState } from 'react'
import AdminPagination from '../../components/AdminPagination.jsx'
import { Loader2 } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout.jsx'
import AdminPageLoader from '../../components/AdminPageLoader.jsx'
import { AdminAlert } from '../../components/AdminAlert.jsx'
import { api } from '../../lib/api.js'

export default function AdminCouponsPage() {
  const [coupons, setCoupons] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [couponPage, setCouponPage] = useState(1)
  const [couponTotal, setCouponTotal] = useState(0)
  const [couponTotalPages, setCouponTotalPages] = useState(1)
  const [plans, setPlans] = useState([])
  const [form, setForm] = useState({
    code: '',
    description: '',
    percentOff: '10',
    planSlug: '',
    maxRedemptions: '',
  })

  const load = (page = couponPage) => {
    setLoading(true)
    setError('')
    return Promise.all([
      api(`/admin/subscription/coupons?page=${page}&limit=5`, { method: 'GET', silent: true }),
      api('/admin/subscription/plans', { method: 'GET', silent: true }),
    ])
      .then(([couponsJson, plansJson]) => {
        setCoupons(couponsJson.data?.coupons || [])
        setCouponTotal(couponsJson.data?.total ?? 0)
        setCouponTotalPages(couponsJson.data?.totalPages ?? 1)
        setPlans(plansJson.data?.plans || [])
      })
      .catch((e) => setError(e.message || 'Failed to load coupons'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    void load(couponPage)
  }, [couponPage])

  const create = async (e) => {
    e.preventDefault()
    setSaving(true)
    setError('')
    setSuccess('')
    try {
      await api('/admin/subscription/coupons', {
        method: 'POST',
        body: JSON.stringify({
          code: form.code,
          description: form.description,
          percentOff: Number(form.percentOff) || null,
          planSlugs: form.planSlug ? [form.planSlug] : [],
          maxRedemptions: form.maxRedemptions ? Number(form.maxRedemptions) : null,
        }),
      })
      setSuccess(`Coupon ${form.code.toUpperCase()} created`)
      setForm({ code: '', description: '', percentOff: '10', planSlug: '', maxRedemptions: '' })
      await load()
    } catch (e) {
      setError(e.message || 'Create failed')
    } finally {
      setSaving(false)
    }
  }

  const toggleActive = async (id, active) => {
    setError('')
    try {
      await api(`/admin/subscription/coupons/${id}`, {
        method: 'PATCH',
        body: JSON.stringify({ active: !active }),
      })
      await load()
    } catch (e) {
      setError(e.message || 'Update failed')
    }
  }

  return (
    <AdminLayout activeItem="Coupons" title="Coupons">
      <AdminAlert type="error" message={error} onDismiss={() => setError('')} />
      <AdminAlert type="success" message={success} onDismiss={() => setSuccess('')} />

      <div className="grid gap-8 lg:grid-cols-[minmax(280px,360px)_1fr]">
        <form
          onSubmit={create}
          className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm h-fit space-y-3"
        >
          <h2 className="font-bold text-[#0f3a2b]">New coupon</h2>
          <input
            required
            placeholder="CODE"
            value={form.code}
            onChange={(e) => setForm((f) => ({ ...f, code: e.target.value.toUpperCase() }))}
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm"
          />
          <input
            placeholder="Description"
            value={form.description}
            onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm"
          />
          <input
            type="number"
            min="1"
            max="100"
            placeholder="% off"
            value={form.percentOff}
            onChange={(e) => setForm((f) => ({ ...f, percentOff: e.target.value }))}
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm"
          />
          <select
            value={form.planSlug}
            onChange={(e) => setForm((f) => ({ ...f, planSlug: e.target.value }))}
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm bg-white"
          >
            <option value="">All plans</option>
            {plans.map((p) => (
              <option key={p.slug} value={p.slug}>
                {p.name}
              </option>
            ))}
          </select>
          <input
            placeholder="Max redemptions (optional)"
            value={form.maxRedemptions}
            onChange={(e) => setForm((f) => ({ ...f, maxRedemptions: e.target.value }))}
            className="w-full rounded-xl border border-black/10 px-3 py-2.5 text-sm"
          />
          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-xl bg-brand text-white py-2.5 font-semibold text-sm disabled:opacity-60 inline-flex justify-center items-center gap-2"
          >
            {saving && <Loader2 size={16} className="animate-spin" />}
            Create coupon
          </button>
        </form>

        <div className="rounded-2xl border border-black/10 bg-white overflow-hidden shadow-sm">
          {loading ? (
            <AdminPageLoader label="Loading coupons…" className="min-h-[200px]" />
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-[#f6f8f3] text-left text-[11px] uppercase tracking-wider text-[#7d8b7d]">
                <tr>
                  <th className="p-3">Code</th>
                  <th className="p-3">Discount</th>
                  <th className="p-3">Used</th>
                  <th className="p-3">Plans</th>
                  <th className="p-3">Status</th>
                  <th className="p-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {coupons.map((c) => (
                  <tr key={c._id} className="border-t border-black/5">
                    <td className="p-3 font-semibold">{c.code}</td>
                    <td className="p-3">
                      {c.percentOff ? `${c.percentOff}%` : `$${((c.amountOffCents || 0) / 100).toFixed(2)}`}
                    </td>
                    <td className="p-3">
                      {c.timesRedeemed}
                      {c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ''}
                    </td>
                    <td className="p-3 text-[11px] text-[#7d8b7d]">
                      {(c.planSlugs || []).join(', ') || 'All'}
                    </td>
                    <td className="p-3">{c.active ? 'Active' : 'Off'}</td>
                    <td className="p-3">
                      <button
                        type="button"
                        onClick={() => void toggleActive(c._id, c.active)}
                        className="text-[12px] font-semibold text-brand hover:underline"
                      >
                        {c.active ? 'Deactivate' : 'Activate'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
          {!loading && !coupons.length && (
            <p className="p-6 text-[#7d8b7d] text-sm">No coupons yet.</p>
          )}
          {!loading && coupons.length > 0 && (
            <div className="px-4 pb-4">
              <AdminPagination
                currentPage={couponPage}
                totalPages={couponTotalPages}
                totalItems={couponTotal}
                onPageChange={setCouponPage}
              />
            </div>
          )}
        </div>
      </div>
    </AdminLayout>
  )
}
