import 'dotenv/config';
import { migrate } from 'drizzle-orm/better-sqlite3/migrator';
import { db, rawSqlite } from './index.js';

// Chạy: npm run db:migrate
// Idempotent — chạy nhiều lần không sao, drizzle tự track migration nào đã áp dụng.
migrate(db, { migrationsFolder: './drizzle' });

console.log('Migration hoàn tất.');
rawSqlite.close();
