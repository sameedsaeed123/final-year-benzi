/** @param {'patient'|'therapist'|'admin'} role */
export function dashboardPath(role) {
  if (role === 'patient') return '/patient-dashboard'
  if (role === 'therapist') return '/therapist-dashboard'
  if (role === 'admin') return '/admin-dashboard'
  return '/login'
}

/** Avoid sending users to another role's portal after login. */
export function canAccessPath(role, pathname) {
  if (typeof pathname !== 'string' || !pathname.startsWith('/')) return false
  if (pathname.startsWith('/admin')) return role === 'admin'
  if (pathname.startsWith('/therapist')) return role === 'therapist'
  if (pathname.startsWith('/patient')) return role === 'patient'
  return true
}
