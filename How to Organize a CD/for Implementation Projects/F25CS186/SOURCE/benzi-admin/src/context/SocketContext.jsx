import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import { getStoredToken, getApiBase } from '../lib/api.js'
import { useAuth } from './AuthContext.jsx'

const SocketContext = createContext(null)

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)

  // Connect when user is logged in
  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setConnected(false)
      }
      return
    }

    const token = getStoredToken()
    if (!token) return

    const base = getApiBase() || window.location.origin
    const socket = io(base, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 5,
      reconnectionDelay: 1000,
    })

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socketRef.current = socket

    return () => {
      socket.disconnect()
      socketRef.current = null
      setConnected(false)
    }
  }, [user?.id])

  const getSocket = useCallback(() => socketRef.current, [])

  const incrementUnread = useCallback(() => setUnreadCount((n) => n + 1), [])
  const resetUnread = useCallback(() => setUnreadCount(0), [])
  const setUnread = useCallback((n) => setUnreadCount(n), [])

  return (
    <SocketContext.Provider value={{ getSocket, connected, unreadCount, incrementUnread, resetUnread, setUnread }}>
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
