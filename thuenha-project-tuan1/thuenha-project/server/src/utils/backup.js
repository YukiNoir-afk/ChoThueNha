import fs from 'node:fs/promises';
import path from 'node:path';
import cron from 'node-cron';
import { env } from '../config/env.js';

export async function backupDatabase() {
  const dbPath = path.resolve(env.DATABASE_PATH);
  const backupDir = path.resolve('backups');
  
  try {
    // Tạo thư mục backups nếu chưa có
    await fs.mkdir(backupDir, { recursive: true });

    // Lấy thời gian để đặt tên file
    const now = new Date();
    const timestamp = now.toISOString().replace(/[:.]/g, '-');
    const backupFileName = `backup_${timestamp}.db`;
    const backupFilePath = path.join(backupDir, backupFileName);

    // Copy file
    await fs.copyFile(dbPath, backupFilePath);
    console.log(`[Backup] Đã tạo bản sao lưu: ${backupFileName}`);

    // Dọn dẹp bản sao lưu cũ (giữ lại 7 bản gần nhất)
    const files = await fs.readdir(backupDir);
    const dbFiles = files
      .filter(f => f.startsWith('backup_') && f.endsWith('.db'))
      .map(f => ({ name: f, path: path.join(backupDir, f) }));
    
    // Sort theo thời gian tạo, cũ nhất lên trước (hoặc chỉ lấy theo tên vì có timestamp)
    dbFiles.sort((a, b) => a.name.localeCompare(b.name));

    if (dbFiles.length > 7) {
      const filesToDelete = dbFiles.slice(0, dbFiles.length - 7);
      for (const file of filesToDelete) {
        await fs.unlink(file.path);
        console.log(`[Backup] Đã xoá bản sao lưu cũ: ${file.name}`);
      }
    }
  } catch (err) {
    console.error(`[Backup] Lỗi khi sao lưu dữ liệu:`, err);
  }
}

// Chạy cronjob lúc 02:00 sáng mỗi ngày
export function startBackupCron() {
  if (env.NODE_ENV !== 'production') {
    console.log('[Backup] Bỏ qua cronjob sao lưu vì không phải môi trường production.');
    return;
  }
  
  console.log('[Backup] Cronjob đã được kích hoạt (Chạy lúc 02:00 mỗi ngày).');
  cron.schedule('0 2 * * *', () => {
    console.log('[Backup] Bắt đầu tiến trình sao lưu định kỳ...');
    backupDatabase();
  });
}
