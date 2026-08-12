import 'dotenv/config';
import { createApp } from './app.js';
import { env } from './config/env.js';
import { startBackupCron } from './utils/backup.js';

async function startServer() {
  const app = createApp();
  const PORT = env.PORT;

  const server = app.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
    console.log(`[Server] Environment: ${env.NODE_ENV}`);
    
    // Kích hoạt Cronjob backup dữ liệu
    startBackupCron();
  });

  // Graceful shutdown
  const shutdown = () => {
    console.log('\n[Server] Shutting down gracefuly...');
    server.close(() => {
      console.log('[Server] Closed out remaining connections.');
      process.exit(0);
    });
  };

  process.on('SIGTERM', shutdown);
  process.on('SIGINT', shutdown);
}

startServer();
