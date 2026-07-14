import { useEffect, useMemo, useState, useRef } from 'react'
import { Link } from 'react-router-dom'
import { ArrowRight, Eye, EyeOff, Lock, Mail, ShieldCheck } from 'lucide-react'
import { api } from '../lib/api.js'

const steps = [
  { label: 'Email' },
  { label: 'Verify' },
  { label: 'Reset' },
]

function StepIndicator({ index, step, active }) {
  const isCompleted = step > index
  const activeStyles =
    active || isCompleted
      ? 'bg-brand text-white border-brand'
      : 'bg-white text-[#777] border-black/10'

  return (
    <div className="relative flex flex-col items-center gap-2">
      <div
        className={`w-11 h-11 rounded-full border flex items-center justify-center text-sm font-semibold ${activeStyles}`}
      >
        {isCompleted ? '✓' : index}
      </div>
      <span className="text-[13px] text-[#555]">{steps[index - 1].label}</span>
    </div>
  )
}

function SixDigitInput({ value, onChange }) {
  const inputsRef = useRef([])

  const handleChange = (e, index) => {
    const val = e.target.value.replace(/[^0-9]/g, '')
    if (!val) {
      const next = [...value]
      next[index] = ''
      onChange(next)
      return
    }

    const singleVal = val.slice(-1)
    const next = [...value]
    next[index] = singleVal
    onChange(next)

    if (index < 5 && singleVal) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handleKeyDown = (e, index) => {
    if (e.key === 'Backspace') {
      if (!value[index] && index > 0) {
        const next = [...value]
        next[index - 1] = ''
        onChange(next)
        inputsRef.current[index - 1]?.focus()
      } else if (value[index]) {
        const next = [...value]
        next[index] = ''
        onChange(next)
      }
    } else if (e.key === 'ArrowLeft' && index > 0) {
      inputsRef.current[index - 1]?.focus()
    } else if (e.key === 'ArrowRight' && index < 5) {
      inputsRef.current[index + 1]?.focus()
    }
  }

  const handlePaste = (e) => {
    e.preventDefault()
    const pastedData = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6)
    if (pastedData.length > 0) {
      const next = [...value]
      for (let i = 0; i < 6; i++) {
        next[i] = pastedData[i] || ''
      }
      onChange(next)
      
      const focusIndex = Math.min(pastedData.length - 1, 5)
      inputsRef.current[focusIndex]?.focus()
    }
  }

  return (
    <div className="grid grid-cols-6 gap-3">
      {value.map((digit, index) => (
        <input
          key={index}
          ref={(el) => (inputsRef.current[index] = el)}
          type="text"
          inputMode="numeric"
          pattern="[0-9]*"
          maxLength="1"
          value={digit}
          onChange={(e) => handleChange(e, index)}
          onKeyDown={(e) => handleKeyDown(e, index)}
          onPaste={handlePaste}
          className="w-full h-14 text-center border border-black/10 rounded-xl text-[20px] font-semibold bg-[#f5f5f5] focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none transition-all"
        />
      ))}
    </div>
  )
}

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [code, setCode] = useState(Array(6).fill(''))
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [showConfirm, setShowConfirm] = useState(false)
  const [timer, setTimer] = useState(46)
  const [loading, setLoading] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')

  useEffect(() => {
    if (step !== 2) {
      setTimer(46)
      return
    }

    const id = window.setInterval(() => {
      setTimer((value) => Math.max(0, value - 1))
    }, 1000)

    return () => window.clearInterval(id)
  }, [step])

  const maskedEmail = useMemo(() => {
    if (!email || !email.includes('@')) {
      return 'fa*********@gmail.com'
    }

    const [local, domain] = email.split('@')
    const visible = local.slice(0, 2)
    const stars = '*'.repeat(Math.max(3, local.length - 2))
    return `${visible}${stars}@${domain}`
  }, [email])

  const allDigitsEntered = code.every((digit) => digit.length === 1)

  const handleSendCode = async (e) => {
    e.preventDefault()
    if (!email) return
    setLoading(true)
    setErrorMsg('')
    try {
      await api('/auth/forgot-password', {
        method: 'POST',
        body: JSON.stringify({ email })
      })
      setStep(2)
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyCode = (e) => {
    e.preventDefault()
    if (!allDigitsEntered) return
    setStep(3)
  }

  const handleResetPassword = async (e) => {
    e.preventDefault()
    if (!password || password !== confirmPassword) return
    setLoading(true)
    setErrorMsg('')
    try {
      const token = code.join('')
      await api('/auth/reset-password', {
        method: 'POST',
        body: JSON.stringify({ token, password, confirmPassword })
      })
      
      setStep(1)
      setEmail('')
      setCode(Array(6).fill(''))
      setPassword('')
      setConfirmPassword('')
      alert('Password reset successfully. You can now log in with your new password.')
    } catch (err) {
      setErrorMsg(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <>
      <div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />

      <section className="bg-cream px-6 py-12 max-[480px]:px-4 max-[480px]:py-8">
        <div className="w-[90%] mx-auto flex flex-col items-center">
          <div className="w-full max-w-xl bg-white rounded-[30px] shadow-sm border border-black/5 px-10 py-12 max-[640px]:px-6 max-[640px]:py-8">
            <div className="relative mb-10">
              <div className="absolute inset-x-0 top-1/2 h-px bg-black/10" />
              <div className="relative flex items-center justify-between">
                {steps.map((item, index) => (
                  <StepIndicator
                    key={item.label}
                    index={index + 1}
                    step={step}
                    active={step === index + 1}
                  />
                ))}
              </div>
            </div>

            <div className="flex flex-col items-center gap-4 mb-8 text-center">
              <div className="w-20 h-20 rounded-full bg-[#ecf6f0] flex items-center justify-center border border-brand/20 text-brand">
                {step === 1 && <Mail size={28} />}
                {step === 2 && <ShieldCheck size={28} />}
                {step === 3 && <Lock size={28} />}
              </div>
              <h2 className="text-[24px] font-extrabold text-[#0f3a2b]">
                {step === 1 && 'Forgot Password?'}
                {step === 2 && 'Enter Verification Code'}
                {step === 3 && 'Create New Password'}
              </h2>
              <p className="text-[14px] text-[#666] max-w-105 leading-[1.8]">
                {step === 1 && 'No worries! Enter your email and we’ll send you a verification code to reset your password.'}
                {step === 2 && 'We’ve sent a 6-digit verification code to '}
                {step === 2 && <span className="font-semibold text-[#173e2f]">{maskedEmail}</span>}
                {step === 3 && 'Your identity has been verified. Set your new password below.'}
              </p>
            </div>

            {step === 1 && (
              <form onSubmit={handleSendCode} className="flex flex-col gap-5">
                {errorMsg && <div className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg">{errorMsg}</div>}
                <div>
                  <label className="block text-[13.5px] font-semibold text-[#1a1a1a] mb-2">
                    Email Address
                  </label>
                  <input
                    type="email"
                    placeholder="your@email.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full border border-black/10 rounded-2xl px-4 py-4 text-[14px] bg-[#f5f5f5] text-[#222] placeholder:text-[#999] outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-brand text-white py-4 rounded-2xl text-[15px] font-semibold transition-all hover:bg-brand-dark hover:-translate-y-px disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {loading ? 'Sending...' : <>Send Verification Code <ArrowRight size={16} className="inline-block ml-2" /></>}
                </button>

                <div className="text-center text-[13px] text-[#333]">
                  Remember your password?{' '}
                  <Link to="/login" className="text-brand font-semibold underline">
                    Back to login
                  </Link>
                </div>
              </form>
            )}

            {step === 2 && (
              <form onSubmit={handleVerifyCode} className="flex flex-col gap-5">
                {errorMsg && <div className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg">{errorMsg}</div>}
                <SixDigitInput value={code} onChange={setCode} />

                <button
                  type="submit"
                  className="w-full bg-brand text-white py-4 rounded-2xl text-[15px] font-semibold transition-all hover:bg-brand-dark hover:-translate-y-px disabled:cursor-not-allowed disabled:bg-brand/60"
                  disabled={!allDigitsEntered}
                >
                  Verify & Continue <ArrowRight size={16} className="inline-block ml-2" />
                </button>

                <div className="flex flex-col items-center gap-3 text-[13px] text-[#333]">
                  <span>{timer > 0 ? `Resend code in ${timer}s` : 'Didn’t receive a code? Please try again.'}</span>
                  <button
                    type="button"
                    onClick={() => {
                      setCode(Array(6).fill(''))
                      setTimer(46)
                    }}
                    className="text-brand font-semibold hover:underline"
                  >
                    Resend code
                  </button>
                  <button
                    type="button"
                    onClick={() => setStep(1)}
                    className="text-[#666] hover:text-brand transition-colors"
                  >
                    ← Change email address
                  </button>
                </div>
              </form>
            )}

            {step === 3 && (
              <form onSubmit={handleResetPassword} className="flex flex-col gap-5">
                {errorMsg && <div className="text-red-500 text-sm text-center font-medium bg-red-50 py-2 rounded-lg">{errorMsg}</div>}
                <div>
                  <label className="block text-[13.5px] font-semibold text-[#1a1a1a] mb-2">
                    New Password
                  </label>
                  <div className="relative">
                    <input
                      type={showPassword ? 'text' : 'password'}
                      placeholder="Minimum 8 characters"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      className="w-full border border-black/10 rounded-2xl px-4 py-4 pr-12 text-[14px] bg-[#f5f5f5] text-[#222] placeholder:text-[#999] outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowPassword((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#777]"
                    >
                      {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-[13.5px] font-semibold text-[#1a1a1a] mb-2">
                    Confirm Password
                  </label>
                  <div className="relative">
                    <input
                      type={showConfirm ? 'text' : 'password'}
                      placeholder="Re-enter your password"
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      className="w-full border border-black/10 rounded-2xl px-4 py-4 pr-12 text-[14px] bg-[#f5f5f5] text-[#222] placeholder:text-[#999] outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirm((value) => !value)}
                      className="absolute right-4 top-1/2 -translate-y-1/2 text-[#777]"
                    >
                      {showConfirm ? <EyeOff size={18} /> : <Eye size={18} />}
                    </button>
                  </div>
                </div>

                <button
                  type="submit"
                  className="w-full bg-brand text-white py-4 rounded-2xl text-[15px] font-semibold transition-all hover:bg-brand-dark hover:-translate-y-px disabled:cursor-not-allowed disabled:bg-brand/60"
                  disabled={!password || password !== confirmPassword || loading}
                >
                  {loading ? 'Resetting...' : <>Reset Password <ArrowRight size={16} className="inline-block ml-2" /></>}
                </button>
              </form>
            )}
          </div>
        </div>
      </section>
    </>
  )
}
