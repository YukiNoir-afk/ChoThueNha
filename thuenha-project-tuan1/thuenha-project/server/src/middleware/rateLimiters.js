import rateLimit from 'express-rate-limit';

export const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  message: { error: { message: 'Quá nhiều lần thử, vui lòng thử lại sau 15 phút' } },
  standardHeaders: true,
  legacyHeaders: false,
});
