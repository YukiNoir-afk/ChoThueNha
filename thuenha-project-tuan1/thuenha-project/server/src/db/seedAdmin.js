import 'dotenv/config';
import bcrypt from 'bcryptjs';
import { db, rawSqlite } from './index.js';
import { adminUsers } from './schema.js';
import { eq } from 'drizzle-orm';

// Chạy: npm run seed:admin
// Tạo admin đầu tiên nếu chưa có. Chạy nhiều lần an toàn (idempotent).

const ADMIN_EMAIL = 'admin@thuenha.vn';
const ADMIN_PASSWORD = 'admin12345'; // Chỉ cho dev — đổi ngay khi deploy production!

async function seedAdmin() {
  const existing = db
    .select()
    .from(adminUsers)
    .where(eq(adminUsers.email, ADMIN_EMAIL))
    .get();

  if (existing) {
    console.log(`Admin "${ADMIN_EMAIL}" đã tồn tại, bỏ qua.`);
    rawSqlite.close();
    return;
  }

  const passwordHash = await bcrypt.hash(ADMIN_PASSWORD, 12);

  db.insert(adminUsers)
    .values({ email: ADMIN_EMAIL, passwordHash })
    .run();

  console.log(`Đã tạo admin: ${ADMIN_EMAIL} / ${ADMIN_PASSWORD}`);
  console.log('⚠️  Đổi mật khẩu này trước khi deploy production!');
  rawSqlite.close();
}

seedAdmin().catch((err) => {
  console.error('Lỗi seed admin:', err);
  rawSqlite.close();
  process.exit(1);
});
