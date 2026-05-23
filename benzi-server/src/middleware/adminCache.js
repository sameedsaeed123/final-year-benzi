import { adminCacheMiddleware, invalidateAdminCache } from '../services/adminCacheService.js'

export { invalidateAdminCache }

/** Standard TTLs for admin read endpoints (seconds). */
export const adminCache = {
  dashboard: adminCacheMiddleware(45),
  list: adminCacheMiddleware(60),
  revenue: adminCacheMiddleware(90),
}
