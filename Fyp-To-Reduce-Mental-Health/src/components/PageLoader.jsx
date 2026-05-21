import { useEffect, useRef, useState } from 'react'

export default function PageLoader() {
  const [visible, setVisible] = useState(false)
  const [animateOut, setAnimateOut] = useState(false)

  // Use a ref to avoid stale closures in the single-run useEffect hook
  const visibleRef = useRef(visible)
  useEffect(() => {
    visibleRef.current = visible
  }, [visible])

  useEffect(() => {
    let activeCount = 0
    let delayTimeout = null
    let graceTimeout = null
    let fadeTimeout = null

    const handleStart = () => {
      activeCount++
      if (activeCount === 1) {
        // Cancel any pending hide sequence
        if (graceTimeout) clearTimeout(graceTimeout)
        if (fadeTimeout) clearTimeout(fadeTimeout)

        if (visibleRef.current) {
          // If already visible, keep it fully visible
          setAnimateOut(false)
        } else {
          // Otherwise, schedule showing it
          if (delayTimeout) clearTimeout(delayTimeout)
          delayTimeout = setTimeout(() => {
            setAnimateOut(false)
            setVisible(true)
          }, 150)
        }
      }
    }

    const handleEnd = () => {
      activeCount = Math.max(0, activeCount - 1)
      if (activeCount === 0) {
        if (delayTimeout) clearTimeout(delayTimeout)

        // Wait a short grace period (350ms) before starting the fade-out.
        // If a new API call starts in this window, we abort the hide process.
        if (graceTimeout) clearTimeout(graceTimeout)
        graceTimeout = setTimeout(() => {
          setAnimateOut(true)
          if (fadeTimeout) clearTimeout(fadeTimeout)
          fadeTimeout = setTimeout(() => {
            setVisible(false)
            setAnimateOut(false)
          }, 400) // matches transition duration
        }, 350)
      }
    }

    window.addEventListener('api-loading-start', handleStart)
    window.addEventListener('api-loading-end', handleEnd)

    return () => {
      window.removeEventListener('api-loading-start', handleStart)
      window.removeEventListener('api-loading-end', handleEnd)
      if (delayTimeout) clearTimeout(delayTimeout)
      if (graceTimeout) clearTimeout(graceTimeout)
      if (fadeTimeout) clearTimeout(fadeTimeout)
    }
  }, [])

  if (!visible) return null

  return (
    <div
      className={`fixed inset-0 z-[9999] flex flex-col items-center justify-center bg-cream/98 backdrop-blur-[6px] transition-opacity duration-400 ease-in-out ${
        animateOut ? 'opacity-0 pointer-events-none' : 'opacity-100'
      }`}
    >
      <div className="flex flex-col items-center gap-6">
        {/* Layered logo wrapper for wipe shimmer effect */}
        <div className="logo-loader-container w-44 h-44">
          <img
            src="/images/Header-Logo.png"
            alt="Loading Silhouette"
            className="logo-bg w-full h-full object-contain"
          />
          <img
            src="/images/Header-Logo.png"
            alt="Loading Active"
            className="logo-fg w-full h-full object-contain"
          />
        </div>
        
        {/* Bouncing three-dot indicator in brand green */}
        <div className="flex gap-1.5 items-center">
          <span className="w-2.5 h-2.5 rounded-full bg-brand animate-bounce [animation-delay:-0.3s]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-brand animate-bounce [animation-delay:-0.15s]"></span>
          <span className="w-2.5 h-2.5 rounded-full bg-brand animate-bounce"></span>
        </div>
      </div>
    </div>
  )
}
