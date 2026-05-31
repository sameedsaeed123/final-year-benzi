import { useState } from 'react'
import AdminLayout from '../../components/AdminLayout.jsx'
import AdminPagination from '../../components/AdminPagination.jsx'
import AdminPageLoader from '../../components/AdminPageLoader.jsx'
import AdminPanel from '../../components/AdminPanel.jsx'
import { AdminAlert } from '../../components/AdminAlert.jsx'
import { useAdminQuery } from '../../hooks/useAdminQuery.js'
import { api } from '../../lib/api.js'

export default function AdminPatientsPage() {
  const [page, setPage] = useState(1)
  const path = `/admin/dashboard?patientsPage=${page}&patientsLimit=5`
  const { data, loading, error, setError } = useAdminQuery(
    () => api(path, { method: 'GET' }),
    [path],
    { keepPrevious: true }
  )

  const rows = data?.patientsPerDoctor || []
  const patientsTable = data?.patientsTable || {}
  const total = patientsTable.total ?? rows.length
  const totalPages = patientsTable.totalPages ?? 1
  const weeklyCounts = data?.weeklyCounts || []
  const maxBar = Math.max(1, ...weeklyCounts)

  return (
    <AdminLayout activeItem="Patients" title="Patients">
      <p className="text-sm text-[#556b5b] -mt-2">Patient counts per doctor from live platform data.</p>
      <AdminAlert type="error" message={error} onDismiss={() => setError('')} />

      {loading && !data ? (
        <AdminPageLoader label="Loading patient stats…" />
      ) : (
        <>
          <AdminPanel title="Patients per doctor">
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="min-w-full text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.15em] text-[#7d8b7d]">
                    <th className="px-3 py-3">#</th>
                    <th className="px-3 py-3">Doctor</th>
                    <th className="px-3 py-3">Specialization</th>
                    <th className="px-3 py-3 text-center">Total</th>
                    <th className="px-3 py-3 text-center">Active</th>
                    <th className="px-3 py-3 text-center">Inactive</th>
                    <th className="px-3 py-3">Last session</th>
                  </tr>
                </thead>
                <tbody>
                  {rows.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#7d8b7d]">
                        No patient assignments yet.
                      </td>
                    </tr>
                  ) : (
                    rows.map((row) => (
                      <tr key={row.id} className="border-t border-black/5 text-[#3f4f41]">
                        <td className="px-3 py-3">{row.id}</td>
                        <td className="px-3 py-3 font-semibold">{row.doctorName}</td>
                        <td className="px-3 py-3">{row.specialization}</td>
                        <td className="px-3 py-3 text-center">{row.totalPatients}</td>
                        <td className="px-3 py-3 text-center text-[#1f5f4a]">{row.active}</td>
                        <td className="px-3 py-3 text-center text-[#7d8b7d]">{row.inactive}</td>
                        <td className="px-3 py-3">{row.lastSession}</td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
            {total > 0 && (
              <AdminPagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                onPageChange={setPage}
              />
            )}
          </AdminPanel>

          <AdminPanel title="New patients this week" className="mt-6">
            <div className="flex items-end gap-2 h-32">
              {weeklyCounts.map((count, i) => (
                <div key={i} className="flex-1 flex flex-col items-center gap-1">
                  <div
                    className="w-full rounded-t-lg bg-brand/80 min-h-[4px]"
                    style={{ height: `${(count / maxBar) * 100}%` }}
                  />
                  <span className="text-[10px] text-[#7d8b7d]">{count}</span>
                </div>
              ))}
            </div>
          </AdminPanel>
        </>
      )}
    </AdminLayout>
  )
}
