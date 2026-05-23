import { useEffect, useState } from 'react'
import { Loader2 } from 'lucide-react'
import AdminLayout from '../../components/AdminLayout.jsx'
import AdminPageLoader from '../../components/AdminPageLoader.jsx'
import { AdminAlert } from '../../components/AdminAlert.jsx'
import { api } from '../../lib/api.js'

const emptyDraft = () => ({
  priceMonthly: '',
  priceYearly: '',
  maxPatients: '',
  aiMessageLimitMonthly: '',
  aiRecommendationLimitMonthly: '',
  tagline: '',
})

export default function AdminPlansPage() {
  const [plans, setPlans] = useState([])
  const [drafts, setDrafts] = useState({})
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const load = () => {
    setLoading(true)
    setError('')
    return api('/admin/subscription/plans', { method: 'GET', silent: true })
      .then((json) => {
        const list = json.data?.plans || []
        setPlans(list)
        const d = {}
        list.forEach((p) => {
          d[p.slug] = {
            priceMonthly: String(p.priceMonthly ?? ''),
            priceYearly: String(p.priceYearly ?? ''),
            maxPatients: String(p.maxPatients ?? ''),
            aiMessageLimitMonthly: String(p.limits?.aiMessageLimitMonthly ?? ''),
            aiRecommendationLimitMonthly: String(p.limits?.aiRecommendationLimitMonthly ?? ''),
            tagline: p.tagline || '',
          }
        })
        setDrafts(d)
      })
      .catch((e) => setError(e.message || 'Failed to load plans'))
      .finally(() => setLoading(false))
  }

  useEffect(() => {
    void load()
  }, [])

  const setDraft = (slug, field, value) => {
    setDrafts((prev) => ({
      ...prev,
      [slug]: { ...(prev[slug] || emptyDraft()), [field]: value },
    }))
  }

  const savePlan = async (slug) => {
    const d = drafts[slug]
    if (!d) return
    setSaving(slug)
    setError('')
    setSuccess('')
    try {
      await api(`/admin/subscription/plans/${slug}`, {
        method: 'PATCH',
        body: JSON.stringify({
          priceMonthlyCents: Math.round(Number(d.priceMonthly) * 100),
          priceYearlyCents: Math.round(Number(d.priceYearly) * 100),
          maxPatients: Number(d.maxPatients),
          aiMessageLimitMonthly: Number(d.aiMessageLimitMonthly),
          aiRecommendationLimitMonthly: Number(d.aiRecommendationLimitMonthly),
          tagline: d.tagline,
        }),
      })
      setSuccess(`Saved ${slug}`)
      await load()
    } catch (e) {
      setError(e.message || 'Save failed')
    } finally {
      setSaving(null)
    }
  }

  return (
    <AdminLayout activeItem="Plans" title="Subscription plans">
      <AdminAlert type="error" message={error} onDismiss={() => setError('')} />
      <AdminAlert type="success" message={success} onDismiss={() => setSuccess('')} />

      <p className="text-sm text-[#556b5b]">
        Pricing and limits apply to new checkouts and when you assign a plan. Therapists on a plan
        get enforced caps for patients and AI usage.
      </p>

      {loading ? (
        <AdminPageLoader label="Loading plans…" />
      ) : (
        <div className="space-y-6">
          {plans.map((plan) => {
            const d = drafts[plan.slug] || emptyDraft()
            return (
              <div key={plan.slug} className="rounded-2xl border border-black/10 bg-white p-6 shadow-sm">
                <div className="flex flex-wrap justify-between gap-2 mb-4">
                  <div>
                    <h2 className="text-lg font-bold text-[#0f3a2b]">{plan.name}</h2>
                    <p className="text-[12px] text-[#7d8b7d]">{plan.slug}</p>
                  </div>
                  {plan.featured && (
                    <span className="rounded-full bg-[#e8f3ea] text-[#1f5f4a] px-3 py-1 text-[11px] font-semibold h-fit">
                      Featured on website
                    </span>
                  )}
                </div>
                <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                  <label className="block text-[12px] font-semibold text-[#3f4f41]">
                    Monthly ($)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={d.priceMonthly}
                      onChange={(e) => setDraft(plan.slug, 'priceMonthly', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-[12px] font-semibold text-[#3f4f41]">
                    Yearly ($)
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      value={d.priceYearly}
                      onChange={(e) => setDraft(plan.slug, 'priceYearly', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-[12px] font-semibold text-[#3f4f41]">
                    Max patients
                    <input
                      type="number"
                      min="0"
                      value={d.maxPatients}
                      onChange={(e) => setDraft(plan.slug, 'maxPatients', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-[12px] font-semibold text-[#3f4f41]">
                    AI messages / month
                    <input
                      type="number"
                      min="0"
                      value={d.aiMessageLimitMonthly}
                      onChange={(e) => setDraft(plan.slug, 'aiMessageLimitMonthly', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-[12px] font-semibold text-[#3f4f41]">
                    AI recommendations / month
                    <input
                      type="number"
                      min="0"
                      value={d.aiRecommendationLimitMonthly}
                      onChange={(e) =>
                        setDraft(plan.slug, 'aiRecommendationLimitMonthly', e.target.value)
                      }
                      className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
                    />
                  </label>
                  <label className="block text-[12px] font-semibold text-[#3f4f41] sm:col-span-2 lg:col-span-3">
                    Tagline
                    <input
                      type="text"
                      value={d.tagline}
                      onChange={(e) => setDraft(plan.slug, 'tagline', e.target.value)}
                      className="mt-1 w-full rounded-xl border border-black/10 px-3 py-2 text-sm"
                    />
                  </label>
                </div>
                <button
                  type="button"
                  disabled={saving === plan.slug}
                  onClick={() => void savePlan(plan.slug)}
                  className="mt-4 inline-flex items-center gap-2 rounded-xl bg-brand text-white px-5 py-2.5 text-sm font-semibold disabled:opacity-60"
                >
                  {saving === plan.slug && <Loader2 size={16} className="animate-spin" />}
                  Save {plan.name}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </AdminLayout>
  )
}
