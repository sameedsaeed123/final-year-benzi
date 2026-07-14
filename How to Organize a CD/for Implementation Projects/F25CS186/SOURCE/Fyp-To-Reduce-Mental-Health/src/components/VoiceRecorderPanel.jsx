import { useEffect, useRef, useState, useCallback } from 'react'
import { Trash2, Send } from 'lucide-react'
import VoiceWaveform from './VoiceWaveform.jsx'

function formatDuration(seconds) {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${m}:${String(s).padStart(2, '0')}`
}

function pickAudioMimeType() {
  const candidates = ['audio/webm;codecs=opus', 'audio/webm', 'audio/mp4', 'audio/ogg;codecs=opus']
  return candidates.find((m) => MediaRecorder.isTypeSupported(m)) || 'audio/webm'
}

function extForMime(mime) {
  if (mime.includes('mp4')) return '.m4a'
  if (mime.includes('ogg')) return '.ogg'
  return '.webm'
}

export default function VoiceRecorderPanel({ onComplete, onCancel }) {
  const [seconds, setSeconds] = useState(0)
  const [levels, setLevels] = useState([])
  const [ready, setReady] = useState(false)
  const [error, setError] = useState('')
  const [sending, setSending] = useState(false)

  const streamRef = useRef(null)
  const recorderRef = useRef(null)
  const mimeRef = useRef('audio/webm')
  const chunksRef = useRef([])
  const audioCtxRef = useRef(null)
  const rafRef = useRef(null)
  const timerRef = useRef(null)
  const mountedRef = useRef(true)
  const finishingRef = useRef(false)
  const onCompleteRef = useRef(onComplete)
  const onCancelRef = useRef(onCancel)

  useEffect(() => {
    onCompleteRef.current = onComplete
    onCancelRef.current = onCancel
  }, [onComplete, onCancel])

  const cleanupMedia = useCallback(() => {
    cancelAnimationFrame(rafRef.current)
    rafRef.current = null
    clearInterval(timerRef.current)
    timerRef.current = null
    streamRef.current?.getTracks().forEach((t) => t.stop())
    streamRef.current = null
    audioCtxRef.current?.close().catch(() => {})
    audioCtxRef.current = null
  }, [])

  useEffect(() => {
    mountedRef.current = true
    finishingRef.current = false
    let cancelled = false

    async function start() {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        if (cancelled || !mountedRef.current) {
          stream.getTracks().forEach((t) => t.stop())
          return
        }
        streamRef.current = stream

        const mimeType = pickAudioMimeType()
        mimeRef.current = mimeType
        const recorder = new MediaRecorder(stream, { mimeType })
        chunksRef.current = []

        recorder.ondataavailable = (ev) => {
          if (ev.data?.size > 0) chunksRef.current.push(ev.data)
        }

        recorderRef.current = recorder
        recorder.start()

        const audioCtx = new AudioContext()
        audioCtxRef.current = audioCtx
        await audioCtx.resume()

        const analyser = audioCtx.createAnalyser()
        analyser.fftSize = 64
        analyser.smoothingTimeConstant = 0.75
        audioCtx.createMediaStreamSource(stream).connect(analyser)

        const buffer = new Uint8Array(analyser.frequencyBinCount)
        const tick = () => {
          if (!mountedRef.current) return
          analyser.getByteFrequencyData(buffer)
          const slice = 20
          const step = Math.max(1, Math.floor(buffer.length / slice))
          const next = []
          for (let i = 0; i < slice; i += 1) {
            next.push(buffer[i * step] / 255)
          }
          setLevels(next)
          rafRef.current = requestAnimationFrame(tick)
        }
        rafRef.current = requestAnimationFrame(tick)

        timerRef.current = setInterval(() => {
          setSeconds((s) => s + 1)
        }, 1000)

        setReady(true)
      } catch {
        if (!cancelled && mountedRef.current) {
          setError('Microphone access denied. Allow mic permission and try again.')
        }
      }
    }

    void start()

    return () => {
      cancelled = true
      mountedRef.current = false
      if (!finishingRef.current) {
        cleanupMedia()
        recorderRef.current = null
      }
    }
  }, [cleanupMedia])

  const finish = (send) => {
    if (finishingRef.current || sending) return
    finishingRef.current = true
    setSending(true)
    cancelAnimationFrame(rafRef.current)
    clearInterval(timerRef.current)

    const recorder = recorderRef.current

    const done = (file) => {
      cleanupMedia()
      recorderRef.current = null
      if (!mountedRef.current) return
      if (send && file) onCompleteRef.current?.(file)
      else onCancelRef.current?.()
    }

    if (!recorder || recorder.state === 'inactive') {
      done(null)
      return
    }

    recorder.onstop = () => {
      const blob = new Blob(chunksRef.current, { type: mimeRef.current })
      chunksRef.current = []
      if (send && blob.size > 0) {
        const file = new File([blob], `voice-${Date.now()}${extForMime(mimeRef.current)}`, {
          type: mimeRef.current,
        })
        done(file)
      } else {
        done(null)
      }
    }

    try {
      if (typeof recorder.requestData === 'function') recorder.requestData()
      recorder.stop()
    } catch {
      done(null)
    }
  }

  const canSend = ready && !sending && !error

  return (
    <div className="w-full">
      {error ? (
        <div className="flex items-center justify-between gap-2 rounded-2xl bg-red-50 border border-red-200 px-3 py-2.5">
          <p className="text-[12px] text-red-700 flex-1">{error}</p>
          <button
            type="button"
            onClick={() => onCancelRef.current?.()}
            className="text-[12px] font-medium text-red-700 px-2 py-1 rounded-lg hover:bg-red-100"
          >
            Close
          </button>
        </div>
      ) : (
        <div className="flex items-center gap-2 w-full min-w-0 rounded-2xl bg-[#f0f7f2] border border-[#0f4e34]/15 px-2.5 py-2">
          <button
            type="button"
            onClick={() => finish(false)}
            disabled={sending}
            className="h-10 w-10 rounded-full flex items-center justify-center text-[#c0392b] hover:bg-red-50 flex-shrink-0 disabled:opacity-50"
            aria-label="Cancel recording"
          >
            <Trash2 size={18} />
          </button>

          <div className="flex-1 min-w-0 overflow-hidden flex flex-col justify-center gap-1 px-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-2 w-2 rounded-full bg-red-500 animate-pulse flex-shrink-0" />
              <span className="text-[12px] font-semibold text-[#0f4e34] tabular-nums flex-shrink-0">
                {ready ? formatDuration(seconds) : 'Starting…'}
              </span>
            </div>
            <div className="w-full overflow-hidden">
              <VoiceWaveform
                levels={levels.length ? levels : null}
                barCount={20}
                progress={0}
                isMe={false}
                live
              />
            </div>
          </div>

          <button
            type="button"
            onClick={() => finish(true)}
            disabled={!canSend}
            className="h-11 w-11 rounded-full bg-[#0f4e34] text-white flex items-center justify-center shadow-md hover:bg-[#0d4530] flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
            aria-label="Send voice message"
          >
            <Send size={17} />
          </button>
        </div>
      )}
    </div>
  )
}
