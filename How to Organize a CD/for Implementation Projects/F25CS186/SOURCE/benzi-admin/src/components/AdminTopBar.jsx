import { Link } from 'react-router-dom'
import { ExternalLink, LogOut } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'

const websiteUrl =
  import.meta.env.VITE_PUBLIC_WEBSITE_URL || 'http://localhost:5173'

export default function AdminTopBar() {
  const { logout, user } = useAuth()

  return (
    <header className="sticky top-0 z-50 bg-brand text-white shadow-md border-b border-white/10">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-14 sm:h-16 flex items-center justify-between gap-3">
        <Link to="/admin-dashboard" className="flex items-center gap-2.5 sm:gap-3 min-w-0 shrink">
          <img
            src="/images/benzi-nav-logo.png"
            alt="BENZI"
            className="h-9 sm:h-10 w-auto object-contain shrink-0"
          />
          <div className="min-w-0 hidden xs:block">
            <p className="text-[14px] sm:text-[15px] font-bold leading-tight truncate">BENZI Admin</p>
            <p className="text-[10px] text-white/70 truncate hidden sm:block">
              {user?.email || 'Platform control'}
            </p>
          </div>
        </Link>

        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          <a
            href={websiteUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-1.5 rounded-full bg-white/15 hover:bg-white/25 px-3 sm:px-4 py-2 text-[11px] sm:text-[12px] font-semibold transition"
          >
            <ExternalLink size={14} className="shrink-0" />
            <span className="hidden sm:inline">View website</span>
            <span className="sm:hidden">Website</span>
          </a>
          <button
            type="button"
            onClick={() => logout()}
            className="inline-flex items-center gap-1.5 rounded-full bg-white text-brand hover:bg-white/90 px-3 sm:px-4 py-2 text-[11px] sm:text-[12px] font-semibold transition"
          >
            <LogOut size={14} />
            Logout
          </button>
        </div>
      </div>
    </header>
  )
}
