import { useEffect, useMemo, useRef, useState } from 'react'
import { Pause, Play } from 'lucide-react'
import VoiceWaveform, { barsFromSeed } from './VoiceWaveform.jsx'

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds < 0) return '0:00'
  const m = Math.floor(seconds / 60)
  const s = Math.floor(seconds % 60)
  return `${m}:${String(s).padStart(2, '0')}`
}

export default function VoiceMessagePlayer({ src, isMe = false, seed = '' }) {
  const audioRef = useRef(null)
  const [playing, setPlaying] = useState(false)
  const [duration, setDuration] = useState(0)
  const [current, setCurrent] = useState(0)

  const bars = useMemo(() => barsFromSeed(hashSeed(seed || src), 32), [seed, src])

  useEffect(() => {
    setPlaying(false)
    setCurrent(0)
    setDuration(0)
  }, [src])

  useEffect(() => {
    const audio = audioRef.current
    if (!audio) return undefined

    const onLoaded = () => {
      if (Number.isFinite(audio.duration) && audio.duration !== Infinity) {
        setDuration(audio.duration)
      }
    }
    const onTime = () => setCurrent(audio.currentTime || 0)
    const onEnded = () => {
      setPlaying(false)
      setCurrent(0)
    }
    const onPlay = () => setPlaying(true)
    const onPause = () => setPlaying(false)

    audio.addEventListener('loadedmetadata', onLoaded)
    audio.addEventListener('durationchange', onLoaded)
    audio.addEventListener('timeupdate', onTime)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('play', onPlay)
    audio.addEventListener('pause', onPause)

    return () => {
      audio.removeEventListener('loadedmetadata', onLoaded)
      audio.removeEventListener('durationchange', onLoaded)
      audio.removeEventListener('timeupdate', onTime)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('pause', onPause)
    }
  }, [src])

  const toggle = () => {
    const audio = audioRef.current
    if (!audio || !src) return
    if (playing) {
      audio.pause()
    } else {
      void audio.play().catch(() => {})
    }
  }

  const progress = duration > 0 ? current / duration : 0
  const displayTime = playing || current > 0 ? current : duration

  return (
    <div className="flex items-center gap-3 min-w-[220px] max-w-[280px] py-1">
      <audio ref={audioRef} src={src} preload="metadata" className="hidden" />
      <button
        type="button"
        onClick={toggle}
        disabled={!src}
        className={`h-10 w-10 rounded-full flex items-center justify-center flex-shrink-0 transition ${
          isMe
            ? 'bg-white/20 hover:bg-white/30 text-white'
            : 'bg-[#0f4e34] hover:bg-[#0d4530] text-white'
        }`}
        aria-label={playing ? 'Pause voice message' : 'Play voice message'}
      >
        {playing ? <Pause size={16} fill="currentColor" /> : <Play size={16} className="ml-0.5" fill="currentColor" />}
      </button>
      <div className="flex-1 min-w-0 flex flex-col gap-1">
        <VoiceWaveform
          levels={bars}
          barCount={32}
          progress={progress}
          isMe={isMe}
        />
        <span className={`text-[11px] tabular-nums ${isMe ? 'text-white/75' : 'text-[#7d8b7d]'}`}>
          {formatDuration(displayTime)}
        </span>
      </div>
    </div>
  )
}

function hashSeed(str) {
  let h = 0
  for (let i = 0; i < str.length; i += 1) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}
