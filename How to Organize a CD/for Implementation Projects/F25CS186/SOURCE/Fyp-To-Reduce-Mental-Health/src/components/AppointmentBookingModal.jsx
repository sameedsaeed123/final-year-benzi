import { useEffect, useMemo, useState } from 'react'
import { X, UploadCloud, CreditCard } from 'lucide-react'
import { api, apiForm } from '../lib/api.js'

const defaultDuration = 60
const ACCOUNT_NUMBER = '0300-1234567'

function todayIso() {
  const d = new Date()
  const yyyy = d.getFullYear()
  const mm = String(d.getMonth() + 1).padStart(2, '0')
  const dd = String(d.getDate()).padStart(2, '0')
  return `${yyyy}-${mm}-${dd}`
}

const getInitials = (n) => {
  if (!n) return 'DR'
  const clean = n.replace(/Dr\.\s*/i, '').trim()
  const parts = clean.split(/\s+/)
  if (parts.length >= 2) {
    return (parts[0][0] + parts[1][0]).toUpperCase()
  }
  return clean.substring(0, 2).toUpperCase()
}

export default function AppointmentBookingModal({ open, onClose, doctor, onBooked }) {
  const [date, setDate] = useState(todayIso())
  const [durationMinutes] = useState(defaultDuration)
  const [location, setLocation] = useState('online')
  const [paymentMethod, setPaymentMethod] = useState('onsite')
  const [paymentScreenshot, setPaymentScreenshot] = useState(null)
  const [slots, setSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)
  const [loadingSlots, setLoadingSlots] = useState(false)
  const [booking, setBooking] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState(null)
  
  // Service selection
  const [services, setServices] = useState([])
  const [selectedService, setSelectedService] = useState(null)
  const [loadingServices, setLoadingServices] = useState(false)
  const [therapistDetail, setTherapistDetail] = useState(null)
  const [loadingDetail, setLoadingDetail] = useState(false)

  const canLoad = open && doctor?.id && date
  const payment = therapistDetail?.payment || {}
  const bankName = payment.bankName || therapistDetail?.paymentBankName || doctor?.paymentBankName || ''
  const accountName = payment.accountName || therapistDetail?.paymentAccountName || doctor?.paymentAccountName || ''
  const accountNumber =
    payment.accountNumber || therapistDetail?.paymentAccountNumber || doctor?.paymentAccountNumber || ''
  const DEFAULT_LOCATION_LABELS = { online: 'Video Call', office: 'Office', clinic: 'Clinic' }
  const hasRealImage = doctor?.image && 
    doctor?.image !== '/images/Frame 33921.png' && 
    doctor?.image !== '/images/therapist-profile-image.png'

  useEffect(() => {
    if (!open || !doctor?.id) {
      setTherapistDetail(null)
      return
    }
    let cancelled = false
    setLoadingDetail(true)
    api(`/therapists/detail/${doctor.id}`, { method: 'GET' })
      .then((json) => {
        if (!cancelled && json.data) setTherapistDetail(json.data)
      })
      .catch(() => {
        if (!cancelled) setTherapistDetail(null)
      })
      .finally(() => {
        if (!cancelled) setLoadingDetail(false)
      })
    return () => { cancelled = true }
  }, [open, doctor?.id])

  // Load services when modal opens
  useEffect(() => {
    if (!open || !doctor?.id) return
    let cancelled = false
    const loadServices = async () => {
      setLoadingServices(true)
      try {
        const json = await api(`/therapists/services/${doctor.id}`, { method: 'GET' })
        if (!cancelled) {
          const serviceList = json.data?.services || []
          setServices(serviceList)
          if (serviceList.length > 0) {
            setSelectedService(serviceList[0].id)
          }
        }
      } catch (e) {
        if (!cancelled) {
          setServices([])
          setError('Failed to load services.')
        }
      } finally {
        if (!cancelled) setLoadingServices(false)
      }
    }
    void loadServices()
    return () => { cancelled = true }
  }, [open, doctor?.id])

  useEffect(() => {
    const first = (doctor?.availableLocations && doctor.availableLocations[0]) || 'online'
    setLocation(first)
  }, [doctor?.availableLocations])

  useEffect(() => {
    if (location === 'online') {
      setPaymentMethod('online')
    }
  }, [location])

  useEffect(() => {
    setPaymentScreenshot(null)
    setSuccess(null)
    setError('')
  }, [open, doctor?.id])

  const locationOptions = useMemo(() => {
    const labels = therapistDetail?.availableLocationLabels || doctor?.availableLocationLabels || {}
    const codes =
      (Array.isArray(therapistDetail?.availableLocations) && therapistDetail.availableLocations.length
        ? therapistDetail.availableLocations
        : null) ||
      (Array.isArray(doctor?.availableLocations) && doctor.availableLocations.length
        ? doctor.availableLocations
        : ['online'])
    return codes.map((c) => ({
      value: c,
      label: labels[c] || DEFAULT_LOCATION_LABELS[c] || c,
    }))
  }, [doctor?.availableLocations, doctor?.availableLocationLabels, therapistDetail])

  useEffect(() => {
    if (!canLoad) return
    let cancelled = false
    const load = async () => {
      setLoadingSlots(true)
      setError('')
      try {
        const json = await api(`/appointments/availability/${doctor.id}?date=${date}&durationMinutes=${durationMinutes}`, { method: 'GET' })
        if (!cancelled) {
          setSlots(json.data?.slots || [])
          setSelectedSlot(null)
        }
      } catch (e) {
        if (!cancelled) {
          setSlots([])
          setSelectedSlot(null)
          setError(e.message || 'Failed to load availability.')
        }
      } finally {
        if (!cancelled) setLoadingSlots(false)
      }
    }
    void load()
    return () => {
      cancelled = true
    }
  }, [canLoad, date, doctor?.id, durationMinutes])

  const slotKeySet = useMemo(() => new Set((slots || []).map((s) => `${s.start}-${s.end}`)), [slots])

  const book = async () => {
    if (!doctor?.id) return
    if (!selectedService) {
      setError('Please select a service.')
      return
    }
    if (!selectedSlot) {
      setError('Please select a time slot.')
      return
    }
    if (paymentMethod === 'online' && !paymentScreenshot) {
      setError('Upload your payment screenshot for online payments.')
      return
    }
    setBooking(true)
    setError('')
    try {
      const checkJson = await api(`/appointments/availability/${doctor.id}?date=${date}&durationMinutes=${durationMinutes}`, { method: 'GET' })
      const freshSlots = checkJson.data?.slots || []
      const stillAvailable = freshSlots.some((s) => s.start === selectedSlot.start && s.end === selectedSlot.end)
      if (!stillAvailable) {
        setError('This slot was just booked. Please select another time.')
        setSlots(freshSlots)
        setSelectedSlot(null)
        return
      }

      const isoDate = `${date}T${selectedSlot.start}:00`
      const formData = new FormData()
      formData.append('therapistUserId', doctor.id)
      formData.append('serviceId', selectedService)
      formData.append('date', isoDate)
      formData.append('durationMinutes', String(durationMinutes))
      formData.append('location', location)
      formData.append('paymentMethod', paymentMethod)
      if (paymentMethod === 'online' && paymentScreenshot) {
        formData.append('paymentScreenshot', paymentScreenshot)
      }

      const json = await apiForm('/appointments', formData)
      setSuccess({
        appointmentId: json.data?.id || '',
        paymentMethod,
        accountNumber: paymentMethod === 'online' ? (accountNumber || ACCOUNT_NUMBER) : '',
        bankName: paymentMethod === 'online' ? (bankName || 'Bank Name') : '',
        accountName: paymentMethod === 'online' ? (accountName || 'Account Title') : '',
      })
      if (onBooked) onBooked()
    } catch (e) {
      setError(e.message || 'Booking failed.')
    } finally {
      setBooking(false)
    }
  }

  if (!open) return null

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 px-4">
      <div className="w-full max-w-2xl rounded-3xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <div>
            <p className="text-[18px] font-semibold text-[#111]">Book Appointment</p>
            <p className="text-[12px] text-[#66746b]">Select a time, location, and payment method</p>
          </div>
          <button onClick={onClose} className="rounded-full border border-black/10 p-2 text-[#2f4c40] hover:bg-[#f4f6f1]">
            <X size={16} />
          </button>
        </div>

        {success ? (
          <div className="px-6 py-6">
            <div className="rounded-2xl border border-[#d6e6d9] bg-[#f6fbf7] p-5">
              <p className="text-[18px] font-semibold text-[#111]">Booking confirmed</p>
              <p className="mt-2 text-sm text-[#556b5b]">Your appointment was created successfully.</p>
              {success.paymentMethod === 'online' && (
                <div className="mt-4 rounded-2xl border border-black/10 bg-white p-4">
                  <p className="text-[13px] font-semibold text-[#111] flex items-center gap-2"><CreditCard size={15} /> Payment account details</p>
                  <div className="mt-2 text-[#0f4e34]">
                    <p className="text-[13px]">{success.bankName} - {success.accountName}</p>
                    <p className="text-[18px] font-extrabold tracking-[0.05em]">{success.accountNumber}</p>
                  </div>
                  <p className="mt-2 text-sm text-[#66746b]">Payment proof has been uploaded and will be reviewed by the therapist.</p>
                </div>
              )}
              <div className="mt-5 flex justify-end">
                <button type="button" onClick={onClose} className="rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white">
                  Close
                </button>
              </div>
            </div>
          </div>
        ) : (
          <div className="px-6 py-5">
            <div className="flex gap-4 items-center rounded-2xl border border-black/5 bg-[#f8faf8] p-4">
              {hasRealImage ? (
                <img
                  src={doctor?.image}
                  alt={doctor?.name}
                  className="h-14 w-14 rounded-full object-cover border border-black/5"
                  onError={(e) => {
                    e.target.style.display = 'none'
                    const sib = e.target.nextSibling
                    if (sib) sib.style.display = 'flex'
                  }}
                />
              ) : null}
              {!hasRealImage ? (
                <div className="h-14 w-14 rounded-full shrink-0 bg-gradient-to-br from-brand to-[#2bb39a] text-white flex items-center justify-center font-bold text-[16px] tracking-wider border border-black/5 shadow-sm">
                  {getInitials(doctor?.name)}
                </div>
              ) : (
                <div className="h-14 w-14 rounded-full shrink-0 bg-gradient-to-br from-brand to-[#2bb39a] text-white hidden items-center justify-center font-bold text-[16px] tracking-wider border border-black/5 shadow-sm">
                  {getInitials(doctor?.name)}
                </div>
              )}
              <div>
                <p className="text-[16px] font-semibold text-[#111]">{doctor?.name}</p>
                <p className="text-[12px] text-[#6b7b6a]">{doctor?.specializationTitle || 'Therapist'} · {doctor?.qualification || '—'}</p>
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Service</label>
                {loadingServices ? (
                  <div className="w-full rounded-2xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-[14px] text-[#6b7b6a]">
                    Loading services...
                  </div>
                ) : services.length === 0 ? (
                  <div className="w-full rounded-2xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-[14px] text-[#6b7b6a]">
                    No services available
                  </div>
                ) : (
                  <select
                    value={selectedService || ''}
                    onChange={(e) => setSelectedService(e.target.value)}
                    className="w-full rounded-2xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-[14px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                  >
                    {services.map((service) => (
                      <option key={service.id} value={service.id}>
                        {service.name} - PKR {Math.round(service.pricePerSession / 100)} ({service.durationMinutes} min)
                      </option>
                    ))}
                  </select>
                )}
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Date</label>
                <input
                  type="date"
                  value={date}
                  min={todayIso()}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-[14px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                />
              </div>
            </div>

            <div className="mt-5 grid gap-4 md:grid-cols-2">
              <div>
                <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Location</label>
                <select
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  className="w-full rounded-2xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-[14px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20"
                >
                  {locationOptions.map((o) => (
                    <option key={o.value} value={o.value}>{o.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[12px] font-semibold text-[#1a1a1a] mb-2">Payment method</label>
                <select
                  value={paymentMethod}
                  onChange={(e) => setPaymentMethod(e.target.value)}
                  disabled={location === 'online'}
                  className="w-full rounded-2xl border border-black/10 bg-[#f5f5f5] px-4 py-3 text-[14px] outline-none focus:border-brand focus:ring-2 focus:ring-brand/20 disabled:opacity-50"
                >
                  {location !== 'online' && <option value="onsite">Onsite</option>}
                  <option value="online">Online</option>
                </select>
              </div>
            </div>

            <div className="mt-5 rounded-2xl border border-black/10 bg-[#f8faf8] p-4 text-sm text-[#556b5b]">
              <p className="font-semibold text-[#111]">Selected Service Details</p>
              {selectedService && services.length > 0 ? (
                <div className="mt-2">
                  {(() => {
                    const service = services.find(s => s.id === selectedService)
                    if (!service) return <p>Service not found</p>
                    return (
                      <>
                        <p className="font-semibold text-[#0f4e34]">{service.name}</p>
                        <p className="text-[12px]">{service.description || 'No description'}</p>
                        <div className="mt-2 flex gap-4">
                          <span className="text-[12px]"><strong>Duration:</strong> {service.durationMinutes} minutes</span>
                          <span className="text-[12px]"><strong>Price:</strong> PKR {Math.round(service.pricePerSession / 100)}</span>
                        </div>
                      </>
                    )
                  })()}
                </div>
              ) : (
                <p className="mt-1">Please select a service to see details</p>
              )}
            </div>

            {(therapistDetail?.practiceLocation || doctor?.practiceLocation) && (
              <p className="mt-4 text-[12px] text-[#556b5b]">
                <span className="font-semibold text-[#111]">Practice location: </span>
                {therapistDetail?.practiceLocation || doctor?.practiceLocation}
              </p>
            )}

            {paymentMethod === 'online' && (
              <div className="mt-5 rounded-2xl border border-black/10 bg-[#f7f4ef] p-4">
                <p className="text-[13px] font-semibold text-[#0f3a2b] flex items-center gap-2 mb-2">
                  <CreditCard size={15} /> Bank transfer details
                </p>
                {loadingDetail && (
                  <p className="text-[12px] text-[#7d8b7d]">Loading payment details…</p>
                )}
                {!loadingDetail && !bankName && !accountNumber && (
                  <p className="text-[12px] text-[#7d8b7d]">This therapist has not added bank details yet. Contact them or choose onsite payment.</p>
                )}
                {(bankName || accountName || accountNumber) && (
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <p className="text-[11px] text-[#7d8b7d]">Bank</p>
                    <p className="font-semibold text-[#111]">{bankName || '—'}</p>
                  </div>
                  <div>
                    <p className="text-[11px] text-[#7d8b7d]">Account name</p>
                    <p className="font-semibold text-[#111]">{accountName || '—'}</p>
                  </div>
                  <div className="col-span-2">
                    <p className="text-[11px] text-[#7d8b7d]">Account number / IBAN</p>
                    <p className="text-[18px] font-extrabold tracking-wide text-[#0f4e34]">{accountNumber || ACCOUNT_NUMBER}</p>
                  </div>
                </div>
                )}
                <label className="mt-4 flex cursor-pointer items-center gap-3 rounded-2xl border border-dashed border-black/15 bg-white px-4 py-4 text-sm text-[#556b5b] hover:bg-[#f9faf8]">
                  <UploadCloud size={18} className="text-[#0f4e34]" />
                  <span>{paymentScreenshot ? paymentScreenshot.name : 'Upload payment screenshot'}</span>
                  <input
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => setPaymentScreenshot(e.target.files?.[0] || null)}
                  />
                </label>
              </div>
            )}

            <div className="mt-5">
              <p className="text-[12px] font-semibold text-[#1a1a1a] mb-2">Available Slots</p>
              {loadingSlots ? (
                <p className="text-sm text-[#6b7b6a]">Loading slots…</p>
              ) : slots.length === 0 ? (
                <p className="text-sm text-[#6b7b6a]">No available slots for this date.</p>
              ) : (
                <div className="flex flex-wrap gap-2">
                  {slots.map((slot) => {
                    const key = `${slot.start}-${slot.end}`
                    const active = selectedSlot?.start === slot.start && selectedSlot?.end === slot.end
                    return (
                      <button
                        key={key}
                        type="button"
                        onClick={() => setSelectedSlot(slot)}
                        className={`rounded-full px-4 py-2 text-[13px] font-semibold border ${active ? 'bg-brand text-white border-brand' : 'bg-white text-[#2f4c40] border-black/10 hover:border-brand'}`}
                        disabled={!slotKeySet.has(key)}
                      >
                        {slot.start} - {slot.end}
                      </button>
                    )
                  })}
                </div>
              )}
            </div>

            {error && <p className="mt-4 text-sm text-red-700">{error}</p>}

            <div className="mt-6 flex justify-end gap-3">
              <button
                type="button"
                onClick={onClose}
                className="rounded-full border border-black/10 px-5 py-2 text-sm font-semibold text-[#1f5f4a]"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={book}
                disabled={booking || !selectedSlot}
                className="rounded-full bg-brand px-6 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {booking ? 'Booking…' : 'Confirm Appointment'}
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
