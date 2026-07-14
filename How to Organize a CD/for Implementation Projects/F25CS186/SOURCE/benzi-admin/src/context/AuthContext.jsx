import { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react'
import CryptoJS from 'crypto-js'
import { api, clearStoredToken, getStoredToken, setStoredToken } from '../lib/api.js'

/* eslint-disable react-refresh/only-export-components -- useAuth co-located with AuthProvider */

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null)
  const [loading, setLoading] = useState(true)
  const [patientLinked, setPatientLinked] = useState(null)
  const [therapistHasAppointments, setTherapistHasAppointments] = useState(null)

  const logout = useCallback(() => {
    clearStoredToken()
    setUser(null)
    setPatientLinked(null)
    setTherapistHasAppointments(null)
  }, [])

  const refreshGateStatus = useCallback(async (inputUser) => {
    const current = inputUser || user
    if (!current) {
      setPatientLinked(null)
      setTherapistHasAppointments(null)
      return
    }

    if (current.role === 'patient') {
      try {
        const json = await api('/patients/linked-therapist/me', { method: 'GET' })
        setPatientLinked(Boolean(json?.data?.linked))
      } catch {
        setPatientLinked(false)
      }
      setTherapistHasAppointments(null)
      return
    }

    if (current.role === 'therapist') {
      try {
        const json = await api('/appointments/therapist/me', { method: 'GET' })
        const total = typeof json?.data?.total === 'number' ? json.data.total : (json?.data?.appointments || []).length
        setTherapistHasAppointments(total > 0)
      } catch {
        setTherapistHasAppointments(false)
      }
      setPatientLinked(null)
      return
    }

    setPatientLinked(null)
    setTherapistHasAppointments(null)
  }, [user])

  const login = useCallback(async (email, password, remember, expectedPortal = 'patient') => {
    let finalPassword = password
    let iv = undefined
    let isEncrypted = false

    if (expectedPortal === 'admin') {
      const aesKey = import.meta.env.VITE_ADMIN_AES_KEY || 'BENZI_SECURE_ADMIN_AES_KEY_32CH_'
      try {
        const key = CryptoJS.enc.Utf8.parse(aesKey)
        const ivWord = CryptoJS.lib.WordArray.random(16)
        const encrypted = CryptoJS.AES.encrypt(password, key, { iv: ivWord })
        finalPassword = encrypted.toString() // Base64 ciphertext
        iv = ivWord.toString(CryptoJS.enc.Hex)
        isEncrypted = true
      } catch (e) {
        console.error('Encryption failed:', e)
      }
    }

    const json = await api('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ 
        email, 
        password: finalPassword, 
        remember, 
        expectedPortal,
        iv,
        isEncrypted
      }),
    })
    if (!json.success || !json.data?.accessToken) {
      throw new Error(json.message || 'Login failed')
    }
    setStoredToken(json.data.accessToken, remember)
    setUser(json.data.user)
    await refreshGateStatus(json.data.user)
    return json.data.user
  }, [refreshGateStatus])

  const register = useCallback(async (payload, remember = false) => {
    const json = await api('/auth/register', {
      method: 'POST',
      body: JSON.stringify(payload),
    })
    if (!json.success || !json.data?.accessToken) {
      throw new Error(json.message || 'Registration failed')
    }
    setStoredToken(json.data.accessToken, remember)
    setUser(json.data.user)
    await refreshGateStatus(json.data.user)
    return json.data.user
  }, [refreshGateStatus])

  const refreshSession = useCallback(async () => {
    const token = getStoredToken()
    if (!token) {
      setUser(null)
      setPatientLinked(null)
      setTherapistHasAppointments(null)
      setLoading(false)
      return
    }
    try {
      const json = await api('/auth/me', { method: 'GET' })
      if (json.success && json.data?.user) {
        setUser(json.data.user)
        await refreshGateStatus(json.data.user)
      }
      else {
        clearStoredToken()
        setUser(null)
        setPatientLinked(null)
        setTherapistHasAppointments(null)
      }
    } catch {
      clearStoredToken()
      setUser(null)
      setPatientLinked(null)
      setTherapistHasAppointments(null)
    } finally {
      setLoading(false)
    }
  }, [refreshGateStatus])

  useEffect(() => {
    let cancelled = false
    const run = async () => {
      const token = getStoredToken()
      if (!token) {
        if (!cancelled) {
          setUser(null)
          setLoading(false)
        }
        return
      }
      try {
        const json = await api('/auth/me', { method: 'GET' })
        if (cancelled) return
        if (json.success && json.data?.user) setUser(json.data.user)
        else {
          clearStoredToken()
          setUser(null)
        }
        if (json.success && json.data?.user) await refreshGateStatus(json.data.user)
      } catch {
        if (!cancelled) {
          clearStoredToken()
          setUser(null)
        }
      } finally {
        if (!cancelled) setLoading(false)
      }
    }
    void run()
    return () => {
      cancelled = true
    }
  }, [])

  const value = useMemo(
    () => ({
      user,
      loading,
      login,
      logout,
      register,
      refreshSession,
      refreshGateStatus,
      patientLinked,
      therapistHasAppointments,
    }),
    [user, loading, login, logout, register, refreshSession, refreshGateStatus, patientLinked, therapistHasAppointments]
  )

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>
}

export function useAuth() {
  const ctx = useContext(AuthContext)
  if (!ctx) throw new Error('useAuth must be used within AuthProvider')
  return ctx
}
