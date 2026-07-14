import { useState } from 'react'
import { MapPin, Mail, Phone } from 'lucide-react'
import { api } from '../lib/api.js'

export default function ContactUsPage() {
  const [form, setForm] = useState({ name: '', number: '', email: '', subject: 'General Query', message: '', priority: 'Low' })
  const [submitting, setSubmitting] = useState(false)
  const [statusMsg, setStatusMsg] = useState({ type: '', text: '' })
  const update = (k) => (e) => setForm((f) => ({ ...f, [k]: e.target.value }))

  const handleSubmit = async (e) => {
    e.preventDefault()
    setStatusMsg({ type: '', text: '' })

    if (!form.name || !form.email || !form.message) {
      setStatusMsg({ type: 'error', text: 'Please fill in all required fields (Name, Email, Message).' })
      return
    }

    try {
      setSubmitting(true)
      const res = await api('/tickets', {
        method: 'POST',
        body: JSON.stringify({
          name: form.name.trim(),
          email: form.email.trim(),
          phone: form.number.trim(),
          subject: form.subject.trim(),
          message: form.message.trim(),
          priority: form.priority
        })
      })

      if (res.success) {
        setStatusMsg({ type: 'success', text: `Your support ticket has been created! Ticket ID: ${res.data.ticketId}` })
        setForm({ name: '', number: '', email: '', subject: 'General Query', message: '', priority: 'Low' })
      } else {
        setStatusMsg({ type: 'error', text: res.message || 'Failed to submit ticket.' })
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
      {/* Spacer for absolute navbar */}
      <div className="pt-28 max-[768px]:pt-24 max-[480px]:pt-20" />

      <section className="bg-cream px-6 py-16 max-[768px]:py-12 max-[480px]:py-10 max-[480px]:px-4">
        <div className="max-w-7xl mx-auto grid grid-cols-2 gap-16 items-start max-[900px]:grid-cols-1 max-[900px]:gap-12">

          {/* Left — Get In Touch */}
          <div>
            <h1 className="text-[44px] font-extrabold leading-[1.15] text-[#111] mb-5 max-[1024px]:text-[36px] max-[480px]:text-[28px]">
              Get In Touch
            </h1>
            <p className="text-[#555] text-[14px] leading-[1.8] mb-10 max-w-lg">
              We'd love to hear from you. Whether you have a question about our
              services, need support, or want to share your feedback, our team is
              here to help. Reach out using the details below or fill out the
              contact form and we'll get back to you as soon as possible.
            </p>

            <ul className="flex flex-col gap-5">
              <li className="flex items-center gap-4 bg-white border border-brand/20 rounded-lg px-5 py-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <span className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                  <MapPin size={18} strokeWidth={2} className="text-brand" />
                </span>
                <span className="text-[14.5px] font-semibold text-[#222]">
                  Building No 81, G2 Johaar Town Lahore
                </span>
              </li>
              <li className="flex items-center gap-4 bg-white border border-brand/20 rounded-lg px-5 py-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <span className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                  <Mail size={18} strokeWidth={2} className="text-brand" />
                </span>
                <span className="text-[14.5px] font-semibold text-[#222]">
                  benzi@gmail.com
                </span>
              </li>
              <li className="flex items-center gap-4 bg-white border border-brand/20 rounded-lg px-5 py-4 shadow-sm transition-all duration-300 hover:-translate-y-1 hover:shadow-md">
                <span className="w-9 h-9 rounded-full bg-brand/10 flex items-center justify-center shrink-0">
                  <Phone size={18} strokeWidth={2} className="text-brand" />
                </span>
                <span className="text-[14.5px] font-semibold text-[#222]">
                  +92 123456789
                </span>
              </li>
            </ul>
          </div>

          {/* Right — Form */}
          <div>
            <span className="block text-[14px] font-semibold text-brand mb-2">
              Contact Form
            </span>
            <h2 className="text-[40px] font-extrabold leading-[1.15] text-[#111] mb-8 max-[1024px]:text-[32px] max-[480px]:text-[26px]">
              Fill Out the Form
            </h2>

            <form onSubmit={handleSubmit} className="flex flex-col gap-6">
              {statusMsg.text && (
                <div className={`p-4 rounded-xl text-[14px] font-semibold text-center ${statusMsg.type === 'success' ? 'bg-[#e6f4ea] text-[#137333] border border-[#137333]/20' : 'bg-[#fce8e6] text-[#c5221f] border border-[#c5221f]/20'}`}>
                  {statusMsg.text}
                </div>
              )}

              <div>
                <label className="block text-[14px] text-[#333] mb-2">Name*</label>
                <input
                  type="text"
                  placeholder="First Name"
                  value={form.name}
                  onChange={update('name')}
                  required
                  className="w-full border border-brand/30 rounded-lg px-4 py-3 text-[14px] bg-white text-[#222] placeholder:text-[#999] outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div className="grid grid-cols-2 gap-5 max-[600px]:grid-cols-1">
                <div>
                  <label className="block text-[14px] text-[#333] mb-2">Number</label>
                  <input
                    type="tel"
                    placeholder="+92 123456789"
                    value={form.number}
                    onChange={update('number')}
                    className="w-full border border-brand/30 rounded-lg px-4 py-3 text-[14px] bg-white text-[#222] placeholder:text-[#999] outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="block text-[14px] text-[#333] mb-2">Email*</label>
                  <input
                    type="email"
                    placeholder="email@example.com"
                    value={form.email}
                    onChange={update('email')}
                    required
                    className="w-full border border-brand/30 rounded-lg px-4 py-3 text-[14px] bg-white text-[#222] placeholder:text-[#999] outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-5 max-[600px]:grid-cols-1">
                <div>
                  <label className="block text-[14px] text-[#333] mb-2">Subject / Department*</label>
                  <input
                    type="text"
                    placeholder="General Query"
                    value={form.subject}
                    onChange={update('subject')}
                    required
                    className="w-full border border-brand/30 rounded-lg px-4 py-3 text-[14px] bg-white text-[#222] placeholder:text-[#999] outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                  />
                </div>
                <div>
                  <label className="block text-[14px] text-[#333] mb-2">Priority / Topic*</label>
                  <select
                    value={form.priority}
                    onChange={update('priority')}
                    className="w-full border border-brand/30 rounded-lg px-4 py-3 text-[14px] bg-white text-[#222] outline-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                  >
                    <option value="Low">Low / General Inquiry</option>
                    <option value="High">High / Urgent Assistance</option>
                    <option value="Billing">Billing & Invoice</option>
                    <option value="Subscription">Subscription Issue</option>
                    <option value="Technical">Technical Bug / Issue</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-[14px] text-[#333] mb-2">Message*</label>
                <textarea
                  rows={6}
                  value={form.message}
                  onChange={update('message')}
                  required
                  placeholder="Explain your issue or question in detail (minimum 10 characters)..."
                  className="w-full border border-brand/30 rounded-lg px-4 py-3 text-[14px] bg-white text-[#222] outline-none resize-none transition-all focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>

              <div>
                <button
                  type="submit"
                  disabled={submitting}
                  className="bg-brand text-white px-8 py-3 rounded-md text-[14px] font-semibold cursor-pointer transition-all duration-300 hover:bg-brand-dark hover:-translate-y-1 hover:shadow-lg active:scale-95 disabled:opacity-75 disabled:cursor-wait"
                >
                  {submitting ? 'Submitting...' : 'Submit Support Ticket'}
                </button>
              </div>
            </form>
          </div>

        </div>
      </section>
    </>
  )
}
