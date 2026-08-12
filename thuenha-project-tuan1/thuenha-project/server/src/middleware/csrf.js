import { doubleCsrf } from 'csrf-csrf';
import { env } from '../config/env.js';

// Vì JWT nằm trong httpOnly cookie, trình duyệt sẽ tự đính kèm cookie vào
// MỌI request kể cả request giả mạo từ site khác (đây là bản chất của CSRF
// attack). Route GET không cần vì không đổi state, chỉ áp cho POST/PUT/DELETE.
const { generateToken, doubleCsrfProtection } = doubleCsrf({
  getSecret: () => env.CSRF_SECRET,
  cookieName: 'x-csrf-token',
  cookieOptions: {
    httpOnly: true,
    sameSite: 'lax',
    secure: env.NODE_ENV === 'production',
  },
});

export { generateToken, doubleCsrfProtection };
