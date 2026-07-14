import { useState, useEffect } from 'react'
import { Link, useNavigate, useLocation, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { canAccessPath, portalUrl, isExternalPortalHref, goToPortal } from '../lib/authPaths.js'

function portalFromParam(p) {
  if (p === 'therapist' || p === 'patient') return p
  return 'patient'
}

export default function LoginPage() {
  const [searchParams] = useSearchParams()
  const [portal, setPortal] = useState(() => portalFromParam(searchParams.get('portal')))
  const [form, setForm] = useState({ email: '', password: '' })
  const [showPwd, setShowPwd] = useState(false)
  const [remember, setRemember] = useState(false)
  const [submitting, setSubmitting] = useState(false)
  const [formError, setFormError] = useState('')
  const { login, user, loading: authLoading } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  useEffect(() => {
    setPortal(portalFromParam(searchParams.get('portal')))
  }, [searchParams])

  useEffect(() => {
    if (authLoading || !user?.role) return
    const dest = portalUrl(user.role)
    if (isExternalPortalHref(dest)) {
      window.location.replace(dest)
      return
    }
    navigate(dest, { replace: true })
  }, [authLoading, user, navigate])

  const handleSubmit = async (e) => {
    e.preventDefault()
    setFormError('')
    setSubmitting(true)
    try {
      const user = await login(form.email.trim(), form.password, remember, portal)
      if (user && user.requires2FA) {
        navigate('/login-2fa', {
          state: {
            tempToken: user.tempToken,
            remember,
            portal,
            user: user.user,
          },
        })
        return
      }
      if (user && user.isTemporaryPassword) {
        navigate('/change-password-force', { replace: true })
        return
      }
      const from = location.state?.from
      if (
        typeof from === 'string' &&
        from.startsWith('/') &&
        !from.startsWith('//') &&
        canAccessPath(user.role, from)
      ) {
        navigate(from, { replace: true })
      } else {
        goToPortal(navigate, user.role, { replace: true })
      }
    } catch (err) {
      const detail =
        err.errors?.map((x) => x.message || `${x.field}: invalid`).join(' ') ||
        err.message ||
        'Login failed'
      setFormError(detail)
    } finally {
      setSubmitting(false)
    }
  }

  const tabClass = (key) =>
    `flex-1 rounded-lg py-2.5 text-[13px] font-semibold transition-all border ${
      portal === key ? 'bg-brand text-white border-brand' : 'bg-[#f5f5f5] text-[#333] border-black/10 hover:border-brand/40'
    }`

  return (
    <>
      {/* Spacer for absolute navbar */}
      <div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />

      <section className="bg-cream px-6 py-12 max-[480px]:px-4 max-[480px]:py-8">
        <div className="w-[90%] mx-auto grid grid-cols-2 gap-16 items-center max-[900px]:grid-cols-1 max-[900px]:gap-10">

          {/* Left — Brand + robot */}
          <div className="flex flex-col">
            <img
              src="/images/Header-Logo.png"
              alt="Benzi"
              className="h-16 w-auto object-contain self-start"
            />

            <p className="text-[14px] text-[#666] leading-[1.9] max-w-md mt-6">
              Empowering mental wellness through personalized care
              and evidence-based therapies. Take the first step
              towards a brighter future with us.
            </p>

            <div className="flex flex-col items-start gap-4 mt-0 max-[600px]:gap-3">
              <h3 className="text-[26px] font-extrabold text-[#111] leading-[1.35] max-[1024px]:text-[22px] max-[480px]:text-[19px]">
                If you don't have an account<br />
                you can{' '}
                <Link to="/register" className="text-brand underline">
                  Login here!
                </Link>
              </h3>
              <img
                src="/images/52b99d76887a3fda7bc2eecd198daa29 1.png"
                alt="Benzi AI bot"
                className="h-56 object-contain shrink-0 max-[1024px]:h-44 max-[480px]:h-32"
              />
            </div>
          </div>

          {/* Right — Login card */}
          <div className="bg-white rounded-2xl shadow-sm border border-black/5 px-12 py-10 max-[600px]:px-6 max-[600px]:py-8">
            <div className="flex flex-col items-center">
              <img
                src="/images/Header-Logo.png"
                alt="Benzi"
                className="h-12 w-auto object-contain"
              />
              <span className="text-brand font-semibold text-[15px] mt-4 underline">
                Login here
              </span>
            </div>

            <div className="mt-6 flex gap-2 rounded-xl border border-black/10 bg-[#fafaf8] p-1">
              <button type="button" className={tabClass('patient')} onClick={() => setPortal('patient')}>
                Patient
              </button>
              <button type="button" className={tabClass('therapist')} onClick={() => setPortal('therapist')}>
                Therapist
              </button>
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-5 mt-8">
              <div>
                <label className="block text-[13.5px] font-semibold text-[#1a1a1a] mb-2">
                  Username or Email Address*
                </label>
                <input
                  type="text"
                  placeholder="info@gmail.com"
                  value={form.email}
                  onChange={update('email')}
                  autoComplete="username"
                  className="w-full border border-black/10 rounded-lg px-4 py-3 text-[14px] bg-[#f5f5f5] text-[#222] placeholder:text-[#999] outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div>
                <label className="block text-[13.5px] font-semibold text-[#1a1a1a] mb-2">
                  Password*
                </label>
                <div className="relative">
                  <input
                    type={showPwd ? 'text' : 'password'}
                    placeholder="************"
                    value={form.password}
                    onChange={update('password')}
                    autoComplete="current-password"
                    className="w-full border border-black/10 rounded-lg px-4 py-3 pr-12 text-[14px] bg-[#f5f5f5] text-[#222] placeholder:text-[#999] outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPwd((v) => !v)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-[#777] cursor-pointer bg-transparent border-none"
                  >
                    {showPwd ? <EyeOff size={18} /> : <Eye size={18} />}
                  </button>
                </div>
              </div>

              <div className="flex justify-between items-center text-[13px] mt-1">
                <label className="flex items-center gap-2 cursor-pointer text-[#333]">
                  <input
                    type="checkbox"
                    checked={remember}
                    onChange={(e) => setRemember(e.target.checked)}
                    className="accent-brand w-4 h-4 cursor-pointer"
                  />
                  Remember me
                </label>
                <Link to="/forgot-password" className="text-brand font-medium hover:underline">
                  Forgot password?
                </Link>
              </div>

              {formError ? (
                <p className="text-[13.5px] text-[#b00020] text-center" role="alert">
                  {formError}
                </p>
              ) : null}

              <button
                type="submit"
                disabled={submitting}
                className="w-full bg-brand text-white py-3 rounded-md text-[15px] font-semibold cursor-pointer transition-all hover:bg-brand-dark hover:-translate-y-px mt-2 disabled:opacity-70 disabled:cursor-wait"
              >
                Login
              </button>

              <p className="text-center text-[13.5px] text-[#333]">
                Don't have an account?{' '}
                <Link
                  to={portal === 'therapist' ? '/register?role=therapist' : '/register?role=patient'}
                  className="text-brand font-semibold underline"
                >
                  Sign Up
                </Link>
              </p>
            </form>
          </div>
        </div>
      </section>
    </>
  )
}
