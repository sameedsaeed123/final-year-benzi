import { Link } from 'react-router-dom'
import { ExternalLink, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { displayFirstName } from '../lib/userDisplay.js'
import { resolveMediaUrl } from '../lib/api.js'

const websiteUrl = import.meta.env.VITE_PUBLIC_WEBSITE_URL || 'http://localhost:5173'

const PORTAL_META = {
  patient: { title: 'Patient Portal', home: '/patient-dashboard', profile: '/patient-profile' },
  therapist: { title: 'Therapist Portal', home: '/therapist-dashboard', profile: '/therapist-profile' },
}

const DEFAULT_AVATAR = '/images/therapist-profile-image.png'

export default function PortalTopBar() {
  const { logout, user } = useAuth()
  const meta = PORTAL_META[user?.role] || { title: 'BENZI Portal', home: '/', profile: '/' }
  const avatarSrc = resolveMediaUrl(user?.profileImageUrl) || DEFAULT_AVATAR
  const displayName = displayFirstName(user)

  return (
    <header className="sticky top-0 z-50 bg-brand text-white shadow-md border-b border-white/10 overflow-hidden">
      <div className="max-w-7xl mx-auto px-3 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-2 sm:gap-3 min-w-0">
        <Link to={meta.home} className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink">
          <img
            src="/images/benzi-nav-logo.png"
            alt="BENZI"
            className="h-9 sm:h-10 w-auto object-contain shrink-0"
          />
          <div className="min-w-0 border-l border-white/20 pl-2.5 sm:pl-3">
            <p className="text-[14px] sm:text-[15px] font-bold leading-tight truncate">BENZI</p>
            <p className="text-[10px] text-white/70 uppercase tracking-widest truncate">{meta.title}</p>
          </div>
        </Link>

        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 min-w-0">
          {user?.role === 'patient' && (
            <Link
              to="/doctors"
              className="inline-flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 px-2.5 sm:px-4 py-2 text-[11px] sm:text-[12px] font-semibold transition shrink-0"
            >
              Find Doctors
            </Link>
          )}
          <Link
            to={meta.profile}
            className="inline-flex items-center gap-2 rounded-full bg-white/15 hover:bg-white/25 pl-1 pr-3 py-1 text-[11px] sm:text-[12px] font-semibold transition max-w-[160px] sm:max-w-[200px]"
            title="Profile"
          >
            <img
              src={avatarSrc}
              alt={displayName}
              className="h-8 w-8 rounded-full object-cover border-2 border-white/40 shrink-0 bg-white/20"
              onError={(e) => {
                e.currentTarget.onerror = null
                e.currentTarget.src = DEFAULT_AVATAR
              }}
            />
            <span className="truncate hidden sm:inline">{displayName}</span>
          </Link>
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 px-2.5 sm:px-4 py-2 text-[11px] sm:text-[12px] font-semibold transition shrink-0"
          >
            <ExternalLink size={14} className="shrink-0" />
            <span className="hidden sm:inline">View website</span>
            <span className="sm:hidden">Website</span>
          </a>
          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex items-center gap-1.5 rounded-full bg-white text-brand hover:bg-white/90 px-2.5 sm:px-4 py-2 text-[11px] sm:text-[12px] font-semibold transition shrink-0"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
