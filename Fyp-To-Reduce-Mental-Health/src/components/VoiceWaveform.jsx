import { useMemo } from 'react'

function hashSeed(str) {
  let h = 0
  for (let i = 0; i < str.length; i += 1) {
    h = (h << 5) - h + str.charCodeAt(i)
    h |= 0
  }
  return Math.abs(h)
}

export function barsFromSeed(seed, count = 28) {
  const bars = []
  let x = seed || 1
  for (let i = 0; i < count; i += 1) {
    x = (x * 9301 + 49297) % 233280
    bars.push(0.25 + (x / 233280) * 0.75)
  }
  return bars
}

export default function VoiceWaveform({
  levels = null,
  barCount = 28,
  progress = 0,
  isMe = false,
  live = false,
  className = '',
}) {
  const staticBars = useMemo(() => barsFromSeed(42, barCount), [barCount])

  const bars = levels?.length ? levels : staticBars
  const clampedProgress = Math.min(1, Math.max(0, progress))

  return (
    <div className={`flex items-center gap-[3px] h-8 flex-1 min-w-0 ${className}`} aria-hidden>
      {bars.slice(0, barCount).map((level, i) => {
        const ratio = typeof level === 'number' ? level : 0.35
        const height = Math.max(4, Math.round(ratio * 28))
        const filled = live ? ratio > 0.08 : i / barCount <= clampedProgress
        const liveOpacity = live ? 0.35 + Math.min(1, ratio * 1.4) * 0.65 : 1
        return (
          <span
            key={i}
            className={`w-[3px] rounded-full flex-shrink-0 transition-all duration-75 ${
              isMe
                ? filled
                  ? 'bg-white'
                  : 'bg-white/35'
                : filled
                  ? 'bg-[#0f4e34]'
                  : 'bg-[#0f4e34]/25'
            }`}
            style={{
              height: `${height}px`,
              opacity: live ? liveOpacity : undefined,
            }}
          />
        )
      })}
    </div>
  )
}
