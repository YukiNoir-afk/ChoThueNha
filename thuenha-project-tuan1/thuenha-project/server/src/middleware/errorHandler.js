export class AppError extends Error {
  constructor(message, statusCode = 400) {
    super(message);
    this.statusCode = statusCode;
  }
}

// eslint-disable-next-line no-unused-vars
export function errorHandler(err, req, res, next) {
  const statusCode = err.statusCode || 500;

  if (statusCode >= 500) {
    req.log?.error(err);
  }

  res.status(statusCode).json({
    error: {
      message: err.message || 'Đã có lỗi xảy ra',
      // Chỉ trả chi tiết validation (Zod) khi có, không leak stack trace ra client
      details: err.details,
    },
  });
}
