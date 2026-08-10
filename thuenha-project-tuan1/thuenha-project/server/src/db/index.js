import fs from 'node:fs';
import path from 'node:path';
import Database from 'better-sqlite3';
import { drizzle } from 'drizzle-orm/better-sqlite3';
import * as schema from './schema.js';

const DB_PATH = process.env.DATABASE_PATH || './data/thuenha.db';
fs.mkdirSync(path.dirname(DB_PATH), { recursive: true });

const sqlite = new Database(DB_PATH);

// WAL mode: đọc/ghi đồng thời tốt hơn, cần thiết vì SQLite mặc định lock
// toàn bộ file khi ghi. Với 1 admin ghi + nhiều người đọc thì WAL là bắt buộc.
sqlite.pragma('journal_mode = WAL');

// SQLite tắt foreign key constraint mặc định — phải bật thủ công, nếu không
// thì onDelete: 'cascade' trong schema.js sẽ KHÔNG có tác dụng gì cả.
sqlite.pragma('foreign_keys = ON');

export const db = drizzle(sqlite, { schema });

// Dùng khi cần backup thủ công hoặc đóng kết nối khi shutdown app
export const rawSqlite = sqlite;
