import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Bell, ChevronRight, MessageCircle, PhoneCall, Mail } from 'lucide-react'
import TherapistSidebar from '../../components/TherapistSidebar'
import { useAuth } from '../../context/AuthContext.jsx'
import { displayFirstName } from '../../lib/userDisplay.js'
import { api } from '../../lib/api.js'

const contactCards = [
  {
    label: 'Building No 81, G2 Johar Town Lahore',
    icon: MessageCircle,
  },
  {
    label: 'benzi@gmail.com',
    icon: Mail,
  },
  {
    label: '+92 123456789',
    icon: PhoneCall,
  },
]

export default function TherapistHelpSupportPage() {
  const { user } = useAuth()
  const welcomeName = displayFirstName(user)

  const [form, setForm] = useState({
    firstName: user?.firstName || '',
    lastName: user?.lastName || '',
    email: user?.email || '',
    phone: user?.phone || '',
    message: '',
    priority: 'Low'
  })
  const [submitting, setSubmitting] = useState(false)
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })

  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatusMsg({ type: '', text: '' })

    if (!form.firstName || !form.lastName || !form.email || !form.message) {
      setStatusMsg({ type: 'error', text: 'Please fill in all required fields.' })
      return
    }

    try {
      setSubmitting(true)
      const res = await api('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          name: `${form.firstName} ${form.lastName}`.trim(),
          email: form.email.trim(),
          phone: form.phone.trim(),
          subject: 'Therapist Portal Inquiry',
          message: form.message.trim(),
          priority: form.priority
        })
      })

      if (res.success) {
        setStatusMsg({ type: 'success', text: `Support ticket created successfully! Ticket ID: ${res.data.ticketId}` })
        setForm(f => ({ ...f, message: '' }))
      } else {
        setStatusMsg({ type: 'error', text: res.message || 'Failed to submit support ticket.' })
      }
    } catch (err) {
      let errMsg = err.message || 'An unexpected error occurred.'
      if (err.errors && Array.isArray(err.errors) && err.errors.length > 0) {
        const details = err.errors.map(e => {
          let fieldName = e.field
          if (fieldName === 'message') fieldName = 'Message'
          else if (fieldName === 'subject') fieldName = 'Subject'
          else if (fieldName === 'name') fieldName = 'Name'
          else if (fieldName === 'email') fieldName = 'Email'
          
          return e.message.replace(/"[^"]+"/g, fieldName)
        }).join(', ')
        errMsg = `Validation failed: ${details}`
      }
      setStatusMsg({ type: 'error', text: errMsg })
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <>
      <div className="pt-36 max-[768px]:pt-32 max-[480px]:pt-28" />
      <section className="bg-cream min-h-screen px-6 py-10 max-w-7xl mx-auto max-[1024px]:px-4 max-[480px]:px-3">
        <div className="flex flex-wrap items-center justify-between gap-4 mb-8">
          <div>
            <p className="text-sm uppercase tracking-[0.25em] text-brand/70">Help & Support</p>
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
            <div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[22px] font-semibold text-[#111]">Therapist Help & Support</p>
                  <p className="mt-3 text-sm text-[#556b5b]">Fill the form to open a direct support ticket with our admin team</p>
                </div>
              </div>

              <form onSubmit={handleSubmit} className="mt-8 grid gap-6 lg:grid-cols-2">
                {statusMsg.text && (
                  <div className={`lg:col-span-2 p-4 rounded-xl text-[14px] font-semibold text-center ${statusMsg.type === 'success' ? 'bg-[#e6f4ea] text-[#137333] border border-[#137333]/20' : 'bg-[#fce8e6] text-[#c5221f] border border-[#c5221f]/20'}`}>
                    {statusMsg.text}
                  </div>
                )}

                <div>
                  <label className="block text-sm font-semibold text-[#1f3a2b] mb-2">First Name*</label>
                  <input
                    type="text"
                    placeholder="enter your first name"
                    value={form.firstName}
                    onChange={update('firstName')}
                    required
                    className="w-full rounded-2xl border border-black/10 bg-[#f8faf8] px-4 py-3 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1f3a2b] mb-2">Last Name*</label>
                  <input
                    type="text"
                    placeholder="enter your last name"
                    value={form.lastName}
                    onChange={update('lastName')}
                    required
                    className="w-full rounded-2xl border border-black/10 bg-[#f8faf8] px-4 py-3 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1f3a2b] mb-2">Email*</label>
                  <input
                    type="email"
                    placeholder="enter your email"
                    value={form.email}
                    onChange={update('email')}
                    required
                    className="w-full rounded-2xl border border-black/10 bg-[#f8faf8] px-4 py-3 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="block text-sm font-semibold text-[#1f3a2b] mb-2">Phone No</label>
                  <input
                    type="text"
                    placeholder="enter your phone number"
                    value={form.phone}
                    onChange={update('phone')}
                    className="w-full rounded-2xl border border-black/10 bg-[#f8faf8] px-4 py-3 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-[#1f3a2b] mb-2">Issue / Topic*</label>
                  <select
                    value={form.priority}
                    onChange={update('priority')}
                    className="w-full rounded-2xl border border-black/10 bg-[#f8faf8] px-4 py-3 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  >
                    <option value="Low">Low / General Inquiry</option>
                    <option value="High">High / Urgent Assistance</option>
                    <option value="Billing">Billing & Invoice</option>
                    <option value="Subscription">Subscription Issue</option>
                    <option value="Technical">Technical Bug / Issue</option>
                  </select>
                </div>
                <div className="lg:col-span-2">
                  <label className="block text-sm font-semibold text-[#1f3a2b] mb-2">Message*</label>
                  <textarea
                    rows={5}
                    placeholder="Write your query here..."
                    value={form.message}
                    onChange={update('message')}
                    required
                    className="w-full rounded-[26px] border border-black/10 bg-[#f8faf8] px-4 py-4 text-sm text-[#2e3f34] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                
                <div className="lg:col-span-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="rounded-full bg-brand px-8 py-3 text-sm font-semibold text-white transition hover:bg-[#16583e] disabled:opacity-75 disabled:cursor-wait"
                  >
                    {submitting ? 'Submitting...' : 'Submit Support Request'}
                  </button>
                </div>
              </form>
            </div>

            <div className="rounded-[30px] border border-black/5 bg-cream p-6 shadow-sm">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-[24px] font-semibold text-[#111]">Get In Touch</p>
                  <p className="mt-4 text-sm leading-7 text-[#556b5b]">
                    Need direct assistance? You can also reach out to our customer relations team via email, phone, or by visiting our local care center.
                  </p>
                </div>
              </div>

              <div className="mt-8 space-y-4">
                {contactCards.map((card) => {
                  const Icon = card.icon
                  return (
                    <div key={card.label} className="flex items-center gap-4 rounded-3xl border border-black/10 bg-[#f7f8f4] p-4">
                      <div className="h-11 w-11 rounded-3xl bg-[#e6f3e8] text-[#1f5f4a] grid place-items-center">
                        <Icon size={20} />
                      </div>
                      <p className="text-sm text-[#2e3f34]">{card.label}</p>
                    </div>
                  )
                })}
              </div>
            </div>
          </div>

          <TherapistSidebar activeItem="Help & Support" />
        </div>
      </section>
    </>
  )
}
