import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Star, StarHalf } from 'lucide-react'
import { api } from '../lib/api.js'

const getInitials = (n) => {
  if (!n) return 'DR'
  const clean = n.replace(/Dr\.\s*/i, '').trim()
  const parts = clean.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return clean.substring(0, 2).toUpperCase()
}

function Rating({ value }) {
  const full = Math.floor(value)
  const hasHalf = value - full >= 0.5
  const empty = 5 - full - (hasHalf ? 1 : 0)

  return (
    <div className="flex items-center justify-center gap-1.5">
      {Array.from({ length: full }).map((_, i) => (
        <Star key={`f${i}`} size={20} strokeWidth={1.5} className="fill-brand text-brand" />
      ))}
      {hasHalf && (
        <StarHalf size={20} strokeWidth={1.5} className="fill-brand text-brand" />
      )}
      {Array.from({ length: empty }).map((_, i) => (
        <Star key={`e${i}`} size={20} strokeWidth={1.5} className="fill-[#E4C87A] text-[#E4C87A] opacity-70" />
      ))}
    </div>
  )
}

export default function MeetDoctors() {
  const [doctors, setDoctors] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      try {
        const json = await api('/therapists/directory?city=Lahore&limit=4&skip=0', { method: 'GET' })
        if (!cancelled && json.success && json.data?.therapists) {
          setDoctors(
            json.data.therapists.map((d) => ({
              id: d.id,
              name: d.name,
              role: d.specializationTitle || 'Therapist',
              image: d.image,
              rating: typeof d.avgRating === 'number' ? d.avgRating : 4,
            }))
          )
        }
      } catch {
        if (!cancelled) setDoctors([])
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const fallback = [
    { id: 'f1', name: 'Dr. Aasma', role: 'Psychiatrist', image: '/images/Frame 33921.png', rating: 4 },
    { id: 'f2', name: 'Dr. Zahid', role: 'Counselor', image: '/images/Frame 33931.png', rating: 5 },
    { id: 'f3', name: 'Dr. Fatima', role: 'Psychologist', image: '/images/Frame 33932.png', rating: 4.5 },
  ]

  const rows = doctors.length > 0 ? doctors : !loading ? fallback : []

  return (
    <section className="bg-cream py-20 px-6 max-[768px]:py-14 max-[480px]:py-10 max-[480px]:px-4">
      <div className="max-w-7xl mx-auto">

        <div className="text-center mb-14 max-[480px]:mb-10">
          <h2 className="text-[44px] font-extrabold leading-[1.15] text-brand max-[1024px]:text-[36px] max-[480px]:text-[26px]">
            Meet Our Doctors
          </h2>
          <span className="block text-[14px] font-semibold text-brand mt-2">
            Our Team
          </span>
          {loading && <p className="text-[13px] text-[#666] mt-2">Loading featured therapists…</p>}
        </div>

        <div className="grid grid-cols-3 gap-10 max-[1024px]:grid-cols-2 max-[640px]:grid-cols-1 max-[640px]:max-w-sm max-[640px]:mx-auto">
          {rows.map(({ id, name, role, image, rating }) => (
            <div
              key={id}
              className="bg-white border border-brand/40 rounded-2xl overflow-hidden shadow-[0_12px_28px_-14px_rgba(31,95,74,0.35)]"
            >
              <div className="relative">
                <div className="absolute top-4 right-5 flex items-center gap-2.5 z-10">
                  <a href="#" aria-label="Facebook" className="text-brand hover:opacity-80">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M13.5 9H16V6h-2.5c-1.93 0-3.5 1.57-3.5 3.5V11H8v3h2v7h3v-7h2.5l.5-3H13V9.5c0-.28.22-.5.5-.5z"/>
                    </svg>
                  </a>
                  <a href="#" aria-label="LinkedIn" className="text-brand hover:opacity-80">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
                      <rect x="3" y="3" width="18" height="18" rx="2" />
                      <path d="M8 10v7M8 7v.01M12 17v-4a2 2 0 014 0v4M12 11v6" strokeLinecap="round" strokeLinejoin="round"/>
                    </svg>
                  </a>
                  <a href="#" aria-label="X" className="text-brand hover:opacity-80">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                      <path d="M18.244 2H21l-6.52 7.45L22 22h-6.828l-4.77-6.23L4.8 22H2l7.01-8.02L2 2h6.914l4.32 5.73L18.244 2zm-1.197 18h1.88L7.04 4H5.04l12.007 16z"/>
                    </svg>
                  </a>
                </div>

                {(() => {
                  const isFallbackDoctor = String(id).startsWith('f')
                  const hasRealImage = image && (
                    isFallbackDoctor || 
                    (image !== '/images/Frame 33921.png' && image !== '/images/therapist-profile-image.png')
                  )
                  return hasRealImage ? (
                    <img
                      src={image}
                      alt={name}
                      className="w-full h-96 object-cover object-top select-none pointer-events-none"
                      onError={(e) => {
                        e.target.style.display = 'none'
                        const sib = e.target.nextSibling
                        if (sib) sib.style.display = 'flex'
                      }}
                    />
                  ) : null
                })()}
                {(() => {
                  const isFallbackDoctor = String(id).startsWith('f')
                  const hasRealImage = image && (
                    isFallbackDoctor || 
                    (image !== '/images/Frame 33921.png' && image !== '/images/therapist-profile-image.png')
                  )
                  return !hasRealImage ? (
                    <div className="w-full h-96 bg-gradient-to-br from-brand to-[#2bb39a] text-white flex flex-col items-center justify-center font-extrabold text-[42px] tracking-widest shadow-sm select-none pointer-events-none">
                      {getInitials(name)}
                    </div>
                  ) : (
                    <div className="w-full h-96 bg-gradient-to-br from-brand to-[#2bb39a] text-white hidden flex-col items-center justify-center font-extrabold text-[42px] tracking-widest shadow-sm select-none pointer-events-none">
                      {getInitials(name)}
                    </div>
                  )
                })()}
              </div>

              <div className="text-center py-6 px-4">
                <h3 className="text-brand text-[22px] font-bold mb-1 max-[480px]:text-[20px]">
                  {name}
                </h3>
                <p className="text-brand text-[14px] font-semibold mb-4">
                  {role}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex justify-center mt-10">
          <Link
            to="/doctors"
            className="bg-brand text-white px-8 py-3 rounded-md text-[14px] font-semibold transition hover:bg-brand-dark"
          >
            View all doctors
          </Link>
        </div>

      </div>
    </section>
  )
}
