import AdminLayout from '../../components/AdminLayout.jsx'
import AdminPagination from '../../components/AdminPagination.jsx'
import AdminPageLoader from '../../components/AdminPageLoader.jsx'
import AdminPanel from '../../components/AdminPanel.jsx'
import { AdminAlert } from '../../components/AdminAlert.jsx'
import { useAdminPagedGet } from '../../hooks/useAdminQuery.js'
import { ExternalLink, Video } from 'lucide-react'

const statusStyles = {
  Pending: 'bg-[#f2f6f1] text-[#3d6c4d]',
  Confirmed: 'bg-[#e7f1e8] text-[#1f5f4a]',
  Completed: 'bg-[#e7f1e8] text-[#1f5f4a]',
  Cancelled: 'bg-[#f6f1ec] text-[#7a5b4b]',
}

export default function AdminAppointmentsPage() {
  const {
    data,
    loading,
    refreshing,
    error,
    setError,
    page,
    setPage,
    total,
    totalPages,
  } = useAdminPagedGet('/admin/appointments')

  const appointments = data?.appointments || []

  return (
    <AdminLayout activeItem="Appointments" title="Appointments">
      <p className="text-sm text-[#556b5b] -mt-2">All platform appointments — video links and status.</p>
      <AdminAlert type="error" message={error} onDismiss={() => setError('')} />

      {loading && !data ? (
        <AdminPageLoader label="Loading appointments…" />
      ) : (
        <AdminPanel title="All appointments" subtitle={`${total} total`}>
          <div className={`overflow-x-auto -mx-5 px-5 transition-opacity ${refreshing ? 'opacity-50' : ''}`}>
            <table className="min-w-full border border-black/10 text-[13px]">
              <thead>
                <tr className="text-left text-[11px] uppercase tracking-[0.15em] text-[#7d8b7d] bg-[#f7f4ef]">
                  <th className="px-3 py-3 border border-black/10">ID</th>
                  <th className="px-3 py-3 border border-black/10">Patient</th>
                  <th className="px-3 py-3 border border-black/10">Therapist</th>
                  <th className="px-3 py-3 border border-black/10">Date & Time</th>
                  <th className="px-3 py-3 border border-black/10">Location</th>
                  <th className="px-3 py-3 border border-black/10">Status</th>
                  <th className="px-3 py-3 border border-black/10">Video</th>
                </tr>
              </thead>
              <tbody>
                {appointments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-3 py-8 text-center text-[#7d8b7d]">
                      No appointments found.
                    </td>
                  </tr>
                ) : (
                  appointments.map((row) => (
                    <tr key={row.fullId || row.id} className="text-[#3f4f41] hover:bg-[#fafbfa]">
                      <td className="px-3 py-3 border border-black/10 font-semibold">{row.id}</td>
                      <td className="px-3 py-3 border border-black/10">{row.patient}</td>
                      <td className="px-3 py-3 border border-black/10">{row.therapist}</td>
                      <td className="px-3 py-3 border border-black/10">{row.dateTime}</td>
                      <td className="px-3 py-3 border border-black/10">{row.location}</td>
                      <td className="px-3 py-3 border border-black/10">
                        <span
                          className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${
                            statusStyles[row.status] || statusStyles.Pending
                          }`}
                        >
                          {row.status}
                        </span>
                      </td>
                      <td className="px-3 py-3 border border-black/10">
                        {row.meetLink && row.locationCode === 'online' ? (
                          <a
                            href={row.meetLink}
                            target="_blank"
                            rel="noreferrer"
                            className="inline-flex items-center gap-1.5 rounded-full bg-brand px-3 py-1.5 text-[11px] font-semibold text-white"
                          >
                            <Video size={12} />
                            Join
                            <ExternalLink size={10} />
                          </a>
                        ) : (
                          <span className="text-[11px] text-[#7d8b7d]">—</span>
                        )}
                      </td>
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
      )}
    </AdminLayout>
  )
}
