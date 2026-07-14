import { adminCacheMiddleware, invalidateAdminCache } from '../services/adminCacheService.js'

export { invalidateAdminCache }
export const adminCache = {
  dashboard: adminCacheMiddleware(45),
  list: adminCacheMiddleware(60),
  revenue: adminCacheMiddleware(90),
}
