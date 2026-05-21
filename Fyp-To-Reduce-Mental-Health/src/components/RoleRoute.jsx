import { Navigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext.jsx'
import { dashboardPath } from '../lib/authPaths.js'

/**
 * @param {object} props
 * @param {import('react').ReactNode} props.children
 * @param {('patient'|'therapist'|'admin')[]} props.allow
 */
export default function RoleRoute({ children, allow }) {
  const { user, loading, patientLinked } = useAuth()
  const location = useLocation()

  if (loading) return null
  if (user?.role === 'patient' && patientLinked === null) return null

  if (!user) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }

  if (!allow.includes(user.role)) {
    return <Navigate to={dashboardPath(user.role)} replace />
  }

  if (user.role === 'therapist') {
    if (user.status === 'PENDING_VERIFICATION') {
      if (location.pathname !== '/therapist-verification') {
        return <Navigate to="/therapist-verification" replace />
      }
    } else {
      if (location.pathname === '/therapist-verification') {
        return <Navigate to="/therapist-dashboard" replace />
      }
    }
  }

  if (user.role === 'patient' && patientLinked === false) {
    const allowUnlinked = ['/patient-appointments']
    if (!allowUnlinked.includes(location.pathname)) {
      return <Navigate to="/doctors" replace />
    }
  }

  return children
}
