import { useState } from 'react'
import { DEFAULT_AVATAR, resolveAvatarUrl } from '../lib/api.js'

export default function ChatAvatar({ src, alt = '', className = '', fallback = DEFAULT_AVATAR }) {
  const [failed, setFailed] = useState(false)
  const url = failed ? fallback : resolveAvatarUrl(src, fallback)

  return (
    <img
      src={url}
      alt={alt}
      className={className}
      onError={() => setFailed(true)}
    />
  )
}
