import { useEffect, useState } from 'react'
import AdminLayout from '../../components/AdminLayout.jsx'
import AdminPageLoader from '../../components/AdminPageLoader.jsx'
import AdminPagination from '../../components/AdminPagination.jsx'
import { AdminAlert } from '../../components/AdminAlert.jsx'
import { api } from '../../lib/api.js'

const statusStyles = {
  Completed: 'bg-[#e7f4ee] text-[#1f5f4a]',
  Pending: 'bg-[#fff4df] text-[#b45309]',
}

export default function AdminRevenuePage() {
  const [stats, setStats] = useState(null)
  const [payments, setPayments] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const load = async (p = page) => {
    setLoading(true)
    setError('')
    try {
      const [statsJson, payJson] = await Promise.all([
        api('/admin/subscription/revenue', { method: 'GET', silent: true }),
        api(`/admin/subscription/payments?page=${p}&limit=5`, { method: 'GET' }),
      ])
      setStats(statsJson.data || null)
      setPayments(payJson.data?.payments || [])
      setTotal(payJson.data?.total || 0)
    } catch (e) {
      setError(e.message || 'Failed to load revenue data')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    void load(page)
  }, [page])

  const totalPages = Math.max(1, Math.ceil(total / 5))
  const maxMonthly = Math.max(1, ...(stats?.monthlyRevenue?.map((m) => m.revenue) || [1]))

  return (
    <AdminLayout activeItem="Revenue" title="Revenue">
      <AdminAlert message={error} onDismiss={() => setError('')} />

      {loading && !stats ? (
        <AdminPageLoader label="Loading revenue…" />
      ) : (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            {[
              { label: 'Total subscription revenue', value: `$${stats?.totalRevenue?.toLocaleString() ?? '0'}` },
              { label: 'This month', value: `$${stats?.monthRevenue?.toLocaleString() ?? '0'}` },
              { label: 'Active subscriptions', value: stats?.activeSubscriptions ?? 0 },
            ].map((card) => (
              <div key={card.label} className="rounded-2xl border border-black/5 bg-white p-4 shadow-sm">
                <p className="text-[12px] text-[#7d8b7d]">{card.label}</p>
                <p className="mt-2 text-[22px] font-bold text-[#0f3a2b]">{card.value}</p>
              </div>
            ))}
          </div>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <p className="text-[13px] font-semibold text-[#111]">Monthly revenue</p>
              <div className="mt-4 flex flex-col gap-3">
                {(stats?.monthlyRevenue || []).slice(-6).map((row) => (
                  <div key={row.label} className="flex items-center gap-3 text-[11px] text-[#6b7b6a]">
                    <span className="w-16 shrink-0 truncate">{row.label}</span>
                    <div className="flex-1 h-3 rounded-full bg-[#e9efe8]">
                      <div
                        className="h-3 rounded-full bg-brand"
                        style={{ width: `${Math.round((row.revenue / maxMonthly) * 100)}%` }}
                      />
                    </div>
                    <span className="w-12 text-right font-semibold">${row.revenue}</span>
                  </div>
                ))}
                {!stats?.monthlyRevenue?.length && (
                  <p className="text-[12px] text-[#7d8b7d]">No subscription payments recorded yet.</p>
                )}
              </div>
            </div>

            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              <p className="text-[13px] font-semibold text-[#111]">Revenue by plan</p>
              <ul className="mt-4 space-y-3">
                {(stats?.revenueByPlan || []).map((row) => (
                  <li key={row.planSlug} className="flex justify-between text-sm">
                    <span className="text-[#3f4f41]">
                      {row.planName}{' '}
                      <span className="text-[#7d8b7d]">({row.count} therapists)</span>
                    </span>
                    <span className="font-semibold text-brand">${row.revenue}</span>
                  </li>
                ))}
                {!stats?.revenueByPlan?.length && (
                  <p className="text-[12px] text-[#7d8b7d]">No plan revenue yet.</p>
                )}
              </ul>
            </div>
          </div>

          <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
            <p className="text-[13px] font-semibold text-[#111] mb-4">Subscription payments</p>
            <div className="overflow-x-auto">
              <table className="min-w-full border border-black/10 text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.15em] text-[#7d8b7d] bg-[#f7f4ef]">
                    <th className="px-3 py-3 border border-black/10">ID</th>
                    <th className="px-3 py-3 border border-black/10">Doctor</th>
                    <th className="px-3 py-3 border border-black/10">Date</th>
                    <th className="px-3 py-3 border border-black/10">Plan</th>
                    <th className="px-3 py-3 border border-black/10">Amount</th>
                    <th className="px-3 py-3 border border-black/10">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {payments.map((p) => (
                    <tr key={p.id} className="text-[#3f4f41]">
                      <td className="px-3 py-3 border border-black/10 font-mono text-[11px]">{p.paymentId}</td>
                      <td className="px-3 py-3 border border-black/10">
                        <p className="font-semibold text-[#111]">{p.doctor}</p>
                        <p className="text-[11px] text-[#7d8b7d]">{p.email}</p>
                      </td>
                      <td className="px-3 py-3 border border-black/10">
                        {p.date ? new Date(p.date).toLocaleDateString() : '—'}
                      </td>
                      <td className="px-3 py-3 border border-black/10 capitalize">{p.plan}</td>
                      <td className="px-3 py-3 border border-black/10 font-semibold">${p.amount}</td>
                      <td className="px-3 py-3 border border-black/10">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                            statusStyles[p.status] || statusStyles.Pending
                          }`}
                        >
                          {p.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            {!payments.length && !loading && (
              <p className="py-6 text-center text-[#7d8b7d] text-sm">No payments yet.</p>
            )}
            <AdminPagination
              currentPage={page}
              totalPages={totalPages}
              totalItems={total}
              onPageChange={setPage}
            />
          </div>
        </>
      )}
    </AdminLayout>
  )
}
