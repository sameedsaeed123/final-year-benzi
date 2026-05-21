import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronRight } from 'lucide-react'
import TherapistSidebar from '../../components/TherapistSidebar'
import { useAuth } from '../../context/AuthContext.jsx'
import { displayFirstName, displayFullName } from '../../lib/userDisplay.js'
import { api, apiForm } from '../../lib/api.js'

const emptyForm = {
  firstName: '',
  lastName: '',
  phone: '',
  email: '',
  city: 'Lahore',
  userPhoto: '',
  therapistPhotoUrl: '',
  specializationTitle: '',
  qualification: '',
  practiceLocation: '',
  experienceYears: '',
  bio: '',
  waitTimeLabel: 'Under 15 Min',
  sessionCount: '',
  clientCount: '',
  availableLocations: [],
  paymentBankName: '',
  paymentAccountName: '',
  paymentAccountNumber: '',
}

const emptyPwd = { oldPassword: '', newPassword: '', confirmPassword: '' }

export default function TherapistProfilePage() {
  const { user, refreshSession } = useAuth()
  const welcomeName = displayFirstName(user)
  const fullName = displayFullName(user)
  const [form, setForm] = useState(emptyForm)
  const [pwd, setPwd] = useState(emptyPwd)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [pwdSaving, setPwdSaving] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [message, setMessage] = useState('')
  const [pwdMessage, setPwdMessage] = useState('')
  const [error, setError] = useState('')
  const [pwdError, setPwdError] = useState('')

  // 2FA States
  const [setupData, setSetupData] = useState(null)
  const [setupCode, setSetupCode] = useState('')
  const [disablePassword, setDisablePassword] = useState('')
  const [showDisableConfirm, setShowDisableConfirm] = useState(false)
  const [twoFALoading, setTwoFALoading] = useState(false)
  const [twoFAError, setTwoFAError] = useState('')
  const [twoFASuccess, setTwoFASuccess] = useState('')
  const [emailCodeSent, setEmailCodeSent] = useState(false)

  const initiate2FA = async () => {
    setTwoFAError('')
    setTwoFASuccess('')
    setEmailCodeSent(false)
    setTwoFALoading(true)
    try {
      const res = await api('/auth/2fa/enable', { method: 'POST' })
      if (res.success && res.data) {
        setSetupData({
          qrCodeUrl: res.data.qrCodeUrl,
          secret: res.data.secret,
        })
      } else {
        setTwoFAError(res.message || 'Failed to initiate 2FA.')
      }
    } catch (err) {
      setTwoFAError(err.message || 'Failed to initiate 2FA.')
    } finally {
      setTwoFALoading(false)
    }
  }

  const sendSetupEmailCode = async () => {
    setTwoFAError('')
    setTwoFASuccess('')
    setTwoFALoading(true)
    try {
      const res = await api('/auth/2fa/send-code', {
        method: 'POST',
        body: JSON.stringify({}),
      })
      if (res.success) {
        setEmailCodeSent(true)
        setTwoFASuccess('Verification code has been sent to your email!')
      } else {
        setTwoFAError(res.message || 'Failed to send verification code.')
      }
    } catch (err) {
      setTwoFAError(err.message || 'Failed to send verification code.')
    } finally {
      setTwoFALoading(false)
    }
  }

  const confirm2FA = async () => {
    if (setupCode.length < 6) {
      setTwoFAError('Please enter a 6-digit verification code.')
      return
    }
    setTwoFAError('')
    setTwoFASuccess('')
    setTwoFALoading(true)
    try {
      const res = await api('/auth/2fa/verify-enable', {
        method: 'POST',
        body: JSON.stringify({ token: setupCode }),
      })
      if (res.success) {
        setTwoFASuccess('Two-factor authentication enabled successfully!')
        setSetupData(null)
        setSetupCode('')
        setEmailCodeSent(false)
        await refreshSession()
      } else {
        setTwoFAError(res.message || 'Invalid verification code.')
      }
    } catch (err) {
      setTwoFAError(err.message || 'Invalid verification code.')
    } finally {
      setTwoFALoading(false)
    }
  }

  const disable2FA = async () => {
    if (!disablePassword) {
      setTwoFAError('Password is required.')
      return
    }
    setTwoFAError('')
    setTwoFASuccess('')
    setTwoFALoading(true)
    try {
      const res = await api('/auth/2fa/disable', {
        method: 'POST',
        body: JSON.stringify({ password: disablePassword }),
      })
      if (res.success) {
        setTwoFASuccess('Two-factor authentication disabled successfully!')
        setShowDisableConfirm(false)
        setDisablePassword('')
        await refreshSession()
      } else {
        setTwoFAError(res.message || 'Incorrect password.')
      }
    } catch (err) {
      setTwoFAError(err.message || 'Failed to disable 2FA.')
    } finally {
      setTwoFALoading(false)
    }
  }

  useEffect(() => {
    let cancelled = false
    const load = async () => {
      setLoading(true)
      setError('')
      try {
        const json = await api('/therapists/profile/me', { method: 'GET' })
        if (cancelled || !json.success || !json.data) return
        const { user: u, therapist: t } = json.data
        setForm({
          firstName: u.firstName || '',
          lastName: u.lastName || '',
          phone: u.phone || '',
          email: u.email || '',
          city: t.city || 'Lahore',
          userPhoto: u.profileImageUrl || '',
          therapistPhotoUrl: t.profileImageUrl || '',
          specializationTitle: t.specializationTitle || '',
          qualification: t.qualification || '',
          practiceLocation: t.practiceLocation || '',
          experienceYears: t.experienceYears != null ? String(t.experienceYears) : '',
          bio: t.bio || '',
          waitTimeLabel: t.waitTimeLabel || 'Under 15 Min',
          sessionCount: t.sessionCount != null ? String(t.sessionCount) : '',
          clientCount: t.clientCount != null ? String(t.clientCount) : '',
          availableLocations: t.availableLocations || [],
          paymentBankName: t.paymentBankName || '',
          paymentAccountName: t.paymentAccountName || '',
          paymentAccountNumber: t.paymentAccountNumber || '',
        })
      } catch (e) {
        if (!cancelled) setError(e.message || 'Could not load profile.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [])

  const avatarSrc =
    (form.userPhoto || '').trim() ||
    (form.therapistPhotoUrl || '').trim() ||
    '/images/therapist-profile-image.png'

  const update = (key) => (e) => {
    const v = e.target.value
    setForm((f) => ({ ...f, [key]: v }))
  }

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setMessage('')
    setError('')
    try {
      const body = {
        firstName: form.firstName.trim(),
        lastName: form.lastName.trim(),
        phone: form.phone.trim(),
        city: form.city.trim(),
        profileImageUrl: form.therapistPhotoUrl.trim(),
        specializationTitle: form.specializationTitle.trim(),
        qualification: form.qualification.trim(),
        practiceLocation: form.practiceLocation.trim(),
        experienceYears: Number(form.experienceYears) || 0,
        bio: form.bio.trim(),
        waitTimeLabel: form.waitTimeLabel.trim(),
        availableLocations: form.availableLocations || [],
        paymentBankName: form.paymentBankName.trim(),
        paymentAccountName: form.paymentAccountName.trim(),
        paymentAccountNumber: form.paymentAccountNumber.trim(),
      }
      const json = await api('/therapists/profile/me', { method: 'PATCH', body: JSON.stringify(body) })
      if (!json.success || !json.data) throw new Error(json.message || 'Save failed')
      const { user: u, therapist: t } = json.data
      setForm((prev) => ({
        ...prev,
        firstName: u.firstName || '',
        lastName: u.lastName || '',
        phone: u.phone || '',
        email: u.email || '',
        city: t.city || 'Lahore',
        userPhoto: u.profileImageUrl || '',
        therapistPhotoUrl: t.profileImageUrl || '',
        specializationTitle: t.specializationTitle || '',
        qualification: t.qualification || '',
        practiceLocation: t.practiceLocation || '',
        experienceYears: t.experienceYears != null ? String(t.experienceYears) : '',
        bio: t.bio || '',
        waitTimeLabel: t.waitTimeLabel || 'Under 15 Min',
        sessionCount: t.sessionCount != null ? String(t.sessionCount) : '',
        clientCount: t.clientCount != null ? String(t.clientCount) : '',
        availableLocations: t.availableLocations || [],
        paymentBankName: t.paymentBankName || '',
        paymentAccountName: t.paymentAccountName || '',
        paymentAccountNumber: t.paymentAccountNumber || '',
      }))
      setMessage('Profile updated.')
      await refreshSession()
    } catch (err) {
      setError(err.message || 'Save failed.')
    } finally {
      setSaving(false)
    }
  }

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setError('')
    setMessage('')
    try {
      const fd = new FormData()
      fd.append('photo', file)
      const json = await apiForm('/auth/profile-photo', fd)
      if (!json.success || !json.data?.profileImageUrl) throw new Error(json.message || 'Upload failed')
      setForm((f) => ({ ...f, userPhoto: json.data.profileImageUrl }))
      setMessage('Profile photo uploaded.')
      await refreshSession()
    } catch (err) {
      setError(err.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    setPwdSaving(true)
    setPwdMessage('')
    setPwdError('')
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          oldPassword: pwd.oldPassword,
          newPassword: pwd.newPassword,
          confirmPassword: pwd.confirmPassword,
        }),
      })
      setPwdMessage('Password updated. Use it next time you sign in.')
      setPwd(emptyPwd)
    } catch (err) {
      const detail =
        err.errors?.map((x) => x.message || `${x.field}`).join(' ') || err.message || 'Failed'
      setPwdError(detail)
    } finally {
      setPwdSaving(false)
    }
  }

  return (
    <>
      <div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
      <section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-brand/70">Profile</p>
            <h1 className="text-[36px] font-extrabold text-[#0f3a2b] max-[640px]:text-[28px]">{`Welcome ${welcomeName}!`}</h1>
          </div>
          <Link
            to="/therapist-profile"
            className="flex items-center gap-2 bg-white border border-black/10 rounded-full px-4 py-3 shadow-sm text-[14px] font-semibold text-[#111] transition-all hover:-translate-y-0.5"
          >
            <Bell size={18} />
            <span>{welcomeName}</span>
            <ChevronRight size={18} />
          </Link>
        </div>

        <div className="grid gap-6 xl:grid-cols-[1.4fr_280px] max-[1280px]:grid-cols-1">
          <div className="space-y-6">
            <form onSubmit={saveProfile} className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
              <div>
                <p className="text-[22px] font-semibold text-[#111]">Doctor Profile</p>
                <p className="text-[13px] text-brand font-semibold underline underline-offset-4">Personal Information</p>
              </div>

              {loading && <p className="mt-4 text-sm text-[#666]">Loading profile…</p>}
              {error && <p className="mt-4 text-sm text-red-700">{error}</p>}
              {message && <p className="mt-4 text-sm text-[#1f5f4a]">{message}</p>}

              <div className="mt-4 flex flex-wrap items-center justify-between gap-4 rounded-[18px] border border-black/5 bg-[#f7f4ee] px-4 py-3">
                <div className="flex items-center gap-3 min-w-0">
                  <img src={avatarSrc} alt="Profile" className="h-14 w-14 rounded-full object-cover shrink-0 border border-black/10" />
                  <div>
                    <p className="text-[14px] font-semibold text-[#111] truncate">{fullName}</p>
                    <p className="text-[11px] text-[#666]">Uploaded photo is shown on your account and in the public directory.</p>
                  </div>
                </div>
                <div className="flex flex-col gap-2 items-end">
                  <label className="rounded-full bg-[#0f4e34] px-4 py-2 text-[12px] font-semibold text-white cursor-pointer hover:bg-[#164e35] disabled:opacity-50">
                    {uploading ? 'Uploading…' : 'Upload photo'}
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onPickPhoto} disabled={uploading || loading} />
                  </label>
                </div>
              </div>

              <div className="mt-5 grid gap-4">
                <div>
                  <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Directory image URL (optional)</label>
                  <p className="text-[11px] text-[#666] mb-1">Fallback or external image for listings if you do not use upload.</p>
                  <input
                    type="text"
                    value={form.therapistPhotoUrl}
                    onChange={update('therapistPhotoUrl')}
                    placeholder="/images/Frame 33921.png"
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] text-[#2e3f34]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Full Name*</label>
                  <div className="grid gap-3 sm:grid-cols-2">
                    <input
                      type="text"
                      value={form.firstName}
                      onChange={update('firstName')}
                      placeholder="First name"
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] text-[#2e3f34]"
                    />
                    <input
                      type="text"
                      value={form.lastName}
                      onChange={update('lastName')}
                      placeholder="Last name"
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] text-[#2e3f34]"
                    />
                  </div>
                </div>
                <div className="grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Phone</label>
                    <input
                      type="text"
                      value={form.phone}
                      onChange={update('phone')}
                      placeholder="+92…"
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] text-[#2e3f34]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Email</label>
                    <input
                      type="email"
                      value={form.email}
                      readOnly
                      className="w-full rounded-xl border border-black/10 bg-[#f0f0eb] px-4 py-2.5 text-[13px] text-[#555]"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">City (directory)</label>
                  <input
                    type="text"
                    value={form.city}
                    onChange={update('city')}
                    placeholder="Lahore"
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] text-[#2e3f34]"
                  />
                </div>
              </div>

              <div className="mt-6">
                <p className="text-[14px] text-brand font-semibold underline underline-offset-4">Professional Information</p>
                <div className="mt-4 grid gap-4 sm:grid-cols-2">
                  <div>
                    <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Specialization*</label>
                    <input
                      type="text"
                      value={form.specializationTitle}
                      onChange={update('specializationTitle')}
                      placeholder="Psychiatrist"
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] text-[#2e3f34]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Qualification*</label>
                    <input
                      type="text"
                      value={form.qualification}
                      onChange={update('qualification')}
                      placeholder="MBBS, MCPS"
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] text-[#2e3f34]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Practice location*</label>
                    <input
                      type="text"
                      value={form.practiceLocation}
                      onChange={update('practiceLocation')}
                      placeholder="Clinic / hospital"
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] text-[#2e3f34]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Experience (years)*</label>
                    <input
                      type="number"
                      min={0}
                      max={80}
                      value={form.experienceYears}
                      onChange={update('experienceYears')}
                      placeholder="5"
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] text-[#2e3f34]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Wait time label</label>
                    <input
                      type="text"
                      value={form.waitTimeLabel}
                      onChange={update('waitTimeLabel')}
                      placeholder="Under 15 Min"
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] text-[#2e3f34]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Sessions (read-only)</label>
                    <input
                      type="text"
                      value={form.sessionCount}
                      readOnly
                      className="w-full rounded-xl border border-black/10 bg-[#f0f0eb] px-4 py-2.5 text-[13px] text-[#555]"
                    />
                  </div>
                  <div>
                    <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Clients (read-only)</label>
                    <input
                      type="text"
                      value={form.clientCount}
                      readOnly
                      className="w-full rounded-xl border border-black/10 bg-[#f0f0eb] px-4 py-2.5 text-[13px] text-[#555]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Bio</label>
                    <textarea
                      rows={4}
                      value={form.bio}
                      onChange={update('bio')}
                      placeholder="Short professional bio…"
                      className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] text-[#2e3f34]"
                    />
                  </div>
                  <div className="sm:col-span-2">
                    <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Available Locations*</label>
                    <p className="text-[11px] text-[#666] mb-3">Select where you offer sessions.</p>
                    <div className="space-y-2">
                      {['online', 'office', 'clinic'].map((loc) => (
                        <label key={loc} className="flex items-center gap-3 cursor-pointer p-2 rounded hover:bg-[#f7f4ee]">
                          <input
                            type="checkbox"
                            checked={form.availableLocations.includes(loc)}
                            onChange={(e) => {
                              if (e.target.checked) {
                                setForm((f) => ({ ...f, availableLocations: [...f.availableLocations, loc] }))
                              } else {
                                setForm((f) => ({
                                  ...f,
                                  availableLocations: f.availableLocations.filter((x) => x !== loc),
                                }))
                              }
                            }}
                            className="w-4 h-4 rounded border border-black/30 accent-[#0f4e34]"
                          />
                          <span className="text-[13px] text-[#1a1a1a] font-medium">
                            {loc === 'online' ? 'Video Call' : loc === 'office' ? 'Office / Hospital' : 'Clinic'}
                          </span>
                        </label>
                      ))}
                    </div>
                  </div>
                  <div className="sm:col-span-2 mt-4 pt-4 border-t border-black/10">
                    <p className="text-[14px] text-brand font-semibold mb-4">Payment Details (For Online Booking)</p>
                    <div className="grid gap-4 sm:grid-cols-3">
                      <div>
                        <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Bank Name</label>
                        <input
                          type="text"
                          value={form.paymentBankName}
                          onChange={update('paymentBankName')}
                          placeholder="e.g. Meezan Bank"
                          className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] text-[#2e3f34]"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Account Name</label>
                        <input
                          type="text"
                          value={form.paymentAccountName}
                          onChange={update('paymentAccountName')}
                          placeholder="e.g. John Doe"
                          className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] text-[#2e3f34]"
                        />
                      </div>
                      <div>
                        <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Account Number / IBAN</label>
                        <input
                          type="text"
                          value={form.paymentAccountNumber}
                          onChange={update('paymentAccountNumber')}
                          placeholder="e.g. PK00MEZN0001234567"
                          className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] text-[#2e3f34]"
                        />
                      </div>
                    </div>
                  </div>
                </div>
                <div className="flex justify-center pt-4">
                  <button
                    type="submit"
                    disabled={saving || loading}
                    className="rounded-full bg-[#0f4e34] px-8 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Save profile'}
                  </button>
                </div>
              </div>
            </form>

            <form onSubmit={savePassword} className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
              <p className="text-[14px] text-brand font-semibold underline underline-offset-4">Change Password</p>
              <p className="mt-2 text-[12px] text-[#666]">8+ characters with uppercase, lowercase, number, and special character.</p>
              {pwdError && <p className="mt-2 text-sm text-red-700">{pwdError}</p>}
              {pwdMessage && <p className="mt-2 text-sm text-[#1f5f4a]">{pwdMessage}</p>}
              <div className="mt-4 grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Current password</label>
                  <input
                    type="password"
                    value={pwd.oldPassword}
                    onChange={(e) => setPwd((p) => ({ ...p, oldPassword: e.target.value }))}
                    autoComplete="current-password"
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] text-[#2e3f34]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">New password</label>
                  <input
                    type="password"
                    value={pwd.newPassword}
                    onChange={(e) => setPwd((p) => ({ ...p, newPassword: e.target.value }))}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] text-[#2e3f34]"
                  />
                </div>
                <div>
                  <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Confirm new password</label>
                  <input
                    type="password"
                    value={pwd.confirmPassword}
                    onChange={(e) => setPwd((p) => ({ ...p, confirmPassword: e.target.value }))}
                    autoComplete="new-password"
                    className="w-full rounded-xl border border-black/10 bg-white px-4 py-2.5 text-[13px] text-[#2e3f34]"
                  />
                </div>
              </div>
              <div className="mt-4 flex justify-center">
                <button
                  type="submit"
                  disabled={pwdSaving}
                  className="rounded-full bg-[#0f4e34] px-8 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50"
                >
                  {pwdSaving ? 'Updating…' : 'Update password'}
                </button>
              </div>
            </form>

            {/* Two-Factor Authentication Security Card */}
            <div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm mt-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-[14px] text-brand font-semibold underline underline-offset-4">Two-Factor Authentication (2FA)</p>
                  <p className="mt-2 text-[12px] text-[#666]">Add an extra layer of security to your account using an authenticator app.</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${user?.twoFactorEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                  {user?.twoFactorEnabled ? 'Active / Secured' : 'Disabled'}
                </span>
              </div>

              {twoFAError && <p className="mt-4 text-sm text-red-700">{twoFAError}</p>}
              {twoFASuccess && <p className="mt-4 text-sm text-[#1f5f4a]">{twoFASuccess}</p>}

              {/* Inactive State -> Enable Button */}
              {!user?.twoFactorEnabled && !setupData && (
                <div className="mt-4 flex justify-center">
                  <button
                    type="button"
                    onClick={initiate2FA}
                    disabled={twoFALoading}
                    className="rounded-full bg-[#0f4e34] px-8 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50 cursor-pointer"
                  >
                    {twoFALoading ? 'Setting up…' : 'Enable 2FA'}
                  </button>
                </div>
              )}

              {/* Setup State -> Show QR and Verification */}
              {!user?.twoFactorEnabled && setupData && (
                <div className="mt-6 border-t border-black/10 pt-6 space-y-6">
                  <div className="flex flex-col items-center text-center">
                    <p className="text-sm font-semibold text-gray-700 mb-4">1. Scan this QR Code with your Authenticator App</p>
                    {setupData.qrCodeUrl && (
                      <img src={setupData.qrCodeUrl} alt="2FA QR Code" className="h-44 w-44 object-contain border border-black/5 rounded-xl bg-white p-2" />
                    )}
                    <div className="mt-3 text-xs text-gray-500 max-w-sm">
                      Or manually enter this secret key: <span className="font-mono font-bold text-brand bg-white px-2 py-1 rounded border border-black/5 block mt-1 break-all select-all">{setupData.secret}</span>
                    </div>
                  </div>

                  <div className="max-w-xs mx-auto text-center space-y-4">
                    <p className="text-sm font-semibold text-gray-700">2. Enter the 6-Digit Verification Code</p>
                    <input
                      type="text"
                      placeholder="e.g. 123456"
                      value={setupCode}
                      onChange={(e) => setSetupCode(e.target.value.replace(/[^0-9]/g, ''))}
                      maxLength={6}
                      className="w-full text-center text-lg font-bold tracking-widest rounded-xl border border-black/10 bg-white px-4 py-2.5 focus:border-brand focus:ring-2 focus:ring-brand/20 outline-none text-brand"
                    />
                    <div className="py-2 border-t border-black/5">
                      <p className="text-[11px] text-gray-500 mb-1.5">No authenticator app? Verify via email code instead:</p>
                      <button
                        type="button"
                        onClick={sendSetupEmailCode}
                        disabled={twoFALoading || emailCodeSent}
                        className="text-[12px] font-semibold text-brand underline cursor-pointer hover:text-brand-dark disabled:opacity-50"
                      >
                        {twoFALoading ? 'Sending…' : emailCodeSent ? '✓ Code Sent to Your Email!' : 'Send Code to My Email'}
                      </button>
                    </div>
                    <div className="flex gap-3 justify-center">
                      <button
                        type="button"
                        onClick={confirm2FA}
                        disabled={twoFALoading}
                        className="rounded-full bg-[#0f4e34] px-6 py-2 text-[12px] font-semibold text-white disabled:opacity-50 cursor-pointer"
                      >
                        {twoFALoading ? 'Activating…' : 'Activate 2FA'}
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          setSetupData(null)
                          setSetupCode('')
                        }}
                        className="rounded-full bg-white border border-black/10 px-6 py-2 text-[12px] font-semibold text-gray-700 cursor-pointer"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                </div>
              )}

              {/* Active State -> Disable Form */}
              {user?.twoFactorEnabled && (
                <div className="mt-6 border-t border-black/10 pt-6">
                  {!showDisableConfirm ? (
                    <div className="flex justify-center">
                      <button
                        type="button"
                        onClick={() => setShowDisableConfirm(true)}
                        className="rounded-full bg-red-600 px-8 py-2.5 text-[13px] font-semibold text-white cursor-pointer hover:bg-red-700"
                      >
                        Disable 2FA Security
                      </button>
                    </div>
                  ) : (
                    <div className="max-w-xs mx-auto text-center space-y-4">
                      <p className="text-sm font-semibold text-red-700">Confirm Password to Disable 2FA</p>
                      <input
                        type="password"
                        placeholder="Enter your account password"
                        value={disablePassword}
                        onChange={(e) => setDisablePassword(e.target.value)}
                        className="w-full text-center rounded-xl border border-black/10 bg-white px-4 py-2.5 focus:border-red-500 focus:ring-2 focus:ring-red-500/20 outline-none"
                      />
                      <div className="flex gap-3 justify-center">
                        <button
                          type="button"
                          onClick={disable2FA}
                          disabled={twoFALoading}
                          className="rounded-full bg-red-600 px-6 py-2 text-[12px] font-semibold text-white disabled:opacity-50 cursor-pointer"
                        >
                          {twoFALoading ? 'Disabling…' : 'Confirm Disable'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setShowDisableConfirm(false)
                            setDisablePassword('')
                          }}
                          className="rounded-full bg-white border border-black/10 px-6 py-2 text-[12px] font-semibold text-gray-700 cursor-pointer"
                        >
                          Cancel
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          <TherapistSidebar activeItem="Profile" />
        </div>
      </section>
    </>
  )
}
