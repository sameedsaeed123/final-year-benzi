/**
 * PKR amounts are stored in minor units (paisa) — same as cents.
 * e.g. 40000 → Rs. 400
 */
export function formatPkrPrice(minorUnits) {
  const n = Number(minorUnits)
  if (!Number.isFinite(n) || n <= 0) return '0'
  return String(Math.round(n / 100))
}

export function formatPkrPriceLabel(minorUnits) {
  return `Rs. ${formatPkrPrice(minorUnits)}`
}
