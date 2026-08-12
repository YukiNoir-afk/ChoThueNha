import { backupDatabase } from './src/utils/backup.js';

backupDatabase().then(() => {
  console.log('Done testing backup.');
});
