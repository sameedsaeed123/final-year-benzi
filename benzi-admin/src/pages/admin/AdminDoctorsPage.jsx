import { useState, useEffect } from 'react'
import { Search } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout.jsx'
import AdminPagination from '../../components/AdminPagination.jsx'
import AdminPageLoader from '../../components/AdminPageLoader.jsx'
import AdminPanel from '../../components/AdminPanel.jsx'
import { AdminAlert } from '../../components/AdminAlert.jsx'
import { useAdminGet } from '../../hooks/useAdminQuery.js'

import { paginateList, ADMIN_LIST_PAGE_SIZE } from '../../lib/adminPagination.js'

const statusStyles = {
  Active: 'bg-[#e7f4ee] text-[#1f5f4a]',
  Pending: 'bg-[#fff4df] text-[#b45309]',
  Inactive: 'bg-[#fde8e5] text-[#b42318]',
  Suspended: 'bg-[#fde8e5] text-[#b42318]',
}

export default function AdminDoctorsPage() {
  const { data, loading, error, setError } = useAdminGet('/admin/doctors')
  const doctorsList = Array.isArray(data) ? data : []
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  useEffect(() => {
    setCurrentPage(1)
  }, [searchQuery])

  const filteredDoctors = doctorsList.filter(
    (doc) =>
      doc.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      doc.specialization?.toLowerCase().includes(searchQuery.toLowerCase())
  )
  const {
    items: paginatedDoctors,
    totalPages,
    currentPage: safePage,
    totalItems,
  } = paginateList(filteredDoctors, currentPage)

  useEffect(() => {
    if (currentPage > totalPages) setCurrentPage(totalPages)
  }, [currentPage, totalPages])

  return (
    <AdminLayout activeItem="Doctors" title="Doctors">
      <p className="text-sm text-[#556b5b] -mt-2">Manage registered therapists and their subscription plans.</p>
      <AdminAlert type="error" message={error} onDismiss={() => setError('')} />

      {loading ? (
        <AdminPageLoader label="Loading doctors…" />
      ) : (
        <AdminPanel title="All doctors" subtitle={`${doctorsList.length} registered`}>
          <div className="relative max-w-sm mb-4">
            <Search className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-[#7d8b7d]" />
            <input
              type="text"
              placeholder="Search by name or specialization…"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full rounded-full border border-black/10 bg-[#f8faf8] py-2.5 pl-10 pr-4 text-sm outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
            />
          </div>
          <div className="overflow-x-auto -mx-5 px-5">
            <table className="min-w-full border border-black/10 text-sm">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.15em] text-[#7d8b7d] bg-[#f7f4ef]">
                  <th className="px-3 py-3 border border-black/10">ID</th>
                  <th className="px-3 py-3 border border-black/10">Name</th>
                  <th className="px-3 py-3 border border-black/10">Specialization</th>
                  <th className="px-3 py-3 border border-black/10 text-center">Patients</th>
                  <th className="px-3 py-3 border border-black/10 text-center">Subscription</th>
                  <th className="px-3 py-3 border border-black/10 text-center">Status</th>
                </tr>
              </thead>
              <tbody>
                {paginatedDoctors.length > 0 ? (
                  paginatedDoctors.map((doctor) => (
                    <tr key={doctor.userId || doctor.id} className="text-[#3f4f41] hover:bg-[#fafbfa]">
                      <td className="px-3 py-3 border border-black/10 font-semibold">{doctor.id}</td>
                      <td className="px-3 py-3 border border-black/10 font-bold text-brand">{doctor.name}</td>
                      <td className="px-3 py-3 border border-black/10">{doctor.specialization}</td>
                      <td className="px-3 py-3 border border-black/10 text-center font-semibold">
                        {doctor.patients}
                      </td>
                      <td className="px-3 py-3 border border-black/10 text-center font-semibold text-[#556b5b]">
                        {doctor.subscription || 'None'}
                      </td>
                      <td className="px-3 py-3 border border-black/10 text-center">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                            statusStyles[doctor.status] || 'bg-brand/10 text-brand'
                          }`}
                        >
                          {doctor.status}
                        </span>
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-[#7d8b7d]">
                      No therapists found.
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
      )}
    </AdminLayout>
  )
}
