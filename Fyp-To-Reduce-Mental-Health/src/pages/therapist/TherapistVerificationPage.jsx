import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { ShieldCheck, Upload, Loader2, AlertCircle, CheckCircle, FileText } from 'lucide-react'
import { api, apiForm } from '../../lib/api.js'
import { useAuth } from '../../context/AuthContext.jsx'

export default function TherapistVerificationPage() {
  const { logout, checkAuth } = useAuth()
  const navigate = useNavigate()

  const [loadingProfile, setLoadingProfile] = useState(true)
  const [profile, setProfile] = useState(null)
  
  const [form, setForm] = useState({
    specializationTitle: '',
    qualification: '',
    experienceYears: '',
    university: '',
    city: 'Lahore',
    practiceLocation: '',
    bio: ''
  })

  const [files, setFiles] = useState({
    degree: null,
    experienceLetter: null,
    cnic: null
  })

  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState('')
  const [successMsg, setSuccessMsg] = useState('')

  const fetchProfile = async () => {
    try {
      setLoadingProfile(true)
      const res = await api('/therapists/profile/me', { method: 'GET' })
      if (res.success) {
        setProfile(res.data)
        if (res.data.verificationStatus === 'Approved') {
          // If approved, sync status and navigate
          await checkAuth()
          navigate('/therapist-dashboard')
        }
      }
    } catch (err) {
      console.error('Error fetching therapist profile:', err)
    } finally {
      setLoadingProfile(false)
    }
  }

  useEffect(() => {
    fetchProfile()
  }, [])

  const handleTextChange = (k) => (e) => {
    setForm((f) => ({ ...f, [k]: e.target.value }))
  }

  const handleFileChange = (k) => (e) => {
    if (e.target.files && e.target.files[0]) {
      setFiles((f) => ({ ...f, [k]: e.target.files[0] }))
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setErrorMsg('')
    setSuccessMsg('')

    if (!files.degree || !files.experienceLetter || !files.cnic) {
      setErrorMsg('All verification documents (Medical License/Degree, Experience Letter, and CNIC) are required.')
      return
    }

    try {
      setSubmitting(true)
      const formData = new FormData()
      
      // Append text fields
      Object.keys(form).forEach(key => {
        formData.append(key, form[key])
      })

      // Append files
      formData.append('degree', files.degree)
      formData.append('experienceLetter', files.experienceLetter)
      formData.append('cnic', files.cnic)

      const json = await apiForm('/therapist/submit-verification', formData)
      if (json.success) {
        setSuccessMsg(json.message)
        await fetchProfile()
      } else {
        setErrorMsg(json.message || 'Submission failed')
      }
    } catch (err) {
      setErrorMsg(err.message || 'An unexpected error occurred during submission.')
    } finally {
      setSubmitting(false)
    }
  }

  if (loadingProfile) {
    return (
      <div className="min-h-screen bg-cream flex flex-col items-center justify-center">
        <Loader2 className="animate-spin text-brand h-10 w-10 mb-4" />
        <p className="text-sm font-semibold text-brand">Loading profile verification details...</p>
      </div>
    )
  }

  const showPending = profile?.verificationStatus === 'Pending'

  return (
    <>
      <div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
      <section className="bg-cream min-h-screen px-6 py-10 max-w-4xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
        <div className="rounded-[30px] border border-black/5 bg-white p-8 max-[640px]:p-6 shadow-sm">
          
          <div className="flex items-center gap-3 border-b border-black/5 pb-5 mb-8">
            <div className="h-12 w-12 rounded-full bg-brand/10 text-brand flex items-center justify-center">
              <ShieldCheck size={24} />
            </div>
            <div>
              <h1 className="text-[24px] font-extrabold text-[#0f3a2b]">Therapist Profile Verification</h1>
              <p className="text-[13px] text-[#7d8b7d]">Verify your medical credentials to unlock the therapist portal dashboard</p>
            </div>
            <button 
              onClick={() => logout()}
              className="ml-auto rounded-full bg-red-50 hover:bg-red-100 text-red-600 text-[12px] font-semibold px-4 py-2 border border-red-200 transition"
            >
              Logout
            </button>
          </div>

          {showPending ? (
            /* Pending Approval View */
            <div className="text-center py-10 space-y-6 max-w-2xl mx-auto">
              <div className="h-16 w-16 bg-amber-50 border border-amber-200 rounded-full flex items-center justify-center mx-auto text-amber-500 animate-pulse">
                <Loader2 className="animate-spin h-8 w-8" />
              </div>
              <div>
                <h2 className="text-[22px] font-bold text-[#0f3a2b]">Credentials Under Review</h2>
                <p className="mt-3 text-sm text-[#556b5b] leading-relaxed">
                  Thank you for submitting your verification details. Our medical board administrator team is currently reviewing your uploaded **Medical License/Degree**, **Experience Letter**, and **CNIC**.
                </p>
                <p className="mt-2 text-sm text-brand font-semibold">
                  We will verify and approve your therapist dashboard shortly!
                </p>
              </div>

              {/* Progress Tracker */}
              <div className="mt-10 border border-black/5 bg-cream/40 rounded-2xl p-6 grid grid-cols-2 md:grid-cols-4 gap-4 text-left">
                {[
                  { label: 'Register Account', desc: 'Completed', active: true, done: true },
                  { label: 'Upload Files', desc: 'Submitted', active: true, done: true },
                  { label: 'Admin Audit', desc: 'In Progress', active: true, done: false },
                  { label: 'Portal Activation', desc: 'Locked', active: false, done: false }
                ].map((step, idx) => (
                  <div key={idx} className="space-y-1">
                    <div className="flex items-center gap-1.5">
                      <span className={`h-5 w-5 rounded-full flex items-center justify-center text-[10px] font-bold ${step.done ? 'bg-green-500 text-white' : step.active ? 'bg-amber-400 text-white animate-pulse' : 'bg-black/10 text-[#777]'}`}>
                        {step.done ? '✓' : idx + 1}
                      </span>
                      <span className="text-[12px] font-bold text-[#111]">{step.label}</span>
                    </div>
                    <p className={`text-[10px] pl-6.5 font-semibold ${step.done ? 'text-green-600' : step.active ? 'text-amber-600 font-bold' : 'text-[#7d8b7d]'}`}>{step.desc}</p>
                  </div>
                ))}
              </div>

              <div className="pt-6">
                <button
                  onClick={fetchProfile}
                  className="rounded-full bg-brand px-6 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-dark"
                >
                  Refresh Verification Status
                </button>
              </div>
            </div>
          ) : (
            /* Upload Form View */
            <form onSubmit={handleSubmit} className="space-y-6">
              
              {profile?.verificationStatus === 'Rejected' && (
                <div className="flex items-center gap-3 p-4 bg-[#fce8e6] border border-[#c5221f]/20 rounded-2xl text-[13px] text-[#c5221f] font-semibold">
                  <AlertCircle size={20} className="shrink-0" />
                  <div>
                    <p className="font-bold">Verification Request Rejected</p>
                    <p className="text-[12px] text-[#c5221f]/80 mt-0.5">Please double check that your academic entries match your CNIC and upload legit high-resolution copies of your documentation.</p>
                  </div>
                </div>
              )}

              {errorMsg && (
                <div className="p-4 bg-[#fce8e6] border border-[#c5221f]/20 rounded-2xl text-[13px] text-[#c5221f] text-center font-semibold">
                  {errorMsg}
                </div>
              )}

              {successMsg && (
                <div className="p-4 bg-[#e6f4ea] border border-[#137333]/20 rounded-2xl text-[13px] text-[#137333] text-center font-semibold">
                  {successMsg}
                </div>
              )}

              <div className="grid gap-6 md:grid-cols-2">
                <div>
                  <label className="block text-sm font-semibold text-[#1f3a2b] mb-2">Specialization Title*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Clinical Psychologist, Psychiatrist"
                    value={form.specializationTitle}
                    onChange={handleTextChange('specializationTitle')}
                    className="w-full rounded-2xl border border-black/10 bg-[#f8faf8] px-4 py-3 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1f3a2b] mb-2">Medical Qualification*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. MBBS, FCPS, MS Clinical Psychology"
                    value={form.qualification}
                    onChange={handleTextChange('qualification')}
                    className="w-full rounded-2xl border border-black/10 bg-[#f8faf8] px-4 py-3 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1f3a2b] mb-2">University / Medical Institute*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. King Edward Medical University"
                    value={form.university}
                    onChange={handleTextChange('university')}
                    className="w-full rounded-2xl border border-black/10 bg-[#f8faf8] px-4 py-3 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1f3a2b] mb-2">Years of Legit Experience*</label>
                  <input
                    type="number"
                    required
                    min="1"
                    max="50"
                    placeholder="e.g. 5"
                    value={form.experienceYears}
                    onChange={handleTextChange('experienceYears')}
                    className="w-full rounded-2xl border border-black/10 bg-[#f8faf8] px-4 py-3 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1f3a2b] mb-2">City*</label>
                  <select
                    value={form.city}
                    onChange={handleTextChange('city')}
                    className="w-full rounded-2xl border border-black/10 bg-[#f8faf8] px-4 py-3 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  >
                    <option value="Lahore">Lahore</option>
                    <option value="Karachi">Karachi</option>
                    <option value="Islamabad">Islamabad</option>
                    <option value="Rawalpindi">Rawalpindi</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1f3a2b] mb-2">Clinic / Practice Address*</label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. DHA Phase 3, Lahore"
                    value={form.practiceLocation}
                    onChange={handleTextChange('practiceLocation')}
                    className="w-full rounded-2xl border border-black/10 bg-[#f8faf8] px-4 py-3 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-semibold text-[#1f3a2b] mb-2">Professional Biography (Bio)*</label>
                <textarea
                  rows={3}
                  required
                  placeholder="Share a short bio summarizing your specialization and experience..."
                  value={form.bio}
                  onChange={handleTextChange('bio')}
                  className="w-full rounded-2xl border border-black/10 bg-[#f8faf8] px-4 py-3 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>

              {/* Document upload panels */}
              <div className="border-t border-black/5 pt-6 space-y-4">
                <h3 className="text-sm font-bold text-[#0f3a2b]">Upload Legit Supporting Documentation</h3>
                
                <div className="grid gap-4 md:grid-cols-3">
                  {[
                    { key: 'degree', label: 'Degree / Medical License*', desc: 'Upload MBBS or MS Clinical Psychology certificate' },
                    { key: 'experienceLetter', label: 'Legit Experience Letter*', desc: 'Upload hospital / clinic certificate of experience' },
                    { key: 'cnic', label: 'CNIC (Front & Back)*', desc: 'Upload scanned CNIC card for identity verification' }
                  ].map((field) => (
                    <div key={field.key} className="rounded-2xl border border-black/10 bg-[#f8faf8] p-4 flex flex-col items-center justify-between text-center relative hover:bg-cream/20 transition">
                      <div className="space-y-2">
                        <Upload size={20} className="text-brand/75 mx-auto" />
                        <div>
                          <p className="text-[12px] font-bold text-[#111]">{field.label}</p>
                          <p className="text-[10px] text-[#7d8b7d] mt-1">{field.desc}</p>
                        </div>
                      </div>
                      
                      {files[field.key] ? (
                        <div className="mt-3 flex items-center gap-1.5 text-green-600 bg-green-50 border border-green-200 rounded-full px-3 py-1 text-[11px] font-bold">
                          <CheckCircle size={12} />
                          <span className="truncate max-w-[120px]">{files[field.key].name}</span>
                        </div>
                      ) : (
                        <div className="mt-3">
                          <label className="cursor-pointer inline-flex items-center gap-1 bg-white hover:bg-black/5 border border-black/10 px-3 py-1.5 rounded-full text-[10px] font-bold text-[#111] transition">
                            Browse File
                            <input 
                              type="file"
                              accept=".jpg,.jpeg,.png,.pdf"
                              required
                              onChange={handleFileChange(field.key)}
                              className="hidden"
                            />
                          </label>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>

              <div className="pt-4">
                <button
                  type="submit"
                  disabled={submitting}
                  className="w-full flex items-center justify-center gap-2 rounded-full bg-brand hover:bg-[#16583e] py-3 text-sm font-semibold text-white transition disabled:opacity-70 disabled:cursor-wait"
                >
                  {submitting ? (
                    <>
                      <Loader2 className="animate-spin h-4 w-4" />
                      Uploading documents...
                    </>
                  ) : (
                    'Submit Profile For Review'
                  )}
                </button>
              </div>
            </form>
          )}

        </div>
      </section>
    </>
  )
}
