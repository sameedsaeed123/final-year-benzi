import { useState, useRef, useEffect } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { ShieldCheck, Mail, Key, Sparkles, Smartphone, Check } from 'lucide-react'
import { useAuth } from '../context/AuthContext.jsx'
import { api } from '../lib/api.js'
import { dashboardPath } from '../lib/authPaths.js'

export default function Login2FAPage() {
  const location = useLocation()
  const navigate = useNavigate()
  const { complete2FALogin } = useAuth()
  
  // Extract transition states with a sessionStorage fallback to survive page refreshes
  const [sessionState] = useState(() => {
    if (location.state && location.state.tempToken) {
      sessionStorage.setItem('benzi_temp_2fa', JSON.stringify(location.state))
      return location.state
    }
    try {
      const stored = sessionStorage.getItem('benzi_temp_2fa')
      return stored ? JSON.parse(stored) : {}
    } catch {
      return {}
    }
  })

  const { tempToken, remember, portal, user } = sessionState

  // 2FA methods: 'totp' (App), 'email' (Email Fallback), 'backup' (Emergency codes)
  const [method, setMethod] = useState('totp')
  
  // OTP input state (6 fields for TOTP/Email, 1 text input for backup code)
  const [otp, setOtp] = useState(['', '', '', '', '', ''])
  const [backupCode, setBackupCode] = useState('')
  
  const [loading, setLoading] = useState(false)
  const [emailSent, setEmailSent] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  
  const inputRefs = [
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
    useRef(null),
  ]

  // Redirect home if tempToken is missing
  useEffect(() => {
    if (!tempToken) {
      navigate('/login')
    }
  }, [tempToken, navigate])

  // Clear inputs when changing verification method
  useEffect(() => {
    setOtp(['', '', '', '', '', ''])
    setBackupCode('')
    setError('')
    setSuccess('')
    if (method === 'totp') {
      setTimeout(() => inputRefs[0].current?.focus(), 100)
    }
  }, [method])

  const handleOtpChange = (index, value) => {
    const cleanVal = value.replace(/[^0-9]/g, '').slice(-1)
    const nextOtp = [...otp]
    nextOtp[index] = cleanVal
    setOtp(nextOtp)

    if (cleanVal && index < 5) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handleKeyDown = (index, e) => {
    if (e.key === 'Backspace') {
      if (!otp[index] && index > 0) {
        const nextOtp = [...otp]
        nextOtp[index - 1] = ''
        setOtp(nextOtp)
        inputRefs[index - 1].current?.focus()
      } else {
        const nextOtp = [...otp]
        nextOtp[index] = ''
        setOtp(nextOtp)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputRefs[index - 1].current?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputRefs[index + 1].current?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').trim()
    const digits = pastedData.replace(/[^0-9]/g, '').slice(0, 6).split('')
    
    if (digits.length === 6) {
      const nextOtp = [...otp]
      for (let i = 0; i < 6; i++) {
        nextOtp[i] = digits[i]
      }
      setOtp(nextOtp)
      inputRefs[5].current?.focus()
    }
  }

  // Trigger backend to send email 2FA code
  const handleSendEmailCode = async () => {
    setError('')
    setSuccess('')
    setLoading(true)
    try {
      const res = await api('/auth/2fa/send-code', {
        method: 'POST',
        body: JSON.stringify({ tempToken }),
      })
      if (res.success) {
        setEmailSent(true)
        setSuccess('Verification code sent successfully to your email address!')
      } else {
        setError(res.message || 'Failed to dispatch email verification code.')
      }
    } catch (err) {
      setError(err.message || 'Could not send verification code. Try again later.')
    } finally {
      setLoading(false)
    }
  }

  // Verify the code and complete login
  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    const code = method === 'backup' ? backupCode.trim() : otp.join('')
    if (!code || (method !== 'backup' && code.length < 6)) {
      setError('Please enter a valid code.')
      return
    }

    setLoading(true)
    try {
      const res = await api('/auth/2fa/verify', {
        method: 'POST',
        body: JSON.stringify({
          tempToken,
          token: code,
          method,
        }),
      })

      if (res.success && res.data?.accessToken) {
        setSuccess('2FA verified successfully! Logging you in...')
        sessionStorage.removeItem('benzi_temp_2fa')
        await complete2FALogin(res.data.accessToken, res.data.user, remember)
        
        setTimeout(() => {
          if (res.data.isTemporaryPassword) {
            navigate('/change-password-force', { replace: true })
          } else {
            navigate(dashboardPath(res.data.user.role), { replace: true })
          }
        }, 1200)
      } else {
        setError(res.message || 'Invalid 2FA verification code. Please try again.')
      }
    } catch (err) {
      setError(err.message || 'Verification failed. Try again.')
    } finally {
      setLoading(false)
    }
  }

  const tabClass = (key) =>
    `flex-1 rounded-xl py-3 text-[13px] font-bold transition-all border flex items-center justify-center gap-2 cursor-pointer ${
      method === key
        ? 'bg-brand text-white border-brand shadow-sm'
        : 'bg-white text-gray-600 border-black/5 hover:border-brand/40 shadow-sm'
    }`

  return (
    <>
      <div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
      <section className="bg-cream min-h-screen px-6 py-12 max-[480px]:px-4">
        <div className="max-w-lg mx-auto bg-white rounded-[32px] border border-black/5 p-12 shadow-xl max-[480px]:p-6">
          
          {/* Top Brand Header */}
          <div className="flex flex-col items-center text-center mb-8">
            <span className="h-16 w-16 rounded-2xl bg-[#e8f3ea] flex items-center justify-center mb-4 text-brand">
              <ShieldCheck size={32} />
            </span>
            <h2 className="text-[28px] font-extrabold text-[#0f3a2b] tracking-tight">Two-Factor Verification</h2>
            <p className="text-sm text-gray-500 mt-2 max-w-sm">
              Your account is secure. Please enter the verification code below to finish signing in as {user?.firstName || 'User'}.
            </p>
          </div>

          {/* Verification Method Navigation Tabs */}
          <div className="flex gap-2.5 mb-8 bg-[#fafaf9] p-1.5 rounded-2xl border border-black/5">
            <button type="button" className={tabClass('totp')} onClick={() => setMethod('totp')}>
              <Smartphone size={16} />
              <span>Auth App</span>
            </button>
            <button type="button" className={tabClass('email')} onClick={() => setMethod('email')}>
              <Mail size={16} />
              <span>Email Code</span>
            </button>
            <button type="button" className={tabClass('backup')} onClick={() => setMethod('backup')}>
              <Key size={16} />
              <span>Backup Key</span>
            </button>
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

          <form onSubmit={handleSubmit} className="space-y-8">
            {/* Authenticator App / TOTP Method */}
            {method === 'totp' && (
              <div className="flex flex-col items-center">
                <span className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest">
                  Enter 6-Digit Authenticator Code
                </span>
                <div className="flex gap-2 max-[480px]:gap-1">
                  {otp.map((digit, idx) => (
                    <input
                      key={idx}
                      ref={inputRefs[idx]}
                      type="text"
                      inputMode="numeric"
                      maxLength={1}
                      value={digit}
                      onChange={(e) => handleOtpChange(idx, e.target.value)}
                      onKeyDown={(e) => handleKeyDown(idx, e)}
                      onPaste={idx === 0 ? handlePaste : undefined}
                      className="w-12 h-14 text-center text-xl font-extrabold rounded-xl border border-black/10 bg-[#f8faf8] focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all text-brand shrink-0"
                    />
                  ))}
                </div>
              </div>
            )}

            {/* Email Fallback Method */}
            {method === 'email' && (
              <div className="flex flex-col items-center">
                {!emailSent ? (
                  <div className="text-center py-6 space-y-4">
                    <p className="text-sm text-gray-600">
                      We can send a one-time verification code directly to your registered email address.
                    </p>
                    <button
                      type="button"
                      onClick={handleSendEmailCode}
                      disabled={loading}
                      className="bg-brand/10 text-brand px-6 py-3 rounded-xl text-[14px] font-bold hover:bg-brand/20 transition-all cursor-pointer flex items-center justify-center gap-2 mx-auto disabled:opacity-50"
                    >
                      <Mail size={16} />
                      Send Code to Email
                    </button>
                  </div>
                ) : (
                  <div className="flex flex-col items-center w-full">
                    <span className="text-xs font-bold text-gray-500 mb-4 uppercase tracking-widest">
                      Enter 6-Digit Email Code
                    </span>
                    <div className="flex gap-2 max-[480px]:gap-1 mb-4">
                      {otp.map((digit, idx) => (
                        <input
                          key={idx}
                          ref={inputRefs[idx]}
                          type="text"
                          inputMode="numeric"
                          maxLength={1}
                          value={digit}
                          onChange={(e) => handleOtpChange(idx, e.target.value)}
                          onKeyDown={(e) => handleKeyDown(idx, e)}
                          onPaste={idx === 0 ? handlePaste : undefined}
                          className="w-12 h-14 text-center text-xl font-extrabold rounded-xl border border-black/10 bg-[#f8faf8] focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all text-brand shrink-0"
                        />
                      ))}
                    </div>
                    <button
                      type="button"
                      onClick={handleSendEmailCode}
                      disabled={loading}
                      className="text-xs text-brand hover:underline font-bold bg-transparent border-none cursor-pointer mt-2"
                    >
                      Resend email code
                    </button>
                  </div>
                )}
              </div>
            )}

            {/* Backup/Emergency Codes Method */}
            {method === 'backup' && (
              <div>
                <label className="block text-xs font-bold text-gray-500 mb-3 uppercase tracking-widest text-center">
                  Enter an Emergency Backup Code
                </label>
                <input
                  type="text"
                  placeholder="e.g. 12345-67890"
                  value={backupCode}
                  onChange={(e) => setBackupCode(e.target.value)}
                  className="w-full text-center text-lg font-mono font-bold tracking-widest rounded-2xl border border-black/10 bg-[#f8faf8] px-4 py-4 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all text-brand"
                  required
                />
                <p className="text-xs text-gray-400 text-center mt-3">
                  Backup codes were generated and saved when you first configured Two-Factor Authentication.
                </p>
              </div>
            )}

            {/* Submit Code Verification Button */}
            {(method !== 'email' || emailSent) && (
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-brand text-white py-4 rounded-2xl text-[15px] font-semibold transition-all hover:bg-brand-dark disabled:opacity-75 flex items-center justify-center gap-2 mt-8 shadow-md cursor-pointer"
              >
                {loading ? 'Verifying Code...' : 'Complete Secure Verification'}
              </button>
            )}
          </form>
        </div>
      </section>
    </>
  )
}
