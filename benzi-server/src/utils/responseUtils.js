export function sendSuccess(res, data, message = 'OK', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    data,
    message,
    statusCode,
  })
}

export function sendError(res, message, statusCode = 400, errors = null, code = null) {
  const body = {
    success: false,
    data: null,
    message,
    statusCode,
  }
  if (errors) body.errors = errors
  if (code) body.code = code
  return res.status(statusCode).json(body)
}
