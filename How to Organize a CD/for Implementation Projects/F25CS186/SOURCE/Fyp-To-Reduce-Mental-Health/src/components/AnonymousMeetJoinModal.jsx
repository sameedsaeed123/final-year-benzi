import { Video, X, Shield, Copy, Mic, MicOff } from 'lucide-react'
import { useState } from 'react'

export default function AnonymousMeetJoinModal({ open, meetLink, alias, videoProvider = 'jitsi', onClose }) {
  const [copied, setCopied] = useState(false)

  if (!open || !meetLink) return null

  const displayAlias = alias || 'your chosen alias'
  const isJitsi = videoProvider === 'jitsi' || meetLink.includes('meet.jit.si')

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(meetLink)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      /* ignore */
    }
  }

  const handleJoin = () => {
    window.open(meetLink, '_blank', 'noopener,noreferrer')
    onClose()
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/45 px-4">
      <div className="w-full max-w-md rounded-3xl bg-white shadow-xl overflow-hidden">
        <div className="flex items-center justify-between border-b border-black/10 px-6 py-4">
          <div className="flex items-center gap-2 text-[#0f4e34]">
            <Shield size={20} />
            <p className="text-[17px] font-semibold text-[#111]">Join anonymously</p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full border border-black/10 p-2 text-[#2f4c40] hover:bg-[#f4f6f1]"
            aria-label="Close"
          >
            <X size={16} />
          </button>
        </div>
        <div className="px-6 py-5 space-y-4 text-sm text-[#3f4f41]">
          {isJitsi ? (
            <>
              <p>
                This session uses a <strong>private BENZI video room</strong>. Your real name is{' '}
                <strong>not</strong> shown to the therapist — they only see &quot;Anonymous&quot; in the call.
              </p>
              <div className="rounded-xl bg-[#f0f7f3] px-4 py-3 text-[13px] space-y-2">
                <p className="flex items-center gap-2">
                  <Mic size={16} className="text-[#0f4e34] shrink-0" />
                  <span>
                    <strong>Microphone only</strong> — like a classroom where the teacher keeps cameras off for
                    students.
                  </span>
                </p>
                <p className="flex items-center gap-2 text-[#556b5b]">
                  <MicOff size={16} className="shrink-0 opacity-60" />
                  <span>The camera button is hidden; you cannot turn video on from this link.</span>
                </p>
                <p className="text-[#556b5b] pt-1">
                  Your app alias ({displayAlias}) is only for your records — not sent to the therapist in the room.
                </p>
              </div>
            </>
          ) : (
            <>
              <p className="text-amber-900 bg-amber-50 rounded-lg px-3 py-2 text-[13px]">
                This link is Google Meet. Ask your therapist to regenerate the link for full anonymous privacy.
              </p>
              <ol className="list-decimal list-inside space-y-2 text-[13px]">
                <li>Open in <strong>Incognito / Private</strong> browsing.</li>
                <li>Do <strong>not</strong> sign in with Google.</li>
                <li>Enter only: <strong className="text-[#0f4e34]">{displayAlias}</strong></li>
                <li>Turn <strong>camera OFF</strong> before joining.</li>
              </ol>
            </>
          )}
        </div>
        <div className="flex flex-wrap gap-3 border-t border-black/10 px-6 py-4">
          <button
            type="button"
            onClick={handleJoin}
            className="inline-flex flex-1 items-center justify-center gap-2 rounded-full bg-[#0f4e34] px-5 py-2.5 text-sm font-semibold text-white hover:bg-[#164e35]"
          >
            <Video size={16} />
            {isJitsi ? 'Join with mic only' : 'Open Meet'}
          </button>
          <button
            type="button"
            onClick={() => void handleCopy()}
            className="inline-flex items-center justify-center gap-2 rounded-full border border-black/10 px-4 py-2.5 text-sm font-semibold text-[#556b5b] hover:bg-[#f8faf8]"
          >
            <Copy size={14} />
            {copied ? 'Copied' : 'Copy link'}
          </button>
        </div>
      </div>
    </div>
  )
}
