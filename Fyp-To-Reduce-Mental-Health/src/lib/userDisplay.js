export function displayFirstName(user) {
  const n = user?.firstName?.trim()
  return n || 'there'
}

export function displayFullName(user) {
  const f = user?.firstName?.trim() || ''
  const l = user?.lastName?.trim() || ''
  const full = `${f} ${l}`.trim()
  return full || displayFirstName(user)
}
