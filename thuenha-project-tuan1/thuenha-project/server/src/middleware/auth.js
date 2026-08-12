import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';
import { env } from '../config/env.js';

// Quyết định đã chốt: JWT lưu trong httpOnly cookie, KHÔNG dùng localStorage.
// Vì frontend + backend chung 1 domain (kiến trúc monolith), cookie là lựa
// chọn an toàn hơn (JS không đọc được token -> chống XSS đánh cắp token).
// Đổi lại, các route POST/PUT/DELETE bắt buộc phải có CSRF token đi kèm
// (xem csrf.js) — đừng bỏ bước này chỉ vì "đỡ phải làm".

export function signAuthCookie(res, payload) {
  const token = jwt.sign(payload, env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie('token', token, {
    httpOnly: true,
    secure: env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie('token');
}

export function verifyToken(req, res, next) {
  const token = req.cookies?.token;
  if (!token) return next(new AppError('Vui lòng đăng nhập', 401));

  try {
    req.admin = jwt.verify(token, env.JWT_SECRET);
    next();
  } catch {
    next(new AppError('Token không hợp lệ hoặc đã hết hạn', 401));
  }
}
