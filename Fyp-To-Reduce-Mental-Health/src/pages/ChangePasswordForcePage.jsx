import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Eye, EyeOff, Lock, ShieldCheck } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'
import { goToPortal } from '../lib/authPaths.js'

export default function ChangePasswordForcePage() {
  const { user, refreshSession } = useAuth()
  const navigate = useNavigate()
  const [form, setForm] = useState({
    oldPassword: '',
    newPassword: '',
    confirmPassword: '',
  })
  const [showOld, setShowOld] = useState(false)
  const [showNew, setShowNew] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  if (!user) {
    navigate('/login')
    return null
  }

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    if (!form.oldPassword || !form.newPassword || !form.confirmPassword) {
      setError('All fields are required.')
      return
    }

    if (form.newPassword !== form.confirmPassword) {
      setError('New passwords do not match.')
      return
    }

    if (form.newPassword.length < 8) {
      setError('New password must be at least 8 characters long.')
      return
    }

    setLoading(true)
    try {
      const res = await api('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify(form),
      })

      if (res.success) {
        setSuccess('Password updated successfully! Redirecting to your dashboard...')
        // Refresh local session state to update isTemporaryPassword flag
        await refreshSession()
        setTimeout(() => {
          goToPortal(navigate, user.role, { replace: true })
        }, 1500)
      } else {
        setError(res.message || 'Failed to change password. Please check your current temporary password.')
      }
    } catch (err) {
      setError(err.message || 'An error occurred. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
      <section className="bg-cream min-h-screen px-6 py-12 max-[480px]:px-4">
        <div className="max-w-md mx-auto bg-white rounded-[30px] border border-black/5 p-10 shadow-xl max-[480px]:p-6">
          <div className="flex flex-col items-center text-center mb-8">
            <span className="h-14 w-14 rounded-full bg-[#e8f3ea] flex items-center justify-center mb-4 text-brand">
              <ShieldCheck size={28} />
            </span>
            <h2 className="text-[28px] font-extrabold text-[#0f3a2b] tracking-tight">Secure Your Account</h2>
            <p className="text-sm text-gray-500 mt-2 max-w-sm">
              Dr. {user.firstName || 'your therapist'} invited you to BENZI! Please choose a new secure password to activate your account.
            </p>
          </div>

          {error && (
            <div className="bg-red-50 text-red-700 p-4 rounded-2xl text-xs font-semibold mb-6 text-center border border-red-100">
              {error}
            </div>
          )}
          {success && (
            <div className="bg-green-50 text-green-700 p-4 rounded-2xl text-xs font-semibold mb-6 text-center border border-green-100">
              {success}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                Temporary Password
              </label>
              <div className="relative">
                <input
                  type={showOld ? 'text' : 'password'}
                  placeholder="Enter the password from your email"
                  value={form.oldPassword}
                  onChange={update('oldPassword')}
                  className="w-full rounded-2xl border border-black/10 bg-[#f8faf8] px-4 py-3.5 pl-11 pr-11 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <button
                  type="button"
                  onClick={() => setShowOld(!showOld)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none outline-none cursor-pointer"
                >
                  {showOld ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                New Custom Password
              </label>
              <div className="relative">
                <input
                  type={showNew ? 'text' : 'password'}
                  placeholder="At least 8 characters"
                  value={form.newPassword}
                  onChange={update('newPassword')}
                  className="w-full rounded-2xl border border-black/10 bg-[#f8faf8] px-4 py-3.5 pl-11 pr-11 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <button
                  type="button"
                  onClick={() => setShowNew(!showNew)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none outline-none cursor-pointer"
                >
                  {showNew ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <div>
              <label className="block text-xs font-bold text-gray-700 mb-2 uppercase tracking-wider">
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirm ? 'text' : 'password'}
                  placeholder="Repeat your new password"
                  value={form.confirmPassword}
                  onChange={update('confirmPassword')}
                  className="w-full rounded-2xl border border-black/10 bg-[#f8faf8] px-4 py-3.5 pl-11 pr-11 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 transition-all"
                  required
                />
                <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 h-4 w-4" />
                <button
                  type="button"
                  onClick={() => setShowConfirm(!showConfirm)}
                  className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 bg-transparent border-none outline-none cursor-pointer"
                >
                  {showConfirm ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-brand text-white py-4 rounded-2xl text-[15px] font-semibold transition-all hover:bg-brand-dark disabled:opacity-75 flex items-center justify-center gap-2 mt-8 shadow-md"
            >
              {loading ? 'Activating Account...' : 'Set Password & Start Using BENZI'}
            </button>
          </form>
        </div>
      </section>
    </>
  )
}
