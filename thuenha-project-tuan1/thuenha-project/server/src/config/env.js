import { z } from 'zod';
import 'dotenv/config';

// Tự động cấp secret mặc định cho dev/test để không crash nếu quên set .env
if (process.env.NODE_ENV !== 'production') {
  if (!process.env.JWT_SECRET) process.env.JWT_SECRET = 'default_jwt_secret_for_development_min_32_chars';
  if (!process.env.CSRF_SECRET) process.env.CSRF_SECRET = 'default_csrf_secret_for_development_min_32_chars';
}

const envSchema = z.object({
  PORT: z.coerce.number().default(4000),
  NODE_ENV: z.enum(['development', 'production', 'test']).default('development'),
  JWT_SECRET: z.string().min(32, 'JWT_SECRET phải >= 32 ký tự'),
  CSRF_SECRET: z.string().min(32, 'CSRF_SECRET phải >= 32 ký tự'),
  DATABASE_PATH: z.string().default('./data/thuenha.db'),
});

export const env = envSchema.parse(process.env);
