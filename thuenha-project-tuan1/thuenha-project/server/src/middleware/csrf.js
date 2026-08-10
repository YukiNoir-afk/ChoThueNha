import { doubleCsrf } from 'csrf-csrf';

// Vì JWT nằm trong httpOnly cookie, trình duyệt sẽ tự đính kèm cookie vào
// MỌI request kể cả request giả mạo từ site khác (đây là bản chất của CSRF
// attack). Route GET không cần vì không đổi state, chỉ áp cho POST/PUT/DELETE.
const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => process.env.CSRF_SECRET,
  cookieName: 'thuenha_csrf',
  cookieOptions: {
    sameSite: 'lax',
    secure: process.env.NODE_ENV === 'production',
  },
});

export { generateToken, doubleCsrfProtection };

