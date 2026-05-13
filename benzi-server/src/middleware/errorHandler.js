import { sendError } from '../utils/responseUtils.js'

export function errorHandler(err, req, res, next) {
  if (res.headersSent) return next(err)

  if (err.code === 'LIMIT_FILE_SIZE') {
    return sendError(res, 'File too large (max 3MB)', 400)
  }

  const statusCode = err.statusCode || err.status || 500
  const isProd = process.env.NODE_ENV === 'production'
  const message =
    statusCode < 500 ? err.message : isProd ? 'Internal server error' : err.message

  if (!isProd) console.error(`[${new Date().toISOString()}] ${req.method} ${req.path}`, err)

  return sendError(res, message, statusCode, err.errors || null)
}
