import { useState, useEffect } from 'react'
import { Link, useLocation, useNavigate } from 'react-router-dom'
import { Phone, Mail, UserRoundPlus, Menu, X, MessageCircle } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { useSocket } from '../context/SocketContext.jsx'
import { api } from '../lib/api.js'
import { portalLabel, trialEntryPath } from '../lib/authPaths.js'
import PortalCtaLink from './PortalCtaLink.jsx'

export default function Navbar() {
  const [menuOpen, setMenuOpen] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { user } = useAuth()
  const { unreadCount, setUnread } = useSocket() || {}

  // Load unread count on mount when logged in
  useEffect(() => {
    if (!user || !setUnread) return
    api('/chat/unread', { method: 'GET' })
      .then((j) => setUnread(j.data?.unread || 0))
      .catch(() => {})
  }, [user?.id, setUnread])

  const chatPath = user?.role === 'therapist' ? '/therapist-chat' : '/patient-chat'
  const trialHref = trialEntryPath(user)
  const trialLabel = user ? portalLabel(user.role) : 'Free Trial'
  const trialBtnClass =
    'shrink-0 inline-flex items-center justify-center bg-brand text-white rounded-full font-semibold whitespace-nowrap no-underline transition-all hover:bg-brand-dark hover:-translate-y-px px-3 py-2 text-[11px] sm:px-4 sm:py-2.5 sm:text-[12.5px] lg:px-6 lg:py-3 lg:text-[13.5px] lg:mr-1'

  const navItems = [
    { label: 'Home', to: '/' },
    { label: 'Doctors', to: '/doctors' },
    { label: 'About Us', to: '/about' },
    { label: 'Meditation Counselor', to: '/meditation-counselor' },
    { label: 'Resources', to: '/resources' },
    { label: 'Subscription', to: '/subscription' },
    { label: 'FAQS', to: '/faqs' },
    { label: 'Contact Us', to: '/contact-us' },
  ]

  return (
    <header className="absolute top-0 left-0 right-0 z-50 flex flex-col items-center pt-3 px-5 max-[768px]:px-4 max-[480px]:px-3">

      {/* Utility strip */}
      <div className="w-full max-w-7xl flex justify-between items-center py-2 text-[13px] text-brand max-[480px]:hidden">
        <div className="flex items-center gap-6">
          <span className="flex items-center gap-1.5 font-medium cursor-pointer">
            <Phone size={14} strokeWidth={2.2} />
            +123 456789
          </span>
          <span className="flex items-center gap-1.5 font-medium cursor-pointer max-[768px]:hidden">
            <Mail size={14} strokeWidth={2.2} />
            Benzi@gmail.com
          </span>
        </div>
        <Link to="/auth" className="flex items-center gap-1.5 font-medium cursor-pointer no-underline text-brand">
          <UserRoundPlus size={14} strokeWidth={2.2} />
          Login/Signup
        </Link>
      </div>

      {/* Pill navbar */}
      <div className="w-full max-w-7xl mt-2 min-w-0">
        <nav className="flex items-center justify-between gap-2 px-2 py-2 sm:px-3 sm:gap-3 rounded-full border border-white/35 bg-white/18 backdrop-blur-sm min-w-0">

          {/* Logo */}
          <Link to="/" className="pl-1 sm:pl-2 shrink-0 cursor-pointer min-w-0">
            <img
              src="/images/Header-Logo.png"
              alt="Benzi Logo"
              className="h-11 w-auto object-contain max-[768px]:h-9 max-[480px]:h-8"
            />
          </Link>

          {/* Desktop nav links */}
          <ul className="hidden lg:flex flex-1 justify-center items-center list-none gap-0">
            {navItems.map((item) => {
              const active = pathname === item.to && (item.to !== '/' || item.label === 'Home')
              return (
                <li key={item.label}>
                  <Link
                    to={item.to}
                    className={`block text-[13px] font-medium px-2.5 py-2 whitespace-nowrap no-underline transition-colors hover:text-brand ${active ? 'text-brand font-semibold' : 'text-[#2a2a2a]'}`}
                  >
                    {item.label}
                  </Link>
                </li>
              )
            })}
          </ul>

          {/* Chat icon (logged-in users) */}
          {user && (
            <button
              onClick={() => navigate(chatPath)}
              className="hidden lg:flex relative items-center justify-center h-9 w-9 rounded-full border border-black/10 bg-white/80 text-[#1f5f4a] hover:bg-white transition shrink-0"
              aria-label="Messages"
            >
              <MessageCircle size={17} />
              {unreadCount > 0 && (
                <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#0f4e34] text-white text-[9px] font-bold flex items-center justify-center">
                  {unreadCount > 9 ? '9+' : unreadCount}
                </span>
              )}
            </button>
          )}

          <div className="flex items-center gap-1.5 sm:gap-2 shrink-0 ml-auto">
            {/* Chat icon (logged-in, mobile) */}
            {user && (
              <button
                onClick={() => navigate(chatPath)}
                className="lg:hidden relative flex items-center justify-center h-9 w-9 rounded-full border border-black/10 bg-white/80 text-[#1f5f4a] hover:bg-white transition shrink-0"
                aria-label="Messages"
              >
                <MessageCircle size={17} />
                {unreadCount > 0 && (
                  <span className="absolute -top-1 -right-1 h-4 w-4 rounded-full bg-[#0f4e34] text-white text-[9px] font-bold flex items-center justify-center">
                    {unreadCount > 9 ? '9+' : unreadCount}
                  </span>
                )}
              </button>
            )}

            <PortalCtaLink
              href={trialHref}
              className={trialBtnClass}
              onClick={() => setMenuOpen(false)}
            >
              {trialLabel}
            </PortalCtaLink>

            {/* Hamburger */}
            <button
              type="button"
              className="lg:hidden text-brand p-1.5 sm:p-2 shrink-0 cursor-pointer bg-transparent border-none"
              onClick={() => setMenuOpen(!menuOpen)}
              aria-label="Toggle menu"
            >
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </nav>

        {/* Mobile dropdown */}
        {menuOpen && (
          <div className="mt-2 bg-white/96 backdrop-blur-md rounded-2xl border border-white/50 px-4 pt-4 pb-5 shadow-lg">
            <ul className="list-none flex flex-col mb-4">
              {navItems.map((item) => {
                const active = pathname === item.to && (item.to !== '/' || item.label === 'Home')
                return (
                  <li key={item.label}>
                    <Link
                      to={item.to}
                      onClick={() => setMenuOpen(false)}
                      className={`block py-3 px-2 no-underline text-[15px] font-medium border-b border-black/6 last:border-b-0 transition-colors hover:text-brand ${active ? 'text-brand font-semibold' : 'text-[#2a2a2a]'}`}
                    >
                      {item.label}
                    </Link>
                  </li>
                )
              })}
            </ul>
            {user && (
              <Link
                to={chatPath}
                onClick={() => setMenuOpen(false)}
                className="flex items-center gap-2 py-3 px-2 no-underline text-[15px] font-medium border-b border-black/6 text-[#2a2a2a] hover:text-brand"
              >
                <MessageCircle size={16} />
                Messages
                {unreadCount > 0 && (
                  <span className="ml-auto h-5 w-5 rounded-full bg-[#0f4e34] text-white text-[10px] font-bold flex items-center justify-center">
                    {unreadCount}
                  </span>
                )}
              </Link>
            )}
            <PortalCtaLink
              href={trialHref}
              className="block w-full text-center bg-brand text-white py-3 rounded-xl text-[15px] font-semibold no-underline transition-colors hover:bg-brand-dark"
              onClick={() => setMenuOpen(false)}
            >
              {trialLabel}
            </PortalCtaLink>
          </div>
        )}
      </div>

    </header>
  )
}
