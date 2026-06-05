import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronRight, EyeOff } from 'lucide-react'
import PatientSidebar from '../../components/PatientSidebar'
import { useAuth } from '../../context/AuthContext.jsx'
import { displayFirstName, displayFullName } from '../../lib/userDisplay.js'
import { api, apiForm, resolveMediaUrl } from '../../lib/api.js'

const emptyPwd = { oldPassword: '', newPassword: '', confirmPassword: '' }

export default function PatientProfilePage() {
  const { user, refreshSession } = useAuth()
  const welcomeName = displayFirstName(user)
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [phone, setPhone] = useState('')
  const [email, setEmail] = useState('')
  const [avatar, setAvatar] = useState('')
  const [uploading, setUploading] = useState(false)
  const [saving, setSaving] = useState(false)
  const [msg, setMsg] = useState('')
  const [err, setErr] = useState('')
  const [password, setPassword] = useState(emptyPwd)
  const [pwdMsg, setPwdMsg] = useState('')
  const [pwdErr, setPwdErr] = useState('')
  const [pwdSaving, setPwdSaving] = useState(false)

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
  const [anonymousMode, setAnonymousMode] = useState(false)
  const [anonymousAlias, setAnonymousAlias] = useState('')
  const [togglingAnon, setTogglingAnon] = useState(false)

  useEffect(() => {
    if (!user) return
    setFirstName(user.firstName || '')
    setLastName(user.lastName || '')
    setPhone(user.phone ?? '')
    setEmail(user.email ?? '')
    setAvatar(user.profileImageUrl || '')
    // Load anonymous status
    api('/records/anonymous/status', { method: 'GET' })
      .then((json) => {
        if (json.success && json.data) {
          setAnonymousMode(json.data.anonymousModeEnabled)
          setAnonymousAlias(json.data.anonymousAlias)
        }
      })
      .catch(() => {})
  }, [user])

  const avatarSrc = resolveMediaUrl(avatar) || '/images/therapist-profile-image.png'

  const saveProfile = async (e) => {
    e.preventDefault()
    setSaving(true)
    setErr('')
    setMsg('')
    try {
      await api('/auth/profile', {
        method: 'PATCH',
        body: JSON.stringify({
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          phone: phone.trim(),
        }),
      })
      setMsg('Profile updated.')
      await refreshSession()
    } catch (er) {
      setErr(er.message || 'Update failed.')
    } finally {
      setSaving(false)
    }
  }

  const onPickPhoto = async (e) => {
    const file = e.target.files?.[0]
    e.target.value = ''
    if (!file) return
    setUploading(true)
    setErr('')
    setMsg('')
    try {
      const fd = new FormData()
      fd.append('photo', file)
      const json = await apiForm('/auth/profile-photo', fd)
      if (!json.success || !json.data?.profileImageUrl) throw new Error(json.message || 'Upload failed')
      setAvatar(json.data.profileImageUrl)
      setMsg('Photo uploaded.')
      await refreshSession()
    } catch (er) {
      setErr(er.message || 'Upload failed.')
    } finally {
      setUploading(false)
    }
  }

  const savePassword = async (e) => {
    e.preventDefault()
    setPwdSaving(true)
    setPwdErr('')
    setPwdMsg('')
    try {
      await api('/auth/change-password', {
        method: 'POST',
        body: JSON.stringify({
          oldPassword: password.oldPassword,
          newPassword: password.newPassword,
          confirmPassword: password.confirmPassword,
        }),
      })
      setPwdMsg('Password updated.')
      setPassword(emptyPwd)
    } catch (er) {
      setPwdErr(er.errors?.map((x) => x.message).join(' ') || er.message || 'Failed')
    } finally {
      setPwdSaving(false)
    }
  }

  const toggleAnonymous = async () => {
    setTogglingAnon(true)
    try {
      const json = await api('/records/anonymous/toggle', {
        method: 'POST',
        body: JSON.stringify({ enable: !anonymousMode }),
      })
      if (json.success && json.data) {
        setAnonymousMode(json.data.anonymousModeEnabled)
        setAnonymousAlias(json.data.anonymousAlias)
      }
    } catch (er) {
      setErr(er.message || 'Could not update anonymous mode.')
    } finally {
      setTogglingAnon(false)
    }
  }

  return (
    <>
      <div className="pt-4" />

      <section className="bg-cream px-6 py-12 max-[480px]:px-4 max-[480px]:py-8">
        <div className="w-[90%] mx-auto">
          <div className="flex justify-between items-center gap-6 max-[1024px]:flex-col">
            <div className="flex-1">
              <h1 className="text-[36px] font-extrabold text-[#0f3a2b] max-[640px]:text-[28px]">
                {`Welcome ${welcomeName}!`}
              </h1>
            </div>
            <Link
              to="/patient-profile"
              className="flex items-center gap-3 bg-white border border-black/10 rounded-full px-4 py-3 shadow-sm text-[14px] font-semibold text-[#111] transition-all hover:-translate-y-0.5"
            >
              <Bell size={18} />
              <span>{welcomeName}</span>
              <ChevronRight size={18} />
            </Link>
          </div>

          <div className="mt-8 grid grid-cols-[1.4fr_280px] gap-8 max-[1024px]:grid-cols-1">
            <div className="bg-cream rounded-3xl border border-black/5 shadow-sm p-10 max-[640px]:p-6">
              <div className="flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <p className="text-[18px] font-semibold text-[#111]">Patient Profile</p>
                  <p className="text-brand text-[14px] font-semibold">Personal Information</p>
                </div>

                {err && <p className="text-sm text-red-700">{err}</p>}
                {msg && <p className="text-sm text-[#1f5f4a]">{msg}</p>}

                <div className="mt-6 bg-[#f7f5ef] rounded-3xl border border-black/5 p-5 flex items-center gap-4 max-[640px]:flex-col max-[640px]:items-start">
                  <img src={avatarSrc} alt="Profile" className="w-20 h-20 rounded-full object-cover border-4 border-white shadow-sm" />
                  <div>
                    <h2 className="text-[20px] font-semibold text-[#111]">{displayFullName(user)}</h2>
                    <p className="text-[14px] text-[#555] mt-1">{email || '—'}</p>
                  </div>
                  <label className="ml-auto bg-brand text-white px-4 py-2 rounded-full text-[13px] font-semibold cursor-pointer hover:bg-brand-dark max-[640px]:ml-0">
                    {uploading ? 'Uploading…' : 'Upload photo'}
                    <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" className="hidden" onChange={onPickPhoto} disabled={uploading} />
                  </label>
                </div>
              </div>

              <form onSubmit={saveProfile} className="mt-8 grid grid-cols-2 gap-6 max-[640px]:grid-cols-1">
                <div>
                  <label className="block text-[13.5px] font-semibold text-[#1a1a1a] mb-2">First name*</label>
                  <input
                    type="text"
                    value={firstName}
                    onChange={(e) => setFirstName(e.target.value)}
                    className="w-full rounded-2xl border border-black/10 bg-[#f5f5f5] px-4 py-4 text-[14px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="block text-[13.5px] font-semibold text-[#1a1a1a] mb-2">Last name*</label>
                  <input
                    type="text"
                    value={lastName}
                    onChange={(e) => setLastName(e.target.value)}
                    className="w-full rounded-2xl border border-black/10 bg-[#f5f5f5] px-4 py-4 text-[14px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>

                <div>
                  <label className="block text-[13.5px] font-semibold text-[#1a1a1a] mb-2">Phone</label>
                  <input
                    type="text"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    className="w-full rounded-2xl border border-black/10 bg-[#f5f5f5] px-4 py-4 text-[14px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>

                <div>
                  <label className="block text-[13.5px] font-semibold text-[#1a1a1a] mb-2">Email</label>
                  <input type="email" value={email} readOnly className="w-full rounded-2xl border border-black/10 bg-[#ebebe8] px-4 py-4 text-[14px] text-[#555]" />
                </div>

                <div className="col-span-2 flex justify-center">
                  <button
                    type="submit"
                    disabled={saving}
                    className="mt-2 bg-brand text-white px-10 py-3 rounded-full text-[15px] font-semibold transition-all hover:bg-brand-dark hover:-translate-y-px disabled:opacity-50"
                  >
                    {saving ? 'Saving…' : 'Update'}
                  </button>
                </div>
              </form>

              <form onSubmit={savePassword} className="mt-10 border-t border-black/10 pt-8">
                <p className="text-[16px] font-semibold text-[#111]">Change Password</p>
                {pwdErr && <p className="mt-2 text-sm text-red-700">{pwdErr}</p>}
                {pwdMsg && <p className="mt-2 text-sm text-[#1f5f4a]">{pwdMsg}</p>}
                <div className="mt-5 grid gap-4 max-[640px]:grid-cols-1">
                  <div>
                    <label className="block text-[13.5px] font-semibold text-[#1a1a1a] mb-2">Current password</label>
                    <input
                      type="password"
                      value={password.oldPassword}
                      onChange={(e) => setPassword((p) => ({ ...p, oldPassword: e.target.value }))}
                      className="w-full rounded-2xl border border-black/10 bg-[#f5f5f5] px-4 py-4 text-[14px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[13.5px] font-semibold text-[#1a1a1a] mb-2">New password</label>
                    <input
                      type="password"
                      value={password.newPassword}
                      onChange={(e) => setPassword((p) => ({ ...p, newPassword: e.target.value }))}
                      className="w-full rounded-2xl border border-black/10 bg-[#f5f5f5] px-4 py-4 text-[14px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <div>
                    <label className="block text-[13.5px] font-semibold text-[#1a1a1a] mb-2">Confirm password</label>
                    <input
                      type="password"
                      value={password.confirmPassword}
                      onChange={(e) => setPassword((p) => ({ ...p, confirmPassword: e.target.value }))}
                      className="w-full rounded-2xl border border-black/10 bg-[#f5f5f5] px-4 py-4 text-[14px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                    />
                  </div>
                  <button
                    type="submit"
                    disabled={pwdSaving}
                    className="mt-3 bg-brand text-white px-8 py-3 rounded-full text-[15px] font-semibold transition-all hover:bg-brand-dark disabled:opacity-50 w-full max-w-xs"
                  >
                    {pwdSaving ? 'Updating…' : 'Change Password'}
                  </button>
                </div>
              </form>

              {/* ── Anonymous Mode Section ── */}
              <div className="mt-10 border-t border-black/10 pt-8">
                <div className="flex items-start gap-3 mb-4">
                  <span className={`mt-0.5 h-9 w-9 rounded-full flex items-center justify-center shrink-0 ${anonymousMode ? 'bg-[#0f4e34] text-white' : 'bg-[#e8f3ea] text-[#1f5f4a]'}`}>
                    <EyeOff size={16} />
                  </span>
                  <div>
                    <p className="text-[16px] font-semibold text-[#111]">Anonymous Mode</p>
                    <p className="text-[13px] text-[#556b5b] mt-1 leading-relaxed">
                      When enabled, your therapist will see you as <strong>{anonymousAlias || 'Anonymous Patient'}</strong> instead of your real name.
                      Your contact details (email, phone) will also be hidden. Your reports remain visible but any name references are automatically removed.
                    </p>
                  </div>
                </div>

                <div className={`rounded-2xl border px-5 py-4 flex flex-wrap items-center justify-between gap-4 ${anonymousMode ? 'border-[#0f4e34]/20 bg-[#f0f7f3]' : 'border-black/5 bg-[#f8faf8]'}`}>
                  <div>
                    <p className="text-[14px] font-semibold text-[#111]">
                      Status: {anonymousMode
                        ? <span className="text-[#0f4e34]">Anonymous — Active</span>
                        : <span className="text-[#556b5b]">Off — Therapist sees your real name</span>}
                    </p>
                    {anonymousMode && (
                      <p className="text-[12px] text-[#556b5b] mt-1">Your alias: <strong className="text-[#0f4e34]">{anonymousAlias}</strong></p>
                    )}
                  </div>
                  <button
                    type="button"
                    onClick={toggleAnonymous}
                    disabled={togglingAnon}
                    className={`rounded-full px-6 py-2.5 text-[13px] font-semibold transition disabled:opacity-50 ${
                      anonymousMode
                        ? 'bg-[#f6f1ec] text-[#7a5b4b] hover:bg-[#ede8e3]'
                        : 'bg-[#0f4e34] text-white hover:bg-[#164e35]'
                    }`}
                  >
                    {togglingAnon ? 'Updating…' : anonymousMode ? 'Disable Anonymous Mode' : 'Enable Anonymous Mode'}
                  </button>
                </div>

                <p className="mt-3 text-[11px] text-[#7d8b7d]">
                  ⚠️ Enabling anonymous mode affects how your therapist sees you across the entire platform — appointments, reports, and client lists.
                  You can toggle this at any time.
                </p>
              </div>

              {/* Two-Factor Authentication Security Card */}
              <div className="rounded-3xl border border-black/5 bg-[#fcfbfa] p-6 shadow-sm mt-8">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[16px] font-semibold text-[#111]">Two-Factor Authentication (2FA)</p>
                    <p className="mt-1 text-[13px] text-[#556b5b] leading-relaxed">
                      Add an extra layer of security to your account using an authenticator app.
                    </p>
                  </div>
                  <span className={`px-3 py-1 rounded-full text-xs font-bold ${user?.twoFactorEnabled ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                    {user?.twoFactorEnabled ? 'Active / Secured' : 'Disabled'}
                  </span>
                </div>

                {twoFAError && <p className="mt-4 text-sm text-red-700">{twoFAError}</p>}
                {twoFASuccess && <p className="mt-4 text-sm text-[#1f5f4a]">{twoFASuccess}</p>}

                {/* Inactive State -> Enable Button */}
                {!user?.twoFactorEnabled && !setupData && (
                  <div className="mt-6 flex justify-center">
                    <button
                      type="button"
                      onClick={initiate2FA}
                      disabled={twoFALoading}
                      className="rounded-full bg-brand text-white px-8 py-3 text-[14px] font-semibold transition hover:bg-brand-dark cursor-pointer disabled:opacity-50"
                    >
                      {twoFALoading ? 'Setting up…' : 'Enable Two-Factor Authentication'}
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
                          className="rounded-full bg-brand text-white px-6 py-2.5 text-[13px] font-semibold hover:bg-brand-dark cursor-pointer disabled:opacity-50"
                        >
                          {twoFALoading ? 'Activating…' : 'Activate 2FA'}
                        </button>
                        <button
                          type="button"
                          onClick={() => {
                            setSetupData(null)
                            setSetupCode('')
                          }}
                          className="rounded-full bg-white border border-black/10 px-6 py-2.5 text-[13px] font-semibold text-gray-700 cursor-pointer"
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
                          className="rounded-full bg-red-600 px-8 py-3 text-[14px] font-semibold text-white cursor-pointer hover:bg-red-700 transition"
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
                            className="rounded-full bg-red-600 px-6 py-2.5 text-[13px] font-semibold text-white disabled:opacity-50 cursor-pointer"
                          >
                            {twoFALoading ? 'Disabling…' : 'Confirm Disable'}
                          </button>
                          <button
                            type="button"
                            onClick={() => {
                              setShowDisableConfirm(false)
                              setDisablePassword('')
                            }}
                            className="rounded-full bg-white border border-black/10 px-6 py-2.5 text-[13px] font-semibold text-gray-700 cursor-pointer"
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

            <PatientSidebar activeItem="Profile" />
          </div>
        </div>
      </section>
    </>
  )
}
