import { useState, useEffect } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import { Bell, ChevronRight, Mail, MoreVertical, PhoneCall, Plus, Search, Video } from 'lucide-react'
import PatientSidebar from '../../components/PatientSidebar'
import { useAuth } from '../../context/AuthContext.jsx'
import { displayFirstName } from '../../lib/userDisplay.js'
import { api } from '../../lib/api.js'
import AnonymousMeetJoinModal from '../../components/AnonymousMeetJoinModal.jsx'
import ListPagination, { PAGE_SIZE } from '../../components/ListPagination.jsx'

const statusStyles = {
  Pending: 'bg-[#f2f6f1] text-[#3d6c4d]',
  Confirmed: 'bg-[#e7f1e8] text-[#1f5f4a]',
  Completed: 'bg-[#e7f1e8] text-[#1f5f4a]',
  Cancelled: 'bg-[#f6f1ec] text-[#7a5b4b]',
}

export default function PatientAppointmentsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()
  const welcomeName = displayFirstName(user)
  const [appointments, setAppointments] = useState([])
  const [total, setTotal] = useState(0)
  const [page, setPage] = useState(1)
  const [totalPages, setTotalPages] = useState(1)
  const [listLoading, setListLoading] = useState(true)
  const [linkedTherapists, setLinkedTherapists] = useState([])
  const [linkedLoading, setLinkedLoading] = useState(true)
  const [linkedError, setLinkedError] = useState('')
  const [meetJoin, setMeetJoin] = useState({ open: false, link: '', alias: '', videoProvider: 'jitsi' })
  const [regeneratingId, setRegeneratingId] = useState(null)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setListLoading(true)
      try {
        const json = await api(`/appointments/patient/me?page=${page}&limit=${PAGE_SIZE}`, {
          method: 'GET',
          silent: true,
        })
        if (!cancelled && json.success && json.data) {
          setAppointments(json.data.appointments || [])
          setTotal(json.data.total ?? 0)
          setTotalPages(json.data.totalPages ?? 1)
        }
      } catch {
        if (!cancelled) {
          setAppointments([])
          setTotal(0)
          setTotalPages(1)
        }
      } finally {
        if (!cancelled) setListLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [page])

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLinkedLoading(true)
      setLinkedError('')
      try {
        const json = await api('/patients/linked-therapist/me', { method: 'GET' })
        if (!cancelled) {
          const list = json.data?.therapists?.length
            ? json.data.therapists
            : json.data?.therapist
              ? [json.data.therapist]
              : []
          setLinkedTherapists(list)
        }
      } catch (e) {
        if (!cancelled) {
          setLinkedDoctor(null)
          setLinkedError(e.message || 'Failed to load assigned doctor.')
        }
      } finally {
        if (!cancelled) setLinkedLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const openBooking = () => {
    navigate('/doctors')
  }

  const reloadAppointments = async () => {
    const json = await api(`/appointments/patient/me?page=${page}&limit=${PAGE_SIZE}`, {
      method: 'GET',
      silent: true,
    })
    setAppointments(json.data?.appointments || [])
    setTotal(json.data?.total ?? 0)
    setTotalPages(json.data?.totalPages ?? 1)
  }

  const regenerateVideo = async (item) => {
    setRegeneratingId(item.id)
    try {
      const json = await api(`/appointments/${item.id}/regenerate-video`, { method: 'POST' })
      if (json.success) await reloadAppointments()
    } catch (e) {
      setLinkedError(e.message || 'Could not update video link')
    } finally {
      setRegeneratingId(null)
    }
  }

  const openMeetJoin = (item) => {
    if (!item.meetLink) return
    if (item.bookedAsAnonymous) {
      setMeetJoin({
        open: true,
        link: item.meetLink,
        alias: item.meetJoinAlias || 'Anonymous Patient',
        videoProvider: item.videoProvider || 'jitsi',
      })
      return
    }
    window.open(item.meetLink, '_blank', 'noopener,noreferrer')
  }

  return (
    <>
      <div className="pt-4" />
      <section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-brand/70">Appointment</p>
            <h1 className="text-[36px] font-extrabold text-[#0f3a2b] max-[640px]:text-[28px]">{`Welcome ${welcomeName}!`}</h1>
          </div>
          <Link
            to="/patient-profile"
            className="flex items-center gap-2 bg-white border border-black/10 rounded-full px-4 py-3 shadow-sm text-[14px] font-semibold text-[#111] transition-all hover:-translate-y-0.5"
          >
            <Bell size={18} />
            <span>{welcomeName}</span>
            <ChevronRight size={18} />
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_280px] max-[1280px]:grid-cols-1">
          <div className="space-y-6">
            <div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[22px] font-semibold text-[#111]">Appointment</p>
                  <div className="mt-3 flex flex-wrap items-center gap-3 text-sm text-[#556b5b]">
                    <span>All Appointment</span>
                    <span className="rounded-full bg-[#e8f3ea] px-3 py-1 text-[#1f5f4a] font-semibold">{total}</span>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={openBooking}
                  disabled={linkedLoading}
                  className="inline-flex items-center gap-2 rounded-full bg-[#0f4e34] px-5 py-3 text-sm font-semibold text-white transition hover:bg-[#164e35] disabled:opacity-60"
                >
                  <Plus size={16} />
                  Book with a doctor
                </button>
              </div>

              {linkedError && (
                <p className="mt-3 text-sm text-red-700">{linkedError}</p>
              )}

              {linkedTherapists.length > 0 && (
                <div className="mt-4 flex flex-wrap gap-2">
                  {linkedTherapists.map((t) => (
                    <span
                      key={t.id}
                      className="inline-flex items-center rounded-full bg-[#e8f3ea] px-3 py-1 text-[12px] font-semibold text-[#1f5f4a]"
                    >
                      {t.name}
                    </span>
                  ))}
                </div>
              )}

              <div className="mt-6 grid gap-4 lg:grid-cols-[1fr_auto] items-center">
                <div className="relative max-w-sm">
                  <Search className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-[#7b8b7d]" />
                  <input
                    type="text"
                    placeholder="Keyword Search..."
                    className="w-full rounded-full border border-black/10 bg-[#f8faf8] py-3 pl-12 pr-4 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="flex items-center gap-3 text-sm text-[#556b5b]">
                  <span className="font-semibold">Show:</span>
                  <button className="rounded-full bg-[#eef3eb] px-4 py-2 text-[#1f5f4a]">All</button>
                  <button className="rounded-full border border-black/10 bg-white px-4 py-2">Upcoming</button>
                </div>
              </div>

              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border border-black/10 border-collapse">
                  <thead>
                    <tr className="text-left text-[13px] uppercase tracking-[0.24em] text-[#7d8b7d] bg-[#f7f4ef]">
                      <th className="px-3 py-3 border border-black/10">Appointment ID</th>
                      <th className="px-3 py-3 border border-black/10">Therapist</th>
                      <th className="px-3 py-3 border border-black/10">Date & Time</th>
                      <th className="px-3 py-3 border border-black/10">Duration</th>
                      <th className="px-3 py-3 border border-black/10">Location</th>
                      <th className="px-3 py-3 border border-black/10">Status</th>
                      <th className="px-3 py-3 border border-black/10">Video</th>
                      <th className="px-3 py-3 border border-black/10">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {listLoading && (
                      <tr>
                        <td colSpan={8} className="px-3 py-8 text-center text-sm text-[#7d8b7d]">
                          Loading appointments…
                        </td>
                      </tr>
                    )}
                    {!listLoading && appointments.length === 0 && (
                      <tr>
                        <td colSpan={8} className="px-3 py-8 text-center text-sm text-[#7d8b7d]">
                          No appointments yet.
                        </td>
                      </tr>
                    )}
                    {!listLoading && appointments.map((item) => (
                      <tr key={item.id} className="">
                        <td className="px-3 py-4 border border-black/10 text-sm font-semibold text-[#111]">{item.id}</td>
                        <td className="px-3 py-4 border border-black/10 text-sm text-[#3f4f41]">{item.therapist}</td>
                        <td className="px-3 py-4 border border-black/10 text-sm text-[#3f4f41]">{item.dateTime}</td>
                        <td className="px-3 py-4 border border-black/10 text-sm text-[#3f4f41]">{item.duration}</td>
                        <td className="px-3 py-4 border border-black/10 text-sm text-[#3f4f41]">{item.location}</td>
                        <td className="px-3 py-4 border border-black/10">
                          <span className={`inline-flex rounded-full px-3 py-1 text-[13px] font-semibold ${statusStyles[item.status] || statusStyles.Pending}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-3 py-4 border border-black/10">
                          {item.meetLink ? (
                            <div className="flex flex-col gap-1">
                              <button
                                type="button"
                                onClick={() => openMeetJoin(item)}
                                className="inline-flex items-center gap-1.5 rounded-full bg-[#0f4e34] px-3 py-1.5 text-[12px] font-semibold text-white hover:bg-[#164e35]"
                              >
                                <Video size={14} />
                                {item.bookedAsAnonymous ? 'Join anonymously' : 'Join Meet'}
                              </button>
                              {item.bookedAsAnonymous && item.videoProvider !== 'jitsi' && (
                                <button
                                  type="button"
                                  disabled={regeneratingId === item.id}
                                  onClick={() => void regenerateVideo(item)}
                                  className="text-[10px] font-semibold text-[#0f4e34] underline disabled:opacity-50"
                                >
                                  {regeneratingId === item.id ? 'Updating…' : 'Fix anonymous link'}
                                </button>
                              )}
                            </div>
                          ) : (
                            <span className="text-[12px] text-[#7d8b7d]">—</span>
                          )}
                        </td>
                        <td className="px-3 py-4 border border-black/10">
                          <div className="flex items-center gap-2">
                            <button
                              type="button"
                              onClick={() => openMeetJoin(item)}
                              disabled={!item.meetLink}
                              aria-label={item.meetLink ? 'Join video session' : item.action === 'mail' ? 'Email' : 'Call'}
                              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white border border-black/10 text-[#1f5f4a] shadow-sm transition hover:bg-[#f0f4ee] disabled:opacity-40"
                            >
                              {item.meetLink ? <Video size={16} /> : item.action === 'mail' ? <Mail size={16} /> : <PhoneCall size={16} />}
                            </button>
                            {!item.meetLink && (
                              <a
                                href={item.action === 'mail' ? 'mailto:contact@benzi.com' : 'tel:+92123456789'}
                                aria-label={item.action === 'mail' ? 'Email' : 'Call'}
                                className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white border border-black/10 text-[#1f5f4a] shadow-sm transition hover:bg-[#f0f4ee]"
                              >
                                {item.action === 'mail' ? <Mail size={16} /> : <PhoneCall size={16} />}
                              </a>
                            )}
                            <Link
                              to="/patient-profile"
                              aria-label="View patient profile"
                              className="inline-flex h-11 w-11 items-center justify-center rounded-full bg-white border border-black/10 text-[#7d8b7d] shadow-sm transition hover:bg-[#f0f4ee]"
                            >
                              <MoreVertical size={16} />
                            </Link>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              <ListPagination
                currentPage={page}
                totalPages={totalPages}
                totalItems={total}
                onPageChange={setPage}
              />
            </div>

            <div className="grid gap-4 lg:grid-cols-2">
              <div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
                <p className="text-[20px] font-semibold text-[#111]">Video Call</p>
                <p className="mt-2 text-sm text-[#556b5b]">
                  {appointments.find((a) => a.meetLink && a.bookedAsAnonymous)
                    ? 'Anonymous mode: use Join anonymously — guest name + camera off.'
                    : appointments.find((a) => a.meetLink)
                      ? 'Use Join Meet in the table for your upcoming online session.'
                      : 'Meet links appear after your therapist connects Google Calendar and you book an online slot.'}
                </p>
              </div>
              <div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
                <p className="text-[20px] font-semibold text-[#111]">Clinic/Hospital</p>
                <p className="mt-2 text-sm text-[#556b5b]">Address generation</p>
              </div>
            </div>
          </div>

          <PatientSidebar activeItem="Appointment" />
        </div>
      </section>

      <AnonymousMeetJoinModal
        open={meetJoin.open}
        meetLink={meetJoin.link}
        alias={meetJoin.alias}
        videoProvider={meetJoin.videoProvider}
        onClose={() => setMeetJoin({ open: false, link: '', alias: '', videoProvider: 'jitsi' })}
      />
    </>
  )
}
