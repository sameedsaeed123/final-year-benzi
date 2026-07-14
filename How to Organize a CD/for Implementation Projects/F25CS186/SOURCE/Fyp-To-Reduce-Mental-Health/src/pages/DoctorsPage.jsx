import { useState, useEffect, useCallback } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { MapPin, Search, BadgeCheck } from 'lucide-react'
import { api } from '../lib/api.js'
import { useAuth } from '../context/AuthContext.jsx'
import AppointmentBookingModal from '../components/AppointmentBookingModal.jsx'

function DoctorCard({ doctor, onBook }) {
  const getInitials = (name) => {
    if (!name) return 'DR'
    const clean = name.replace(/Dr\.\s*/i, '').trim()
    const parts = clean.split(/\s+/)
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase()
    }
    return clean.substring(0, 2).toUpperCase()
  }

  const hasRealImage = doctor.image && 
    doctor.image !== '/images/Frame 33921.png' && 
    doctor.image !== '/images/therapist-profile-image.png'

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-black/5 p-6 transition-all duration-300 hover:shadow-md hover:-translate-y-0.5 max-[480px]:p-4">
      <div className="flex gap-5 max-[600px]:flex-col max-[600px]:gap-4">
        {hasRealImage ? (
          <img
            src={doctor.image}
            alt={doctor.name}
            className="w-20 h-20 rounded-full object-cover shrink-0 border border-brand/20"
            onError={(e) => {
              e.target.style.display = 'none'
              const sib = e.target.nextSibling
              if (sib) sib.style.display = 'flex'
            }}
          />
        ) : null}
        {!hasRealImage ? (
          <div className="w-20 h-20 rounded-full shrink-0 bg-gradient-to-br from-brand to-[#2bb39a] text-white flex items-center justify-center font-extrabold text-[22px] tracking-wider border border-brand/20 shadow-sm">
            {getInitials(doctor.name)}
          </div>
        ) : (
          <div className="w-20 h-20 rounded-full shrink-0 bg-gradient-to-br from-brand to-[#2bb39a] text-white hidden items-center justify-center font-extrabold text-[22px] tracking-wider border border-brand/20 shadow-sm">
            {getInitials(doctor.name)}
          </div>
        )}

        <div className="flex-1">
          <div className="flex justify-between gap-4 items-start max-[600px]:flex-col">
            <div>
              <h3 className="text-[20px] font-extrabold text-[#111] leading-tight">
                {doctor.name}
              </h3>
              <div className="flex flex-wrap items-center gap-2 mt-2">
                {doctor.practiceLocation && (
                  <span className="text-[#888] text-[12px] font-medium flex items-center gap-1">
                    <MapPin size={12} className="text-brand shrink-0" />
                    {doctor.practiceLocation}
                  </span>
                )}
                {(doctor.availableLocations || ['online']).map(loc => {
                  const label = loc === 'online' ? 'Video Call' : loc === 'office' ? 'Office' : 'Clinic'
                  return (
                    <span key={loc} className="inline-flex items-center px-2 py-0.5 rounded-full bg-[#f0f4ee] text-[#1f5f4a] text-[11px] font-semibold border border-black/5">
                      {label}
                    </span>
                  )
                })}
              </div>
              <p className="text-[13px] text-[#555] mt-2 leading-snug">
                {doctor.specializationTitle}
                <br />
                {doctor.qualification}
              </p>
            </div>

            <div className="flex flex-col gap-2 shrink-0 max-[600px]:w-full">
              <button
                type="button"
                onClick={() => onBook(doctor)}
                className="bg-brand text-white text-[13px] font-semibold px-5 py-2.5 rounded-md cursor-pointer transition-all hover:bg-brand-dark hover:-translate-y-px max-[600px]:w-full text-center"
              >
                Book Appointment
              </button>
              <button
                type="button"
                onClick={() => onBook(doctor)}
                className="bg-brand text-white text-[13px] font-semibold px-5 py-2.5 rounded-md cursor-pointer transition-all hover:bg-brand-dark hover:-translate-y-px max-[600px]:w-full text-center"
              >
                Video Consultation
              </button>
            </div>
          </div>

          <div className="flex flex-wrap gap-x-6 gap-y-2 mt-4 text-[13px]">
            <span className="text-[#555]">
              <span className="text-brand font-semibold">Wait Time :</span> {doctor.waitTime}
            </span>
            <span className="text-[#555]">
              <span className="text-brand font-semibold">Experience :</span> {doctor.experience}
            </span>
          </div>

          <div className="flex flex-wrap gap-2 mt-4">
            {doctor.fees.map((fee, i) => (
              <span
                key={`${fee.label}-${i}`}
                className={`text-[12px] px-3 py-1.5 rounded-full font-medium ${fee.highlight
                    ? 'bg-brand text-white'
                    : 'bg-[#e9e9e9] text-[#555]'
                  }`}
              >
                {fee.label}: PKR {fee.amount}
              </span>
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

export default function DoctorsPage() {
  const { user, refreshGateStatus } = useAuth()
  const [city, setCity] = useState('Lahore')
  const [searchInput, setSearchInput] = useState('')
  const [debouncedSearch, setDebouncedSearch] = useState('')
  const [list, setList] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState('')
  const [bookingDoctor, setBookingDoctor] = useState(null)
  const [bookingOpen, setBookingOpen] = useState(false)

  useEffect(() => {
    const t = setTimeout(() => setDebouncedSearch(searchInput.trim()), 350)
    return () => clearTimeout(t)
  }, [searchInput])

  const navigate = useNavigate()
  const { search } = useLocation()

  const fetchDirectory = useCallback(async (skip, append) => {
    const params = new URLSearchParams()
    params.set('city', city)
    if (debouncedSearch) params.set('q', debouncedSearch)
    params.set('limit', '8')
    params.set('skip', String(skip))
    const json = await api(`/therapists/directory?${params.toString()}`, { method: 'GET' })
    if (!json.success || !json.data) throw new Error(json.message || 'Failed to load directory')
    const rows = json.data.therapists || []
    const n = typeof json.data.total === 'number' ? json.data.total : rows.length
    if (append) {
      setList((prev) => [...prev, ...rows])
    } else {
      setList(rows)
    }
    setTotal(n)
  }, [city, debouncedSearch])

  useEffect(() => {
    let cancelled = false
    setLoading(true)
    setError('')
    fetchDirectory(0, false)
      .catch((e) => {
        if (!cancelled) {
          setError(e.message || 'Could not load therapists.')
          setList([])
          setTotal(0)
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false)
      })
    return () => {
      cancelled = true
    }
  }, [fetchDirectory])

  useEffect(() => {
    if (!user || list.length === 0) return
    const params = new URLSearchParams(search)
    const bookId = params.get('book')
    if (bookId) {
      const doc = list.find(d => d.id === bookId)
      if (doc) {
        setBookingDoctor(doc)
        setBookingOpen(true)
        // Clean URL to prevent re-opening on refresh
        navigate('/doctors', { replace: true })
      }
    }
  }, [user, list, search, navigate])

  const loadMore = async () => {
    if (loadingMore || list.length >= total) return
    setLoadingMore(true)
    setError('')
    try {
      await fetchDirectory(list.length, true)
    } catch (e) {
      setError(e.message || 'Load more failed.')
    } finally {
      setLoadingMore(false)
    }
  }

  const heroCount = total > 0 ? `${total}+ listed` : 'Browse therapists'

  const openBooking = (doctor) => {
    if (!doctor) return
    if (!user) {
      navigate('/login?portal=patient', { state: { from: `/doctors?book=${doctor.id}` } })
      return
    }
    setBookingDoctor(doctor)
    setBookingOpen(true)
  }

  return (
    <>
      <div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />

      <section className="px-6 max-[480px]:px-4">
        <div className="w-[90%] mx-auto rounded-2xl bg-gradient-to-r from-brand to-[#2bb39a] overflow-hidden relative">
          <div className="grid grid-cols-2 items-center max-[900px]:grid-cols-1">
            <div className="p-12 max-[1024px]:p-10 max-[480px]:p-6">
              <h1 className="text-white text-[44px] font-extrabold leading-[1.15] max-[1024px]:text-[34px] max-[480px]:text-[26px]">
                Find And Book the<br />Best Doctors near you
              </h1>

              <span className="inline-flex items-center gap-2 bg-white/95 text-[#111] text-[13px] font-semibold px-3 py-1.5 rounded-full mt-5">
                <BadgeCheck size={14} strokeWidth={2.4} className="text-brand" />
                {heroCount}
              </span>

              <div className="flex items-center gap-2 mt-6 bg-white rounded-full p-1.5 shadow-md max-w-xl max-[600px]:flex-col max-[600px]:rounded-2xl max-[600px]:p-3 max-[600px]:gap-3">
                <select
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  className="bg-transparent text-[14px] font-semibold text-[#111] px-4 py-2 outline-none cursor-pointer max-[600px]:w-full max-[600px]:border max-[600px]:border-black/10 max-[600px]:rounded-lg"
                >
                  <option>Lahore</option>
                  <option>Karachi</option>
                  <option>Islamabad</option>
                  <option>Near You</option>
                </select>

                <button
                  type="button"
                  onClick={() => setCity('Near You')}
                  className="flex items-center gap-1.5 bg-brand text-white text-[13px] font-semibold px-4 py-2 rounded-full cursor-pointer transition-all hover:bg-brand-dark max-[600px]:w-full max-[600px]:justify-center"
                >
                  <MapPin size={14} strokeWidth={2.2} />
                  Detect
                </button>

                <input
                  type="text"
                  placeholder="Doctors"
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  className="flex-1 bg-transparent text-[14px] px-3 py-2 outline-none placeholder:text-[#888] max-[600px]:w-full max-[600px]:border max-[600px]:border-black/10 max-[600px]:rounded-lg"
                />

                <button
                  type="button"
                  onClick={() => setDebouncedSearch(searchInput.trim())}
                  className="flex items-center gap-1.5 bg-brand text-white text-[13px] font-semibold px-5 py-2 rounded-full cursor-pointer transition-all hover:bg-brand-dark max-[600px]:w-full max-[600px]:justify-center"
                >
                  <Search size={14} strokeWidth={2.2} />
                  Search
                </button>
              </div>
            </div>

            <div className="relative h-full flex items-end justify-end max-[900px]:justify-center">
              <img
                src="/images/285b926543910d790975aa5d1826a1c0-removebg-preview 1.png"
                alt="Doctor"
                className="h-90 object-contain max-[1024px]:h-75 max-[480px]:h-60"
              />
            </div>
          </div>
        </div>
      </section>

      <section className="px-6 py-14 max-[480px]:px-4 max-[480px]:py-10">
        <div className="w-[90%] mx-auto">
          <div className="flex justify-between items-start gap-6 mb-10 max-[768px]:flex-col">
            <div>
              <h2 className="text-[32px] font-extrabold text-[#111] leading-[1.2] max-[1024px]:text-[26px] max-[480px]:text-[22px]">
                Best Psychiatrists available for video and<br className="max-[768px]:hidden" /> office consultation
              </h2>
              <p className="text-[14px] text-[#777] mt-2">
                {city === 'Near You'
                  ? 'Showing therapists in all cities. Pick a city to narrow results.'
                  : `Showing therapists in ${city} (from database).`}
              </p>
            </div>
            {user?.role !== 'patient' && (
              <Link
                to="/auth"
                className="bg-brand text-white px-6 py-3 rounded-md text-[13.5px] font-semibold cursor-pointer transition-all hover:bg-brand-dark hover:-translate-y-px shrink-0"
              >
                Join as Doctor
              </Link>
            )}
          </div>

          {error && (
            <p className="text-sm text-red-700 bg-red-50 border border-red-100 rounded-xl px-4 py-3 mb-6">{error}</p>
          )}

          <div className="grid grid-cols-2 gap-6 max-[900px]:grid-cols-1">
            {loading && (
              <p className="text-[#666] col-span-2 text-center py-12">Loading therapists…</p>
            )}
            {!loading && list.length === 0 && !error && (
              <p className="text-[#666] col-span-2 text-center py-12">
                No therapists match this city or search yet. Run <code className="text-xs bg-[#eee] px-1 rounded">cd benzi-server && npm run seed:therapists</code> to load demo profiles.
              </p>
            )}
            {!loading &&
              list.map((doctor) => (
                <DoctorCard key={doctor.id} doctor={doctor} onBook={openBooking} />
              ))}
          </div>

          {!loading && list.length < total && (
            <div className="flex justify-center mt-10">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="bg-brand text-white px-8 py-3 rounded-md text-[14px] font-semibold cursor-pointer transition-all hover:bg-brand-dark hover:-translate-y-px disabled:opacity-60"
              >
                {loadingMore ? 'Loading…' : 'Load More'}
              </button>
            </div>
          )}
        </div>
      </section>

      <section className="px-6 pb-16 max-[480px]:px-4 max-[480px]:pb-12">
        <div className="w-[90%] mx-auto flex flex-col items-center text-center gap-4 bg-white rounded-2xl border border-brand/15 shadow-sm py-10 px-6">
          <h3 className="text-[24px] font-extrabold text-[#111] max-[480px]:text-[20px]">
            Looking for more specialists?
          </h3>
          <p className="text-[14px] text-[#666] max-w-xl">
            Explore our full directory of verified psychiatrists and mental health experts available across multiple cities.
          </p>
          <Link
            to="/doctors"
            className="bg-brand text-white px-8 py-3 rounded-md text-[14px] font-semibold cursor-pointer transition-all hover:bg-brand-dark hover:-translate-y-px"
          >
            See More Doctors
          </Link>
        </div>
      </section>

      <AppointmentBookingModal
        open={bookingOpen}
        doctor={bookingDoctor}
        onClose={() => setBookingOpen(false)}
        onBooked={() => refreshGateStatus()}
      />
    </>
  )
}
