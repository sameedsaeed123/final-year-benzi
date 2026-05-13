import bcrypt from 'bcryptjs'
import jwt from 'jsonwebtoken'
import { User } from '../models/User.js'
import { env } from '../config/environment.js'
import { ensureProfilesAfterAuth } from './profileService.js'

const SALT_ROUNDS = 12

export async function registerUser(payload) {
  const existing = await User.findOne({ email: payload.email })
  if (existing) {
    const err = new Error('An account with this email already exists')
    err.statusCode = 409
    throw err
  }
  const passwordHash = await bcrypt.hash(payload.password, SALT_ROUNDS)
  const user = await User.create({
    email: payload.email,
    passwordHash,
    role: payload.role,
    firstName: payload.firstName,
    lastName: payload.lastName,
    phone: payload.phone || '',
    status: 'VERIFIED',
  })
  await ensureProfilesAfterAuth(user)
  return user
}

export async function loginUser(email, password) {
  const user = await User.findOne({ email: email.toLowerCase().trim() }).select('+passwordHash')
  if (!user) {
    const err = new Error('Invalid email or password')
    err.statusCode = 401
    throw err
  }
  if (user.status === 'SUSPENDED') {
    const err = new Error('Account is suspended')
    err.statusCode = 403
    throw err
  }
  const ok = await bcrypt.compare(password, user.passwordHash)
  if (!ok) {
    const err = new Error('Invalid email or password')
    err.statusCode = 401
    throw err
  }
  return user
}

export async function changeUserPassword(userId, oldPassword, newPassword) {
  const user = await User.findById(userId).select('+passwordHash')
  if (!user) {
    const err = new Error('User not found')
    err.statusCode = 404
    throw err
  }
  const ok = await bcrypt.compare(oldPassword, user.passwordHash)
  if (!ok) {
    const err = new Error('Current password is incorrect')
    err.statusCode = 401
    throw err
  }
  user.passwordHash = await bcrypt.hash(newPassword, SALT_ROUNDS)
  await user.save()
  return user
}

export async function updateUserProfile(userId, fields) {
  const user = await User.findById(userId)
  if (!user) {
    const err = new Error('User not found')
    err.statusCode = 404
    throw err
  }
  if (fields.firstName !== undefined) user.firstName = String(fields.firstName).trim()
  if (fields.lastName !== undefined) user.lastName = String(fields.lastName).trim()
  if (fields.phone !== undefined) user.phone = String(fields.phone).trim()
  if (fields.profileImageUrl !== undefined) user.profileImageUrl = String(fields.profileImageUrl).trim().slice(0, 2000)
  await user.save()
  return user
}

export async function setUserProfileImageUrl(userId, publicPath) {
  const user = await User.findById(userId)
  if (!user) {
    const err = new Error('User not found')
    err.statusCode = 404
    throw err
  }
  user.profileImageUrl = publicPath
  await user.save()
  return user
}

export function issueAccessToken(user, remember) {
  const expiresIn = remember ? env.JWT_EXPIRES_IN_REMEMBER : env.JWT_EXPIRES_IN_SESSION
  return jwt.sign(
    {
      sub: user._id.toString(),
      role: user.role,
      email: user.email,
    },
    env.JWT_SECRET,
    { expiresIn }
  )
}

export function toPublicUser(user) {
  return {
    id: user._id.toString(),
    email: user.email,
    role: user.role,
    firstName: user.firstName,
    lastName: user.lastName,
    phone: user.phone || '',
    profileImageUrl: user.profileImageUrl || '',
  }
}
