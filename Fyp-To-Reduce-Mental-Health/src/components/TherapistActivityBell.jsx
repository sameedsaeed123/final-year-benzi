import { useState, useRef, useEffect } from 'react'
import { Bell } from 'lucide-react'
import { useSocket } from '../context/SocketContext.jsx'

const typeLabels = {
  goal_submitted: 'Goal submitted',
  goal_assigned: 'Goal assigned',
  goal_approved: 'Goal approved',
  goal_rejected: 'Goal declined',
  goal_completed: 'Goal completed',
  goal_updated: 'Goal updated',
  ai_chat: 'BENZI AI',
  crisis_alert: 'Crisis alert',
  chat_message: 'Message',
  record_uploaded: 'New report',
  record_reviewed: 'Report reviewed',
  stats_updated: 'Stats refreshed',
}

export default function TherapistActivityBell({ className = '' }) {
  const { activities, activityUnread, clearActivityUnread } = useSocket() || {}
  const [open, setOpen] = useState(false)
  const ref = useRef(null)

  useEffect(() => {
    const onDoc = (e) => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const total = activityUnread || 0

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => !o)
          if (!open) clearActivityUnread?.()
        }}
        className="relative rounded-full p-2 bg-white/10 hover:bg-white/20 transition"
        aria-label="Notifications"
      >
        <Bell size={18} />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-[#b42318] text-[9px] font-bold flex items-center justify-center px-1">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-[min(320px,90vw)] max-h-80 overflow-y-auto rounded-2xl border border-black/10 bg-white shadow-xl z-50 text-[#23382d]">
          <p className="px-4 py-3 text-xs font-bold uppercase tracking-wider text-[#7d8b7d] border-b border-black/5">
            Recent activity
          </p>
          {!activities?.length && (
            <p className="px-4 py-6 text-sm text-[#7d8b7d]">No notifications yet.</p>
          )}
          <ul className="divide-y divide-black/5">
            {(activities || []).map((a, i) => (
              <li key={`${a.at}-${i}`} className="px-4 py-3">
                <p className="text-[11px] font-semibold text-brand">
                  {typeLabels[a.type] || a.title || 'Update'}
                </p>
                <p className="text-sm text-[#3f4f41] mt-0.5">{a.message || a.title}</p>
                <p className="text-[10px] text-[#9aa89a] mt-1">
                  {a.at ? new Date(a.at).toLocaleString() : ''}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  )
}
