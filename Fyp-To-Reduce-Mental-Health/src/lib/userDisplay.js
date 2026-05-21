/**
 * Display names from auth user (JWT /me payload).
 * Used for portal headers without changing layout.
 */

/** Short name for "Welcome, …" and header chip */
export function displayFirstName(user) {
  const n = user?.firstName?.trim()
  return n || 'there'
}

/** "First Last" for profile cards */
export function displayFullName(user) {
  const f = user?.firstName?.trim() || ''
  const l = user?.lastName?.trim() || ''
  const full = `${f} ${l}`.trim()
  return full || displayFirstName(user)
}
