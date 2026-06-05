import { createContext, useContext, useEffect, useRef, useState, useCallback } from 'react'
import { io } from 'socket.io-client'
import { getStoredToken, getApiBase } from '../lib/api.js'
import { useAuth } from './AuthContext.jsx'

const SocketContext = createContext(null)
const MAX_ACTIVITY = 30

export function SocketProvider({ children }) {
  const { user } = useAuth()
  const socketRef = useRef(null)
  const [connected, setConnected] = useState(false)
  const [unreadCount, setUnreadCount] = useState(0)
  const [activityUnread, setActivityUnread] = useState(0)
  const [activities, setActivities] = useState([])
  const activityHandlersRef = useRef(new Set())

  useEffect(() => {
    if (!user) {
      if (socketRef.current) {
        socketRef.current.disconnect()
        socketRef.current = null
        setConnected(false)
      }
      setActivities([])
      setActivityUnread(0)
      return
    }

    const token = getStoredToken()
    if (!token) return

    const base = getApiBase() || window.location.origin
    const socket = io(base, {
      auth: { token },
      transports: ['websocket', 'polling'],
      reconnectionAttempts: 10,
      reconnectionDelay: 800,
      reconnectionDelayMax: 4000,
      timeout: 20000,
    })

    socket.on('connect', () => setConnected(true))
    socket.on('disconnect', () => setConnected(false))

    socket.on('activity_notification', (payload) => {
      setActivities((prev) => [payload, ...prev].slice(0, MAX_ACTIVITY))
      setActivityUnread((n) => n + 1)
      for (const fn of activityHandlersRef.current) {
        try {
          fn(payload)
        } catch {
          /* ignore listener errors */
        }
      }
    })

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

  const clearActivityUnread = useCallback(() => setActivityUnread(0), [])

  const subscribeActivity = useCallback((handler) => {
    activityHandlersRef.current.add(handler)
    return () => activityHandlersRef.current.delete(handler)
  }, [])

  return (
    <SocketContext.Provider
      value={{
        getSocket,
        connected,
        unreadCount,
        incrementUnread,
        resetUnread,
        setUnread,
        activities,
        activityUnread,
        clearActivityUnread,
        subscribeActivity,
      }}
    >
      {children}
    </SocketContext.Provider>
  )
}

export function useSocket() {
  return useContext(SocketContext)
}
