/** @param {'patient'|'therapist'|'admin'} role */
export function dashboardPath(role) {
  if (role === 'patient') return '/patient-dashboard'
  if (role === 'therapist') return '/therapist-dashboard'
  if (role === 'admin') return '/admin-dashboard'
  return '/login'
}

/** Admin app URL (separate Vite app, default port 5174). */
export function adminPortalUrl(path = '/admin-dashboard') {
  const base = (import.meta.env.VITE_ADMIN_URL || 'http://localhost:5174').replace(/\/$/, '')
  const p = path.startsWith('/') ? path : `/${path}`
  return `${base}${p}`
}

/** Full URL or in-app path for the user's portal home. */
export function portalUrl(role) {
  if (role === 'admin') return adminPortalUrl('/admin-dashboard')
  return dashboardPath(role)
}

export function portalLabel(role) {
  if (role === 'patient') return 'Patient Portal'
  if (role === 'therapist') return 'Therapist Portal'
  if (role === 'admin') return 'Admin Panel'
  return 'My Portal'
}

/** Try for free / free trial: portal if signed in, otherwise login. */
export function trialEntryPath(user) {
  if (user?.role) return portalUrl(user.role)
  return '/login'
}

export function isExternalPortalHref(href) {
  return typeof href === 'string' && /^https?:\/\//i.test(href)
}

/** Navigate after login (admin opens separate app). */
export function goToPortal(navigate, role, options = {}) {
  const dest = portalUrl(role)
  if (isExternalPortalHref(dest)) {
    window.location.assign(dest)
    return
  }
  navigate(dest, options)
}

/**
 * Pricing card CTA destination.
 * try-free → portal or login; paid plans → therapist checkout (guests) or role portal when logged in.
 */
export function planCtaHref(plan, user, interval = 'yearly') {
  const slug = plan?.slug || ''
  if (slug === 'try-free') return trialEntryPath(user)

  if (user?.role === 'patient') return portalUrl('patient')
  if (user?.role === 'therapist') return '/therapist-subscription'
  if (user?.role === 'admin') return portalUrl('admin')

  return `/therapist-checkout?plan=${slug}&interval=${interval}`
}

/** Avoid sending users to another role's portal after login. */
export function canAccessPath(role, pathname) {
  if (typeof pathname !== 'string' || !pathname.startsWith('/')) return false
  if (pathname.startsWith('/admin')) return role === 'admin'
  if (pathname.startsWith('/therapist')) return role === 'therapist'
  if (pathname.startsWith('/patient')) return role === 'patient'
  return true
}
