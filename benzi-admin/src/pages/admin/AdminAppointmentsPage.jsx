import { useEffect, useState } from 'react'
import { ExternalLink, Video } from 'lucide-react'
import AdminSidebar from '../../components/AdminSidebar'
import { api } from '../../lib/api.js'

const statusStyles = {
  Pending: 'bg-[#f2f6f1] text-[#3d6c4d]',
  Confirmed: 'bg-[#e7f1e8] text-[#1f5f4a]',
  Completed: 'bg-[#e7f1e8] text-[#1f5f4a]',
  Cancelled: 'bg-[#f6f1ec] text-[#7a5b4b]',
}

export default function AdminAppointmentsPage() {
  const [appointments, setAppointments] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  useEffect(() => {
    let cancelled = false
    async function load() {
      setLoading(true)
      setError('')
      try {
        const json = await api('/admin/appointments', { method: 'GET' })
        if (!cancelled && json.success) {
          setAppointments(json.data?.appointments || [])
          setTotal(json.data?.total ?? (json.data?.appointments || []).length)
        }
      } catch (e) {
        if (!cancelled) {
          setError(e.message || 'Failed to load appointments')
          setAppointments([])
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => { cancelled = true }
  }, [])

  return (
    <>
      <div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
      <section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
        <div className="grid gap-6 xl:grid-cols-[1fr_260px] max-[1280px]:grid-cols-1">
          <div className="space-y-6">
            <div>
              <h1 className="text-[18px] font-semibold text-[#0f3a2b]">Appointments</h1>
              <p className="text-[12px] text-[#7d8b7d]">All platform appointments — video links and status</p>
            </div>

            {error && <p className="text-sm text-red-700">{error}</p>}

            <div className="rounded-2xl border border-black/5 bg-white p-5 shadow-sm">
              {loading ? (
                <p className="text-sm text-brand animate-pulse py-8 text-center">Loading appointments…</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full border border-black/10 text-[13px]">
                    <thead>
                      <tr className="text-left text-[11px] uppercase tracking-[0.2em] text-[#7d8b7d] bg-[#f7f4ef]">
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
                            <td className="px-3 py-3 border border-black/10 font-semibold text-[#111]">{row.id}</td>
                            <td className="px-3 py-3 border border-black/10">{row.patient}</td>
                            <td className="px-3 py-3 border border-black/10">{row.therapist}</td>
                            <td className="px-3 py-3 border border-black/10">{row.dateTime}</td>
                            <td className="px-3 py-3 border border-black/10">{row.location}</td>
                            <td className="px-3 py-3 border border-black/10">
                              <span className={`inline-flex rounded-full px-3 py-1 text-[11px] font-semibold ${statusStyles[row.status] || statusStyles.Pending}`}>
                                {row.status}
                              </span>
                            </td>
                            <td className="px-3 py-3 border border-black/10">
                              {row.meetLink && row.locationCode === 'online' ? (
                                <a
                                  href={row.meetLink}
                                  target="_blank"
                                  rel="noreferrer"
                                  className="inline-flex items-center gap-1.5 rounded-full bg-[#0f4e34] px-3 py-1.5 text-[11px] font-semibold text-white hover:bg-[#164e35]"
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
                  <p className="mt-4 text-[12px] text-[#7d8b7d]">
                    Showing {appointments.length} of {total} appointments. Confirmed sessions auto-complete after end time.
                  </p>
                </div>
              )}
            </div>
          </div>
          <AdminSidebar activeItem="Appointments" />
        </div>
      </section>
    </>
  )
}
