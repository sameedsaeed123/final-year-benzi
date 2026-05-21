import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import { sendError } from '../utils/responseUtils.js'

export async function verifyJWT(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  if (!token) {
    return sendError(res, 'Authentication required', 401)
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub).select('email role firstName lastName phone status profileImageUrl')
    if (!user || user.status === 'SUSPENDED') {
      return sendError(res, 'Invalid or expired session', 401)
    }
    req.user = {
      id: user._id.toString(),
      email: user.email,
      role: user.role,
      firstName: user.firstName,
      lastName: user.lastName,
      phone: user.phone || '',
      profileImageUrl: user.profileImageUrl || '',
    }
    return next()
  } catch {
    return sendError(res, 'Invalid or expired token', 401)
  }
}

export function requireRoles(...roles) {
  return (req, res, next) => {
    if (!req.user) return sendError(res, 'Authentication required', 401)
    if (!roles.includes(req.user.role)) {
      return sendError(res, 'You do not have access to this resource', 403)
    }
    next()
  }
}

export async function optionalVerifyJWT(req, res, next) {
  const header = req.headers.authorization || ''
  const token = header.startsWith('Bearer ') ? header.slice(7) : null
  console.log(`[optionalVerifyJWT] Header: "${header}" | Token: "${token ? token.slice(0, 15) + '...' : 'null'}"`)
  if (!token) {
    return next()
  }
  try {
    const payload = jwt.verify(token, process.env.JWT_SECRET)
    const user = await User.findById(payload.sub).select('email role firstName lastName phone status profileImageUrl')
    if (user && user.status !== 'SUSPENDED') {
      req.user = {
        id: user._id.toString(),
        email: user.email,
        role: user.role,
        firstName: user.firstName,
        lastName: user.lastName,
        phone: user.phone || '',
        profileImageUrl: user.profileImageUrl || '',
      }
      console.log(`[optionalVerifyJWT] Successfully authenticated user: ${user.email} (ID: ${user._id})`)
    } else {
      console.log(`[optionalVerifyJWT] User not found or suspended: ${payload.sub}`)
    }
    return next()
  } catch (err) {
    console.error(`[optionalVerifyJWT] JWT Verification failed:`, err.message)
    return next()
  }
}
