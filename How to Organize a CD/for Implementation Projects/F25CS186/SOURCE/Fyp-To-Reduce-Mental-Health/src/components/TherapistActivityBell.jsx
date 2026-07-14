import { useState, useRef, useEffect, useLayoutEffect } from 'react'
import { createPortal } from 'react-dom'
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

const PANEL_WIDTH = 280

function clampPanelLeft(rect) {
  const margin = 12
  const width = Math.min(PANEL_WIDTH, window.innerWidth - margin * 2)
  let left = rect.right - width
  left = Math.max(margin, Math.min(left, window.innerWidth - width - margin))
  return { left, width, top: rect.bottom + 8 }
}

export default function TherapistActivityBell({ className = '' }) {
  const { activities, activityUnread, clearActivityUnread } = useSocket() || {}
  const [open, setOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState(null)
  const ref = useRef(null)

  const updatePanelPosition = () => {
    if (!ref.current) return
    setPanelStyle(clampPanelLeft(ref.current.getBoundingClientRect()))
  }

  useLayoutEffect(() => {
    if (!open) return
    updatePanelPosition()
    window.addEventListener('resize', updatePanelPosition)
    window.addEventListener('scroll', updatePanelPosition, true)
    return () => {
      window.removeEventListener('resize', updatePanelPosition)
      window.removeEventListener('scroll', updatePanelPosition, true)
    }
  }, [open])

  useEffect(() => {
    const onDoc = (e) => {
      const panel = document.getElementById('therapist-activity-panel')
      if (
        ref.current &&
        !ref.current.contains(e.target) &&
        panel &&
        !panel.contains(e.target)
      ) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', onDoc)
    return () => document.removeEventListener('mousedown', onDoc)
  }, [])

  const total = activityUnread || 0

  const panel =
    open && panelStyle
      ? createPortal(
          <div
            id="therapist-activity-panel"
            role="dialog"
            aria-label="Recent activity"
            className="fixed z-[200] max-h-80 overflow-y-auto rounded-2xl border border-black/10 bg-white shadow-xl text-[#23382d]"
            style={{
              top: panelStyle.top,
              left: panelStyle.left,
              width: panelStyle.width,
            }}
          >
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
          </div>,
          document.body
        )
      : null

  return (
    <div className={`relative ${className}`} ref={ref}>
      <button
        type="button"
        onClick={() => {
          setOpen((o) => {
            const next = !o
            if (next) {
              clearActivityUnread?.()
              requestAnimationFrame(updatePanelPosition)
            }
            return next
          })
        }}
        className="relative rounded-full p-2 bg-white/10 hover:bg-white/20 transition"
        aria-label="Notifications"
        aria-expanded={open}
      >
        <Bell size={18} />
        {total > 0 && (
          <span className="absolute -top-0.5 -right-0.5 h-4 min-w-4 rounded-full bg-[#b42318] text-[9px] font-bold flex items-center justify-center px-1">
            {total > 9 ? '9+' : total}
          </span>
        )}
      </button>
      {panel}
    </div>
  )
}
