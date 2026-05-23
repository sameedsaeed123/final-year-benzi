import { useState, useEffect } from 'react'
import AdminLayout from '../../components/AdminLayout.jsx'
import AdminPagination from '../../components/AdminPagination.jsx'
import AdminPageLoader from '../../components/AdminPageLoader.jsx'
import AdminPanel from '../../components/AdminPanel.jsx'
import { AdminAlert } from '../../components/AdminAlert.jsx'
import { useAdminGet } from '../../hooks/useAdminQuery.js'
import { paginateList, ADMIN_LIST_PAGE_SIZE } from '../../lib/adminPagination.js'

export default function AdminPatientsPage() {
  const { data, loading, error, setError } = useAdminGet('/admin/dashboard')
  const rows = data?.patientsPerDoctor || []
  const weeklyCounts = data?.weeklyCounts || []
  const [currentPage, setCurrentPage] = useState(1)

  const {
    items: paginatedRows,
    totalPages,
    currentPage: safePage,
    totalItems,
    startIndex,
  } = paginateList(rows, currentPage)

  const maxBar = Math.max(1, ...weeklyCounts)

  useEffect(() => {
    setCurrentPage(1)
  }, [rows.length])

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  return (
    <AdminLayout activeItem="Patients" title="Patients">
      <p className="text-sm text-[#556b5b] -mt-2">Patient counts per doctor from live platform data.</p>
      <AdminAlert type="error" message={error} onDismiss={() => setError('')} />

      {loading ? (
        <AdminPageLoader label="Loading patient stats…" />
      ) : (
        <div className="space-y-6">
          <AdminPanel title="Patient count per doctor">
            <div className="overflow-x-auto -mx-5 px-5">
              <table className="min-w-full border border-black/10 text-sm">
                <thead>
                  <tr className="text-left text-[11px] uppercase tracking-[0.15em] text-[#7d8b7d] bg-[#f7f4ef]">
                    <th className="px-3 py-3 border border-black/10">#</th>
                    <th className="px-3 py-3 border border-black/10">Doctor</th>
                    <th className="px-3 py-3 border border-black/10">Specialization</th>
                    <th className="px-3 py-3 border border-black/10 text-center">Total</th>
                    <th className="px-3 py-3 border border-black/10 text-center">Active (7d)</th>
                    <th className="px-3 py-3 border border-black/10 text-center">Inactive</th>
                    <th className="px-3 py-3 border border-black/10">Last session</th>
                  </tr>
                </thead>
                <tbody>
                  {paginatedRows.length > 0 ? (
                    paginatedRows.map((row, index) => (
                      <tr key={row.doctorName || index} className="text-[#3f4f41]">
                        <td className="px-3 py-3 border border-black/10">{startIndex + index + 1}</td>
                        <td className="px-3 py-3 border border-black/10 font-bold text-brand">{row.doctorName}</td>
                        <td className="px-3 py-3 border border-black/10">{row.specialization}</td>
                        <td className="px-3 py-3 border border-black/10 text-center font-semibold">{row.totalPatients}</td>
                        <td className="px-3 py-3 border border-black/10 text-center text-[#1f5f4a]">{row.active}</td>
                        <td className="px-3 py-3 border border-black/10 text-center text-[#b42318]">{row.inactive}</td>
                        <td className="px-3 py-3 border border-black/10">{row.lastSession}</td>
                      </tr>
                    ))
                  ) : (
                    <tr>
                      <td colSpan={7} className="py-8 text-center text-[#7d8b7d]">
                        No patient assignments found.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
            <AdminPagination
              currentPage={safePage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={ADMIN_LIST_PAGE_SIZE}
              onPageChange={setCurrentPage}
            />
          </AdminPanel>

          <AdminPanel title="New patients this week" subtitle="Registrations by day">
            <div className="flex h-36 items-end justify-between gap-2 border-b border-black/5 pb-2">
              {['M', 'T', 'W', 'T', 'F', 'S', 'S'].map((day, index) => (
                <div key={index} className="flex-1 flex flex-col items-center gap-2">
                  <span className="text-[10px] font-bold text-brand">{weeklyCounts[index] ?? 0}</span>
                  <div
                    className="w-full bg-brand/25 rounded-t-md min-h-[8px]"
                    style={{
                      height: `${Math.max(8, ((weeklyCounts[index] || 0) / maxBar) * 100)}px`,
                    }}
                  />
                  <span className="text-[10px] text-[#7d8b7d]">{day}</span>
                </div>
              ))}
            </div>
          </AdminPanel>
        </div>
      )}
    </AdminLayout>
  )
}
