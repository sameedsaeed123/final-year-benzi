import { useEffect, useState, useRef } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { CheckCircle2, Loader2, AlertCircle } from 'lucide-react'
import { api } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function TherapistCheckoutSuccessPage() {
  const [searchParams] = useSearchParams()
  const { user, loading: authLoading } = useAuth()
  const [status, setStatus] = useState('loading')
  const [planName, setPlanName] = useState('')
  const [errorMsg, setErrorMsg] = useState('')
  const ran = useRef(false)

  const plan = searchParams.get('plan') || 'benzi-pro'
  const interval = searchParams.get('interval') || 'monthly'
  const sessionId = searchParams.get('session_id') || ''

  useEffect(() => {
    if (ran.current) return
    ran.current = true

    if (!sessionId) {
      setErrorMsg('Missing payment session. Contact support if you were charged.')
      setStatus('error')
      return
    }

    const q = `plan=${encodeURIComponent(plan)}&interval=${encodeURIComponent(interval)}`
    const url = `/subscriptions/public/session/${encodeURIComponent(sessionId)}/confirm?${q}`

    api(url, { method: 'GET', silent: true })
      .then((json) => {
        const data = json.data || {}
        if (data.activated) {
          setPlanName(data.planName || data.planSlug || plan)
          setStatus('ok')
        } else {
          setErrorMsg('Payment is still processing. Refresh in a moment or check your email receipt.')
          setStatus('pending')
        }
      })
      .catch((e) => {
        setErrorMsg(e.message || 'Could not confirm subscription. Try logging in — your payment may still be recorded.')
        setStatus('error')
      })
  }, [sessionId, plan, interval])

  const loggedInTherapist = !authLoading && user?.role === 'therapist'

  return (
    <>
      <div className="pt-28 max-[768px]:pt-24" />
      <section className="bg-cream min-h-[70vh] flex items-center justify-center px-6 py-16">
        <div className="max-w-lg w-full rounded-[32px] border border-black/10 bg-white p-10 text-center shadow-lg">
          <img
            src="/images/Header-Logo.png"
            alt="BENZI"
            className="h-10 mx-auto mb-6 object-contain"
          />

          {status === 'loading' && (
            <>
              <Loader2 className="mx-auto animate-spin text-brand" size={44} />
              <h1 className="mt-6 text-xl font-bold text-[#0f3a2b]">Confirming your subscription…</h1>
              <p className="mt-2 text-sm text-[#556b5b]">This only takes a few seconds.</p>
            </>
          )}

          {status === 'ok' && (
            <>
              <CheckCircle2 className="mx-auto text-[#1f5f4a]" size={52} />
              <h1 className="mt-4 text-2xl font-bold text-[#0f3a2b]">Payment successful</h1>
              <p className="mt-2 text-sm text-[#556b5b]">
                <span className="font-semibold text-brand">{planName}</span> is now active on your
                account ({interval === 'yearly' ? 'yearly' : 'monthly'} billing).
              </p>
              {loggedInTherapist ? (
                <Link
                  to="/therapist-dashboard"
                  className="mt-8 inline-block w-full rounded-2xl bg-brand text-white py-3.5 font-semibold hover:opacity-95"
                >
                  Go to therapist dashboard
                </Link>
              ) : (
                <>
                  <p className="mt-4 text-[12px] text-[#7d8b7d]">
                    Log in with the same email you used at checkout to see your plan in the portal.
                  </p>
                  <Link
                    to="/login"
                    className="mt-4 inline-block w-full rounded-2xl bg-brand text-white py-3.5 font-semibold hover:opacity-95"
                  >
                    Log in as therapist
                  </Link>
                </>
              )}
              <Link
                to="/therapist-subscription"
                className="mt-3 inline-block text-sm text-brand font-semibold"
              >
                View subscription details
              </Link>
            </>
          )}

          {(status === 'error' || status === 'pending') && (
            <>
              <AlertCircle className="mx-auto text-[#b45309]" size={48} />
              <h1 className="mt-4 text-xl font-bold text-[#0f3a2b]">
                {status === 'pending' ? 'Almost there' : 'We need a moment'}
              </h1>
              <p className="mt-2 text-sm text-[#556b5b]">{errorMsg}</p>
              <button
                type="button"
                onClick={() => window.location.reload()}
                className="mt-6 w-full rounded-2xl border border-brand text-brand py-3 font-semibold"
              >
                Try again
              </button>
              <Link
                to="/login"
                className="mt-3 inline-block text-sm text-brand font-semibold"
              >
                Log in as therapist
              </Link>
            </>
          )}
        </div>
      </section>
    </>
  )
}
