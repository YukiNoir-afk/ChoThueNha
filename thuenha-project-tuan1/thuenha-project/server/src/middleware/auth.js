import jwt from 'jsonwebtoken';
import { AppError } from './errorHandler.js';

// Quyết định đã chốt: JWT lưu trong httpOnly cookie, KHÔNG dùng localStorage.
// Vì frontend + backend chung 1 domain (kiến trúc monolith), cookie là lựa
// chọn an toàn hơn (JS không đọc được token -> chống XSS đánh cắp token).
// Đổi lại, các route POST/PUT/DELETE bắt buộc phải có CSRF token đi kèm
// (xem csrf.js) — đừng bỏ bước này chỉ vì "đỡ phải làm".

const COOKIE_NAME = 'thuenha_token';

export function signAuthCookie(res, payload) {
  const token = jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '7d' });
  res.cookie(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 7 * 24 * 60 * 60 * 1000,
  });
}

export function clearAuthCookie(res) {
  res.clearCookie(COOKIE_NAME);
}

export function verifyToken(req, res, next) {
  const token = req.cookies?.[COOKIE_NAME];
  if (!token) return next(new AppError('Chưa đăng nhập', 401));

  try {
    req.admin = jwt.verify(token, process.env.JWT_SECRET);
    next();
  } catch {
    next(new AppError('Token không hợp lệ hoặc đã hết hạn', 401));
  }
}
