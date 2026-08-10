import { Router } from 'express';
import bcrypt from 'bcryptjs';
import { eq } from 'drizzle-orm';
import { z } from 'zod';

import { db } from '../db/index.js';
import { adminUsers } from '../db/schema.js';
import { signAuthCookie, clearAuthCookie, verifyToken } from '../middleware/auth.js';
import { generateToken } from '../middleware/csrf.js';
import { loginLimiter } from '../middleware/rateLimiters.js';
import { AppError } from '../middleware/errorHandler.js';

const router = Router();

const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});

router.post('/login', loginLimiter, async (req, res, next) => {
  try {
    const { email, password } = loginSchema.parse(req.body);

    const admin = db.select().from(adminUsers).where(eq(adminUsers.email, email)).get();
    if (!admin) throw new AppError('Sai email hoặc mật khẩu', 401);

    const ok = await bcrypt.compare(password, admin.passwordHash);
    if (!ok) throw new AppError('Sai email hoặc mật khẩu', 401);

    signAuthCookie(res, { adminId: admin.id, email: admin.email });
    const csrfToken = generateToken(req, res);

    res.json({ email: admin.email, csrfToken });
  } catch (err) {
    next(err);
  }
});

router.post('/logout', (req, res) => {
  clearAuthCookie(res);
  res.status(204).end();
});

router.get('/me', verifyToken, (req, res) => {
  res.json({ email: req.admin.email });
});

export default router;
