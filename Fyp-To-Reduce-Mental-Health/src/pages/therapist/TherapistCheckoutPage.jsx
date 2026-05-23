import { useState, useEffect } from 'react'
import { Link, useNavigate, useSearchParams } from 'react-router-dom'
import { Eye, EyeOff, Loader2, Tag } from 'lucide-react'
import PlanPricingGrid from '../../components/PlanPricingGrid.jsx'
import { api } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function TherapistCheckoutPage() {
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const { user, register } = useAuth()

  const [billing, setBilling] = useState(
    searchParams.get('interval') === 'yearly' ? 'Annual' : 'Monthly'
  )
  const [plans, setPlans] = useState([])
  const [selectedPlan, setSelectedPlan] = useState(null)
  const [coupon, setCoupon] = useState('')
  const [couponMsg, setCouponMsg] = useState('')
  const [couponValid, setCouponValid] = useState(null)
  const [loading, setLoading] = useState(true)
  const [processing, setProcessing] = useState(false)
  const [error, setError] = useState('')
  const [stripeEnabled, setStripeEnabled] = useState(false)

  const [reg, setReg] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    password: '',
    confirmPassword: '',
  })
  const [showPwd, setShowPwd] = useState(false)
  const [agree, setAgree] = useState(false)

  const billingInterval = billing === 'Annual' ? 'yearly' : 'monthly'

  useEffect(() => {
    api('/subscriptions/plans', { method: 'GET', silent: true })
      .then((json) => {
        const list = json.data?.plans || []
        setPlans(list)
        setStripeEnabled(Boolean(json.data?.stripeEnabled))
        const fromQuery = searchParams.get('plan')
        const pick = list.find((p) => p.slug === fromQuery) || list[0]
        setSelectedPlan(pick)
      })
      .catch(() => setPlans([]))
      .finally(() => setLoading(false))
  }, [searchParams])

  const validateCoupon = async () => {
    if (!selectedPlan || !coupon.trim()) return
    try {
      const json = await api('/subscriptions/coupons/validate', {
        method: 'POST',
        body: JSON.stringify({ code: coupon.trim(), planSlug: selectedPlan.slug }),
        silent: true,
      })
      setCouponValid(json.data?.valid)
      setCouponMsg(json.data?.valid ? 'Coupon applied' : json.data?.message || 'Invalid')
    } catch {
      setCouponValid(false)
      setCouponMsg('Could not validate coupon')
    }
  }

  const runCheckout = async () => {
    if (!selectedPlan) return
    setError('')
    setProcessing(true)
    try {
      if (!user) {
        if (!agree) {
          setError('Please agree to the terms.')
          setProcessing(false)
          return
        }
        if (reg.password !== reg.confirmPassword) {
          setError('Passwords do not match.')
          setProcessing(false)
          return
        }
        await register(
          {
            ...reg,
            email: reg.email.trim().toLowerCase(),
            role: 'therapist',
          },
          false
        )
      }

      if (user && user.role !== 'therapist') {
        setError('Only therapist accounts can subscribe.')
        setProcessing(false)
        return
      }

      const price =
        billingInterval === 'yearly'
          ? selectedPlan.priceYearlyCents
          : selectedPlan.priceMonthlyCents

      if (price === 0) {
        await api('/subscriptions/activate-free', {
          method: 'POST',
          body: JSON.stringify({ planSlug: selectedPlan.slug }),
        })
        navigate('/therapist-dashboard', { replace: true })
        return
      }

      const json = await api('/subscriptions/checkout', {
        method: 'POST',
        body: JSON.stringify({
          planSlug: selectedPlan.slug,
          billingInterval,
          couponCode: couponValid ? coupon.trim() : '',
          returnOrigin: window.location.origin,
        }),
      })

      const url = json.data?.checkoutUrl
      if (url) {
        if (json.data?.mode === 'dev') {
          navigate(
            `/therapist-checkout/success?plan=${selectedPlan.slug}&interval=${billingInterval}&session_id=dev_${selectedPlan.slug}`
          )
        } else {
          window.location.href = url
        }
      } else {
        setError('Checkout could not be started.')
      }
    } catch (e) {
      setError(e.message || 'Checkout failed')
    } finally {
      setProcessing(false)
    }
  }

  const priceDisplay = selectedPlan
    ? billingInterval === 'yearly'
      ? selectedPlan.priceYearly
      : selectedPlan.priceMonthly
    : 0

  return (
    <>
      <div className="pt-28 max-[768px]:pt-24" />
      <section className="bg-cream min-h-screen px-6 py-12 max-w-7xl mx-auto">
        <div className="text-center mb-8">
          <h1 className="text-[32px] font-extrabold text-brand">Therapist checkout</h1>
          <p className="text-[#556b5b] mt-2 max-w-lg mx-auto text-sm">
            Select a plan and complete payment.
            {!stripeEnabled && (
              <span className="block text-[12px] text-[#7a5b4b] mt-1">
                Stripe not configured — dev mode activates plans without payment.
              </span>
            )}
          </p>
        </div>

        <div className="flex justify-center mb-16 max-[480px]:mb-12 px-1">
          <div className="inline-flex w-full max-w-xs sm:max-w-none sm:w-auto bg-[#DCEBE4] rounded-xl p-1.5 sm:p-2">
            {['Monthly', 'Annual'].map((opt) => (
              <button
                key={opt}
                type="button"
                onClick={() => setBilling(opt)}
                className={[
                  'flex-1 sm:flex-none px-6 sm:px-12 py-2.5 rounded-lg text-[18px] sm:text-[22px] font-bold transition-all cursor-pointer',
                  billing === opt ? 'bg-white text-brand shadow-md' : 'text-brand hover:bg-white/40',
                ].join(' ')}
              >
                {opt}
              </button>
            ))}
          </div>
        </div>

        {loading ? (
          <p className="text-center text-[#7d8b7d]">Loading plans…</p>
        ) : (
          <PlanPricingGrid
            billing={billing}
            plans={plans}
            selectedSlug={selectedPlan?.slug}
            onSelectPlan={setSelectedPlan}
          />
        )}

        <div className="mt-12 max-w-lg mx-auto rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
          <h2 className="text-lg font-bold text-[#0f3a2b]">Complete checkout</h2>
          {selectedPlan && (
            <p className="mt-2 text-sm text-[#556b5b]">
              {selectedPlan.name} — {billingInterval === 'yearly' ? 'Annual' : 'Monthly'} —{' '}
              <span className="font-bold text-brand">
                {priceDisplay === 0 ? 'Free' : `$${priceDisplay}`}
              </span>
            </p>
          )}

          <div className="mt-4 flex gap-2">
            <input
              type="text"
              value={coupon}
              onChange={(e) => {
                setCoupon(e.target.value)
                setCouponValid(null)
                setCouponMsg('')
              }}
              placeholder="Coupon code"
              className="flex-1 rounded-xl border border-black/10 px-3 py-2.5 text-sm outline-none focus:border-brand"
            />
            <button
              type="button"
              onClick={() => void validateCoupon()}
              className="rounded-xl border border-brand text-brand px-4 text-sm font-semibold"
            >
              Apply
            </button>
          </div>
          {couponMsg && (
            <p className={`mt-2 text-[12px] ${couponValid ? 'text-[#1f5f4a]' : 'text-[#b42318]'}`}>
              {couponMsg}
            </p>
          )}

          {!user && (
            <div className="mt-6 space-y-3 border-t border-black/10 pt-6">
              <p className="text-sm font-semibold text-[#0f3a2b]">Create therapist account</p>
              <div className="grid grid-cols-2 gap-2">
                <input
                  required
                  placeholder="First name"
                  value={reg.firstName}
                  onChange={(e) => setReg((r) => ({ ...r, firstName: e.target.value }))}
                  className="rounded-xl border border-black/10 px-3 py-2 text-sm"
                />
                <input
                  required
                  placeholder="Last name"
                  value={reg.lastName}
                  onChange={(e) => setReg((r) => ({ ...r, lastName: e.target.value }))}
                  className="rounded-xl border border-black/10 px-3 py-2 text-sm"
                />
              </div>
              <input
                required
                type="email"
                placeholder="Email"
                value={reg.email}
                onChange={(e) => setReg((r) => ({ ...r, email: e.target.value }))}
                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
              />
              <input
                placeholder="Phone"
                value={reg.phone}
                onChange={(e) => setReg((r) => ({ ...r, phone: e.target.value }))}
                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
              />
              <div className="relative">
                <input
                  required
                  type={showPwd ? 'text' : 'password'}
                  placeholder="Password"
                  value={reg.password}
                  onChange={(e) => setReg((r) => ({ ...r, password: e.target.value }))}
                  className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm pr-10"
                />
                <button
                  type="button"
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-[#7d8b7d]"
                  onClick={() => setShowPwd((s) => !s)}
                >
                  {showPwd ? <EyeOff size={16} /> : <Eye size={16} />}
                </button>
              </div>
              <input
                required
                type="password"
                placeholder="Confirm password"
                value={reg.confirmPassword}
                onChange={(e) => setReg((r) => ({ ...r, confirmPassword: e.target.value }))}
                className="w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
              />
              <label className="flex items-start gap-2 text-[12px] text-[#556b5b]">
                <input
                  type="checkbox"
                  checked={agree}
                  onChange={(e) => setAgree(e.target.checked)}
                  className="mt-0.5"
                />
                I agree to BENZI terms for therapist accounts.
              </label>
            </div>
          )}

          {error && <p className="mt-4 text-sm text-[#b42318]">{error}</p>}

          <button
            type="button"
            disabled={processing || !selectedPlan}
            onClick={() => void runCheckout()}
            className="mt-6 w-full flex items-center justify-center gap-2 rounded-lg bg-brand text-white py-3 font-semibold disabled:opacity-60"
          >
            {processing && <Loader2 size={18} className="animate-spin" />}
            {priceDisplay === 0 ? 'Activate free plan' : 'Continue to payment'}
          </button>

          {!user && (
            <p className="mt-3 text-center text-[12px] text-[#7d8b7d]">
              Already have an account?{' '}
              <Link to="/login" className="text-brand font-semibold">
                Log in
              </Link>
            </p>
          )}
        </div>
      </section>
    </>
  )
}
