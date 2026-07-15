export function successResponse(res, data, message = 'Success', statusCode = 200) {
  return res.status(statusCode).json({
    success: true,
    message,
    data,
  });
}

export function errorResponse(res, message = 'Error', errors = [], statusCode = 400) {
  return res.status(statusCode).json({
    success: false,
    message,
    errors,
  });
}
